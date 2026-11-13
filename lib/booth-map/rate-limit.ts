import { eq, sql } from 'drizzle-orm'
import { authAttempts } from './schema'
import type { AnyDb } from './types'
import { hashToken } from './tokens'

/**
 * Counters stored in Neon (auth_attempts), because Upstash is not configured and
 * an in-memory limiter does not hold across server instances (SPEC section 9).
 * Keys are hashed before storage, so raw IP addresses are never written.
 */
export function counterKey(kind: string, value: string): string {
  return `${kind}:${hashToken(value)}`
}

/** True while a key is blocked. */
export async function isBlocked(db: AnyDb, key: string): Promise<boolean> {
  const [row] = await db
    .select({ blocked: sql<boolean>`coalesce(${authAttempts.blockedUntil} > now(), false)` })
    .from(authAttempts)
    .where(eq(authAttempts.key, key))
  return Boolean(row?.blocked)
}

/**
 * Records one event for `key` in a fixed window and returns the count so far.
 * When the count reaches `blockAt`, the key is blocked for `blockSeconds`.
 * One atomic statement, so concurrent requests can't both slip under the limit.
 */
export async function recordHit(
  db: AnyDb,
  key: string,
  opts: { windowSeconds: number; blockAt?: number; blockSeconds?: number }
): Promise<{ count: number; blocked: boolean }> {
  const blockAt = opts.blockAt ?? 2_147_483_647
  const blockFor = sql`make_interval(secs => ${opts.blockSeconds ?? 0})`
  const fresh = sql`${authAttempts.windowStart} < now() - make_interval(secs => ${opts.windowSeconds})`
  const nextCount = sql`(case when ${fresh} then 1 else ${authAttempts.count} + 1 end)`
  const [row] = await db
    .insert(authAttempts)
    .values({
      key,
      count: 1,
      windowStart: sql`now()`,
      blockedUntil: sql`case when 1 >= ${blockAt} then now() + ${blockFor} else null end`,
    })
    .onConflictDoUpdate({
      target: authAttempts.key,
      set: {
        count: nextCount,
        windowStart: sql`case when ${fresh} then now() else ${authAttempts.windowStart} end`,
        blockedUntil: sql`case when ${nextCount} >= ${blockAt} then now() + ${blockFor} else ${authAttempts.blockedUntil} end`,
      },
    })
    .returning({ count: authAttempts.count, blocked: sql<boolean>`coalesce(${authAttempts.blockedUntil} > now(), false)` })
  return { count: Number(row.count), blocked: Boolean(row.blocked) }
}
