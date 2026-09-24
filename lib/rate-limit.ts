import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Lightweight, graceful rate limiting for the Sell-or-Donate API routes.
 *
 * If UPSTASH_REDIS_REST_URL / _TOKEN are not configured, every request is
 * allowed (no-op). This lets the feature ship without Upstash and add it later.
 *
 * Adapted for the Next.js App Router: there is no Express-style `res`, so this
 * returns a result object and the caller builds the response.
 */

type Duration = `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`

interface RateLimitOptions {
  prefix: string
  limit: number
  window: Duration
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
}

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return redis
}

const limiters = new Map<string, Ratelimit>()

function getLimiter(prefix: string, tokens: number, window: Duration): Ratelimit {
  const key = `${prefix}:${tokens}:${window}`
  let limiter = limiters.get(key)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(tokens, window),
      prefix: `rl:${prefix}`,
    })
    limiters.set(key, limiter)
  }
  return limiter
}

function windowToMs(window: Duration): number {
  const [amount, unit] = window.split(' ') as [string, string]
  const scale: Record<string, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }
  return Number(amount) * (scale[unit] ?? 60_000)
}

/**
 * Per-instance fallback used when Upstash is absent.
 *
 * It is not shared across serverless instances, so it is weaker than Redis --
 * but Fluid Compute reuses instances, so a burst from one source still gets
 * caught. Previously the absence of Upstash meant no limiting whatsoever.
 */
const memoryHits = new Map<string, number[]>()

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const hits = (memoryHits.get(key) ?? []).filter((t) => now - t < windowMs)
  hits.push(now)
  memoryHits.set(key, hits)

  // Keep the map from growing without bound on a long-lived instance.
  if (memoryHits.size > 5_000) {
    for (const [k, v] of memoryHits) {
      if (v.every((t) => now - t >= windowMs)) memoryHits.delete(k)
    }
  }

  return { success: hits.length <= limit, limit, remaining: Math.max(0, limit - hits.length) }
}

export async function rateLimit(
  req: NextRequest,
  { prefix, limit, window }: RateLimitOptions
): Promise<RateLimitResult> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return memoryRateLimit(`${prefix}:${ip}`, limit, windowToMs(window))
  }

  try {
    const result = await getLimiter(prefix, limit, window).limit(ip)
    return { success: result.success, limit, remaining: result.remaining }
  } catch (err) {
    // Never let a limiter outage take down the form — fail open.
    console.error('Rate limit error (allowing request):', err instanceof Error ? err.message : err)
    return { success: true, limit, remaining: limit }
  }
}
