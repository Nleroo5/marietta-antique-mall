/**
 * Phase 2 server logic: link sign-in, device cookies, link reset, wrong-link
 * counters, card validation, photo checks, posting. Real migration on PGlite.
 */
import { PGlite } from '@electric-sql/pglite'
import { eq } from 'drizzle-orm'
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { beforeAll, describe, expect, it } from 'vitest'
import * as schema from '@/lib/booth-map/schema'
import { openVendorLink, resetVendorLink, resolveSession } from '@/lib/booth-map/access'
import { counterKey, isBlocked, recordHit } from '@/lib/booth-map/rate-limit'
import { createItems, registerUpload, validateCards, verifyPhotos, cleanTitle, countLiveItems } from '@/lib/booth-map/items'
import { isAllowedUploadPathname, isVendorBlobUrl } from '@/lib/booth-map/blob'
import { generateToken, hashToken } from '@/lib/booth-map/tokens'
import type { AnyDb, VendorSession } from '@/lib/booth-map/types'

let db: PgliteDatabase<typeof schema>
let n = 0
const anyDb = () => db as unknown as AnyDb
const UUID = () => crypto.randomUUID()

async function makeVendor(opts: { booths?: string[]; status?: 'active' | 'paused' | 'removed' } = {}) {
  n += 1
  const token = generateToken()
  const [v] = await db
    .insert(schema.vendors)
    .values({ name: `V${n}`, displayName: `Vendor ${n}`, tokenHash: hashToken(token), status: opts.status ?? 'active' })
    .returning()
  const numbers = opts.booths ?? [`T${n}`]
  const booths = await db.insert(schema.booths).values(numbers.map((number) => ({ number, vendorId: v.id }))).returning()
  return { vendor: v, token, booths }
}

const STORE_HOST = 'abc123.public.blob.vercel-storage.com'
const photoUrl = (vendorId: string) => `https://${STORE_HOST}/booth-map/${vendorId}/${UUID()}.jpg`

beforeAll(async () => {
  process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_abc123_testsecret'
  db = drizzle(new PGlite(), { schema })
  await migrate(db, { migrationsFolder: './drizzle/booth-map' })
})

describe('vendor link sign-in', () => {
  it('a valid link creates one device and its cookie resolves to the vendor', async () => {
    const { vendor, token, booths } = await makeVendor()
    const r = await openVendorLink(anyDb(), token)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.created).toBe(true)
    expect(r.cookie).toMatch(/^[A-Za-z0-9_-]{43}$/)
    const s = await resolveSession(anyDb(), r.cookie)
    expect(s?.vendorId).toBe(vendor.id)
    expect(s?.booths.map((b) => b.number)).toEqual([booths[0].number])
    const devices = await db.select().from(schema.vendorDevices).where(eq(schema.vendorDevices.vendorId, vendor.id))
    expect(devices).toHaveLength(1)
    expect(devices[0].deviceCookieHash).toBe(hashToken(r.cookie)) // only the hash is stored
  })

  it('scanning the card again on the same phone adds no device and hands back the same cookie to refresh', async () => {
    const { vendor, token } = await makeVendor()
    const first = await openVendorLink(anyDb(), token)
    if (!first.ok) throw new Error()
    const again = await openVendorLink(anyDb(), token, first.cookie)
    expect(again).toEqual({ ok: true, vendorId: vendor.id, cookie: first.cookie, created: false })
    expect(await db.select().from(schema.vendorDevices).where(eq(schema.vendorDevices.vendorId, vendor.id))).toHaveLength(1)
  })

  it("a phone signed in as one vendor switches cleanly to another vendor's link", async () => {
    const a = await makeVendor()
    const b = await makeVendor()
    const ra = await openVendorLink(anyDb(), a.token)
    if (!ra.ok) throw new Error()
    const rb = await openVendorLink(anyDb(), b.token, ra.cookie)
    expect(rb.ok && rb.created).toBe(true)
    if (!rb.ok) return
    expect(rb.cookie).not.toBe(ra.cookie)
    expect((await resolveSession(anyDb(), rb.cookie))?.vendorId).toBe(b.vendor.id)
  })

  it('rejects malformed, unknown and inactive links without creating devices', async () => {
    expect(await openVendorLink(anyDb(), 'nope')).toEqual({ ok: false, reason: 'malformed' })
    expect(await openVendorLink(anyDb(), generateToken())).toEqual({ ok: false, reason: 'unknown' })
    const paused = await makeVendor({ status: 'paused' })
    expect(await openVendorLink(anyDb(), paused.token)).toEqual({ ok: false, reason: 'inactive' })
    expect(await db.select().from(schema.vendorDevices).where(eq(schema.vendorDevices.vendorId, paused.vendor.id))).toHaveLength(0)
  })

  it('a session ends when the vendor is paused or the device is signed out', async () => {
    const { vendor, token } = await makeVendor()
    const r = await openVendorLink(anyDb(), token)
    if (!r.ok) throw new Error()
    await db.update(schema.vendors).set({ status: 'paused' }).where(eq(schema.vendors.id, vendor.id))
    expect(await resolveSession(anyDb(), r.cookie)).toBeNull()
    await db.update(schema.vendors).set({ status: 'active' }).where(eq(schema.vendors.id, vendor.id))
    expect(await resolveSession(anyDb(), r.cookie)).not.toBeNull()
    await db.update(schema.vendorDevices).set({ revokedAt: new Date() }).where(eq(schema.vendorDevices.vendorId, vendor.id))
    expect(await resolveSession(anyDb(), r.cookie)).toBeNull()
  })

  it('resetting a lost link kills the old link and signs out every phone', async () => {
    const { vendor, token } = await makeVendor()
    const p1 = await openVendorLink(anyDb(), token)
    const p2 = await openVendorLink(anyDb(), token)
    if (!p1.ok || !p2.ok) throw new Error()
    const newToken = await resetVendorLink(anyDb(), vendor.id)
    expect(await resolveSession(anyDb(), p1.cookie)).toBeNull()
    expect(await resolveSession(anyDb(), p2.cookie)).toBeNull()
    expect(await openVendorLink(anyDb(), token)).toEqual({ ok: false, reason: 'unknown' })
    const p3 = await openVendorLink(anyDb(), newToken)
    expect(p3.ok && (await resolveSession(anyDb(), p3.cookie))?.vendorId).toBe(vendor.id)
  })

  it('a garbage or missing cookie resolves to no session', async () => {
    for (const c of [undefined, null, '', 'x', generateToken()]) expect(await resolveSession(anyDb(), c)).toBeNull()
  })
})

describe('wrong-link counters', () => {
  it('blocks a key once it reaches the limit, and stores no raw IP', async () => {
    const key = counterKey('vendor-link-ip', '203.0.113.9')
    expect(key).not.toContain('203.0.113.9')
    for (let i = 1; i <= 9; i++) {
      const r = await recordHit(anyDb(), key, { windowSeconds: 900, blockAt: 10, blockSeconds: 3600 })
      expect(r).toEqual({ count: i, blocked: false })
    }
    expect(await isBlocked(anyDb(), key)).toBe(false)
    expect(await recordHit(anyDb(), key, { windowSeconds: 900, blockAt: 10, blockSeconds: 3600 })).toEqual({ count: 10, blocked: true })
    expect(await isBlocked(anyDb(), key)).toBe(true)
  })

  it('starts a new window once the old one has passed', async () => {
    const key = counterKey('t', UUID())
    await recordHit(anyDb(), key, { windowSeconds: 900 })
    await recordHit(anyDb(), key, { windowSeconds: 900 })
    await db.update(schema.authAttempts).set({ windowStart: new Date(Date.now() - 901_000) }).where(eq(schema.authAttempts.key, key))
    expect((await recordHit(anyDb(), key, { windowSeconds: 900 })).count).toBe(1)
  })

  // PGlite runs these one at a time; this proves the counter math, not database-level concurrency.
  it('many hits in a row are all counted', async () => {
    const key = counterKey('t', UUID())
    await Promise.all(Array.from({ length: 20 }, () => recordHit(anyDb(), key, { windowSeconds: 900 })))
    expect((await recordHit(anyDb(), key, { windowSeconds: 900 })).count).toBe(21)
  })
})

describe('blob paths', () => {
  const v = UUID()
  it('only allows uploads into the vendor’s own folder as <uuid>.jpg', () => {
    expect(isAllowedUploadPathname(`booth-map/${v}/${UUID()}.jpg`, v)).toBe(true)
    expect(isAllowedUploadPathname([`booth-map/${v}/${UUID()}.jpg`], v)).toBe(false) // array coerced to string
    for (const p of [`booth-map/${UUID()}/${UUID()}.jpg`, `booth-map/${v}/../x.jpg`, `booth-map/${v}/${UUID()}.png`, `other/${v}/${UUID()}.jpg`, `booth-map/${v}/a.jpg`]) {
      expect(isAllowedUploadPathname(p, v)).toBe(false)
    }
  })
  it('only accepts https URLs in our own Blob store, in the vendor’s folder, with no suffix', () => {
    expect(isVendorBlobUrl(photoUrl(v), v)).toBe(true)
    expect(isVendorBlobUrl(photoUrl(v).replace('abc123', 'ABC123'), v)).toBe(true) // hostnames are case-insensitive
    for (const u of [
      `https://otherstore.public.blob.vercel-storage.com/booth-map/${v}/${UUID()}.jpg`, // someone else's store
      photoUrl(v).replace('.jpg', '-Xy7aB2.jpg'),
      photoUrl(v).replace(STORE_HOST, STORE_HOST + ':8443'),
      photoUrl(UUID()),
      photoUrl(v).replace('https', 'http'),
      photoUrl(v).replace('public.blob.vercel-storage.com', 'evil.com'),
      `https://evil.com/?x=${STORE_HOST}/booth-map/${v}/${UUID()}.jpg`,
      photoUrl(v) + '?a=1',
      `https://u:p@abc.public.blob.vercel-storage.com/booth-map/${v}/${UUID()}.jpg`,
      'not a url',
    ]) {
      expect(isVendorBlobUrl(u, v)).toBe(false)
    }
  })
})

describe('blob store host', () => {
  it('comes from the store id in the read-write token, and nothing is accepted without one', async () => {
    const { blobStoreHost } = await import('@/lib/booth-map/blob')
    expect(blobStoreHost('vercel_blob_rw_932bpWPgg_secret')).toBe('932bpwpgg.public.blob.vercel-storage.com')
    expect(blobStoreHost('')).toBeNull()
    expect(isVendorBlobUrl(photoUrl(UUID()), UUID(), null)).toBe(false)
  })
})

describe('card validation', () => {
  const session = { vendorId: UUID(), booths: [{ id: UUID(), number: '114' }] }
  const card = (over: Record<string, unknown> = {}) => ({
    url: photoUrl(session.vendorId),
    width: 1600,
    height: 1200,
    title: 'Brass lamp',
    price: '45',
    askInStore: false,
    ...over,
  })

  it('accepts a good card and fills the only booth', () => {
    const r = validateCards([card()], session)
    expect(r.ok && r.cards[0]).toMatchObject({ title: 'Brass lamp', priceCents: 4500, askInStore: false, boothId: session.booths[0].id })
  })

  it('keeps the vendor’s words, only tidying whitespace and invisible characters', () => {
    expect(cleanTitle('  Mid-century\u200b   walnut\ndresser  ')).toBe('Mid-century walnut dresser')
    const r = validateCards([card({ title: '  1950s  “Atomic” lamp ' })], session)
    expect(r.ok && r.cards[0].title).toBe('1950s “Atomic” lamp')
  })

  it('reports each problem against its card', () => {
    const r = validateCards(
      [card(), card({ title: '   ' }), card({ price: 'abc' }), card({ url: photoUrl(UUID()) }), card({ width: 0 })],
      session
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.map((e) => [e.index, e.field])).toEqual([
      [1, 'title'],
      [2, 'price'],
      [3, 'photo'],
      [4, 'photo'],
    ])
  })

  it('"ask in store" needs no price and ignores one sent anyway', () => {
    const r = validateCards([card({ askInStore: true, price: 'whatever' })], session)
    expect(r.ok && r.cards[0]).toMatchObject({ askInStore: true, priceCents: null })
  })

  it('rejects the same photo twice, empty lists, and more than 10 cards', () => {
    const c = card()
    const dup = validateCards([c, { ...c }], session)
    expect(!dup.ok && dup.errors[0]).toMatchObject({ index: 1, field: 'photo' })
    expect(validateCards([], session).ok).toBe(false)
    expect(validateCards(Array.from({ length: 11 }, () => card()), session).ok).toBe(false)
    expect(validateCards('nope', session).ok).toBe(false)
  })

  it('needs a booth choice when the vendor has two, and only their own', () => {
    const two = { vendorId: session.vendorId, booths: [{ id: UUID(), number: '127' }, { id: UUID(), number: '128' }] }
    expect(validateCards([card()], two).ok).toBe(false)
    expect(validateCards([card({ booth: '999' })], two).ok).toBe(false)
    const r = validateCards([card({ booth: '128' })], two)
    expect(r.ok && r.cards[0].boothId).toBe(two.booths[1].id)
  })
})

describe('photo checks', () => {
  const cards = [{ url: 'u1' }, { url: 'u2' }, { url: 'u3' }, { url: 'u4' }, { url: 'u5' }] as never
  it('accepts only existing JPEGs of 5 MB or less whose stored URL is exactly the posted one', async () => {
    const errs = await verifyPhotos(cards, async (url) => {
      if (url === 'u1') return { url, size: 300_000, contentType: 'image/jpeg' }
      if (url === 'u2') return { url, size: 300_000, contentType: 'image/png' }
      if (url === 'u3') return { url, size: 6 * 1024 * 1024, contentType: 'image/jpeg' }
      if (url === 'u5') return { url: 'https://elsewhere/u5', size: 300_000, contentType: 'image/jpeg' }
      throw new Error('BlobNotFoundError')
    })
    expect(errs.map((e) => e.index)).toEqual([1, 2, 3, 4])
  })
})

describe('posting', () => {
  async function signedIn(booths?: string[]) {
    const v = await makeVendor({ booths })
    const r = await openVendorLink(anyDb(), v.token)
    if (!r.ok) throw new Error()
    return { ...v, session: (await resolveSession(anyDb(), r.cookie)) as VendorSession }
  }
  const cardFor = (s: VendorSession, over: Record<string, unknown> = {}) => {
    const r = validateCards([{ url: photoUrl(s.vendorId), width: 1600, height: 1200, title: 'Oak desk', price: '640', askInStore: false, ...over }], s)
    if (!r.ok) throw new Error(JSON.stringify(r))
    return r.cards
  }

  it('the first post needs consent, then records it once', async () => {
    const { session } = await signedIn()
    const cards = cardFor(session)
    expect(await createItems(anyDb(), session, cards, { consent: false })).toMatchObject({ ok: false, code: 'CONSENT_REQUIRED' })
    expect(await db.select().from(schema.items).where(eq(schema.items.vendorId, session.vendorId))).toHaveLength(0)
    const r = await createItems(anyDb(), session, cards, { consent: true })
    expect(r.ok).toBe(true)
    const [v] = await db.select().from(schema.vendors).where(eq(schema.vendors.id, session.vendorId))
    expect(v.consentAt).not.toBeNull()
    // Later posts don't need the box ticked again.
    expect((await createItems(anyDb(), session, cardFor(session), { consent: false })).ok).toBe(true)
  })

  it('creates live items for 30 days with an upload record and an activity row each', async () => {
    const { session } = await signedIn()
    const now = new Date('2026-11-13T15:00:00Z')
    const cards = [...cardFor(session), ...cardFor(session, { askInStore: true, price: null, title: 'Quilt' })]
    const r = await createItems(anyDb(), session, cards, { consent: true, now })
    if (!r.ok) throw new Error(r.message)
    const items = await db.select().from(schema.items).where(eq(schema.items.vendorId, session.vendorId))
    expect(items).toHaveLength(2)
    for (const it of items) {
      expect(it.status).toBe('live')
      expect(it.liveAt?.toISOString()).toBe(now.toISOString())
      expect(it.expiresAt?.toISOString()).toBe(new Date('2026-12-13T15:00:00Z').toISOString())
    }
    expect(items.find((i) => i.title === 'Quilt')).toMatchObject({ askInStore: true, priceCents: null })
    const uploads = await db.select().from(schema.uploads).where(eq(schema.uploads.vendorId, session.vendorId))
    expect(uploads.every((u) => r.itemIds.includes(u.itemId!))).toBe(true)
    const log = await db.select().from(schema.activityLog).where(eq(schema.activityLog.vendorId, session.vendorId))
    expect(log.filter((l) => l.action === 'post')).toHaveLength(2)
    expect(await countLiveItems(anyDb(), session.vendorId)).toBe(2)
  })

  it('a double tap on Post does not create the items twice', async () => {
    const { session } = await signedIn()
    const cards = cardFor(session)
    expect((await createItems(anyDb(), session, cards, { consent: true })).ok).toBe(true)
    expect(await createItems(anyDb(), session, cards, { consent: true })).toMatchObject({ ok: false, code: 'ALREADY_POSTED', indexes: [0] })
    expect(await db.select().from(schema.items).where(eq(schema.items.vendorId, session.vendorId))).toHaveLength(1)
  })

  it('the database itself refuses a second item with the same photo', async () => {
    const { session } = await signedIn()
    const cards = cardFor(session)
    expect((await createItems(anyDb(), session, cards, { consent: true })).ok).toBe(true)
    const [it1] = await db.select().from(schema.items).where(eq(schema.items.photoUrl, cards[0].url))
    const { id: _id, ...copy } = it1
    await expect(db.insert(schema.items).values(copy)).rejects.toThrow()
  })

  it('an upload reported before posting is linked to the item when posted', async () => {
    const { session } = await signedIn()
    const cards = cardFor(session)
    expect(await registerUpload(anyDb(), session, cards[0].url)).toBe(true)
    expect(await registerUpload(anyDb(), session, cards[0].url)).toBe(true) // idempotent
    expect(await registerUpload(anyDb(), session, photoUrl(UUID()))).toBe(false) // someone else's folder
    const r = await createItems(anyDb(), session, cards, { consent: true })
    if (!r.ok) throw new Error()
    const [u] = await db.select().from(schema.uploads).where(eq(schema.uploads.url, cards[0].url))
    expect(u.itemId).toBe(r.itemIds[0])
  })

  it('a failure part-way leaves nothing behind', async () => {
    const { session } = await signedIn()
    const cards = cardFor(session).map((c) => ({ ...c, boothId: UUID() })) // booth that doesn't exist
    await expect(createItems(anyDb(), session, cards, { consent: true })).rejects.toThrow()
    expect(await db.select().from(schema.items).where(eq(schema.items.vendorId, session.vendorId))).toHaveLength(0)
    const [v] = await db.select().from(schema.vendors).where(eq(schema.vendors.id, session.vendorId))
    expect(v.consentAt).toBeNull() // consent rolled back with everything else
  })
})
