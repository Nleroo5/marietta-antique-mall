import { and, asc, eq, isNull, lt, sql } from 'drizzle-orm'
import * as schema from './schema'
import { generateToken, hashToken, isWellFormedToken } from './tokens'
import type { AnyDb, VendorSession } from './types'

/**
 * Vendor access: a private link per vendor, no password, no PIN (SPEC section 9,
 * owner's decision). Opening /v/[token] swaps the token for a device cookie and
 * redirects to /vendor, so the token never stays in the address bar.
 *
 * A device cookie is valid only while:
 * - the vendor is active,
 * - the device has not been signed out (revoked_at), and
 * - its link_version equals the vendor's. Resetting a lost link bumps the vendor's
 *   version, which signs out every phone in one statement.
 */
export const VENDOR_COOKIE = 'mam_vendor'
export const VENDOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

/** Only touch last_seen_at once an hour, so browsing doesn't write on every request. */
const LAST_SEEN_THROTTLE = sql`interval '1 hour'`

export async function resolveSession(db: AnyDb, cookieValue: string | undefined | null): Promise<VendorSession | null> {
  if (!isWellFormedToken(cookieValue)) return null
  const rows = await db
    .select({
      vendorId: schema.vendors.id,
      deviceId: schema.vendorDevices.id,
      displayName: schema.vendors.displayName,
      consentAt: schema.vendors.consentAt,
    })
    .from(schema.vendorDevices)
    .innerJoin(schema.vendors, eq(schema.vendors.id, schema.vendorDevices.vendorId))
    .where(
      and(
        eq(schema.vendorDevices.deviceCookieHash, hashToken(cookieValue)),
        isNull(schema.vendorDevices.revokedAt),
        eq(schema.vendorDevices.linkVersion, schema.vendors.linkVersion),
        eq(schema.vendors.status, 'active')
      )
    )
    .limit(1)
  const row = rows[0]
  if (!row) return null

  await db
    .update(schema.vendorDevices)
    .set({ lastSeenAt: sql`now()` })
    .where(and(eq(schema.vendorDevices.id, row.deviceId), lt(schema.vendorDevices.lastSeenAt, sql`now() - ${LAST_SEEN_THROTTLE}`)))

  const booths = await db
    .select({ id: schema.booths.id, number: schema.booths.number })
    .from(schema.booths)
    .where(eq(schema.booths.vendorId, row.vendorId))
    .orderBy(asc(schema.booths.number))

  return { ...row, booths }
}

export type LinkResult =
  | { ok: true; vendorId: string; newCookie: string | null }
  | { ok: false; reason: 'malformed' | 'unknown' | 'inactive' }

/**
 * Handles a visit to /v/[token]. If the request already carries a valid cookie for
 * the same vendor, nothing new is created (repeat QR scans don't pile up devices).
 * Otherwise a new device is recorded, copying the vendor's current link_version from
 * the same read that matched the token, so a reset can't race past it.
 */
export async function openVendorLink(db: AnyDb, token: string, existingCookie?: string | null): Promise<LinkResult> {
  if (!isWellFormedToken(token)) return { ok: false, reason: 'malformed' }

  return db.transaction(async (tx) => {
    const [vendor] = await tx
      .select({ id: schema.vendors.id, status: schema.vendors.status, linkVersion: schema.vendors.linkVersion })
      .from(schema.vendors)
      .where(eq(schema.vendors.tokenHash, hashToken(token)))
      .limit(1)
    if (!vendor) return { ok: false as const, reason: 'unknown' as const }
    if (vendor.status !== 'active') return { ok: false as const, reason: 'inactive' as const }

    const current = await resolveSession(tx as unknown as AnyDb, existingCookie)
    if (current && current.vendorId === vendor.id) return { ok: true as const, vendorId: vendor.id, newCookie: null }

    const cookie = generateToken()
    const [device] = await tx
      .insert(schema.vendorDevices)
      .values({ vendorId: vendor.id, deviceCookieHash: hashToken(cookie), linkVersion: vendor.linkVersion })
      .returning({ id: schema.vendorDevices.id })
    await tx.insert(schema.activityLog).values({ actor: 'vendor', vendorId: vendor.id, deviceId: device.id, action: 'device_added' })
    return { ok: true as const, vendorId: vendor.id, newCookie: cookie }
  })
}

/**
 * Staff action for a lost card: issues a new link and signs out every phone that
 * used the old one, in one transaction. Returns the new token (shown once).
 */
export async function resetVendorLink(db: AnyDb, vendorId: string): Promise<string> {
  const token = generateToken()
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(schema.vendors)
      .set({ tokenHash: hashToken(token), linkVersion: sql`${schema.vendors.linkVersion} + 1` })
      .where(eq(schema.vendors.id, vendorId))
      .returning({ id: schema.vendors.id })
    if (updated.length !== 1) throw new Error('Vendor not found')
    await tx.insert(schema.activityLog).values({ actor: 'admin', vendorId, action: 'link_reset' })
  })
  return token
}
