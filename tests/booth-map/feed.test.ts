/** What shoppers can see (SPEC 2 and 8), against the real migration on PGlite. */
import { PGlite } from '@electric-sql/pglite'
import { eq } from 'drizzle-orm'
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { beforeAll, describe, expect, it } from 'vitest'
import * as schema from '@/lib/booth-map/schema'
import { getBoothFeed, getFeed, getVisibleItem, includeTestVendors, normalizeBoothNumber } from '@/lib/booth-map/feed'
import { relativeLabel } from '@/components/booth-map/shop/TimeAgo'
import { priceText } from '@/components/booth-map/shop/ItemCard'
import { generateToken, hashToken } from '@/lib/booth-map/tokens'
import type { AnyDb } from '@/lib/booth-map/types'

let db: PgliteDatabase<typeof schema>
const any = () => db as unknown as AnyDb
const NOW = new Date('2026-11-14T15:00:00Z')
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600_000)
const daysFrom = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000)
let n = 0

async function vendor(opts: { isTest?: boolean; status?: 'active' | 'paused' | 'removed'; booth?: string } = {}) {
  n += 1
  const [v] = await db
    .insert(schema.vendors)
    .values({ name: `F${n}`, displayName: `F${n}`, tokenHash: hashToken(generateToken()), isTest: opts.isTest ?? false, status: opts.status ?? 'active' })
    .returning()
  const [b] = await db.insert(schema.booths).values({ number: opts.booth ?? `F${n}`, vendorId: v.id }).returning()
  return { v, b }
}

async function item(vendorId: string, boothId: string, title: string, over: Partial<typeof schema.items.$inferInsert> = {}) {
  const liveAt = over.liveAt ?? hoursAgo(1)
  const [row] = await db
    .insert(schema.items)
    .values({
      vendorId,
      boothId,
      title,
      priceCents: 4500,
      photoUrl: `https://abc.public.blob.vercel-storage.com/booth-map/${vendorId}/${crypto.randomUUID()}.jpg`,
      photoW: 1600,
      photoH: 1200,
      status: 'live',
      liveAt,
      expiresAt: daysFrom(liveAt, 30),
      ...over,
    })
    .returning()
  return row
}

const titles = (list: { title: string }[]) => list.map((i) => i.title)

beforeAll(async () => {
  db = drizzle(new PGlite(), { schema })
  await migrate(db, { migrationsFolder: './drizzle/booth-map' })

  const a = await vendor({ booth: '114' })
  await item(a.v.id, a.b.id, 'live new', { liveAt: hoursAgo(1) })
  await item(a.v.id, a.b.id, 'live older', { liveAt: hoursAgo(30) })
  await item(a.v.id, a.b.id, 'live expired by date', { liveAt: hoursAgo(31 * 24) }) // status still live, past 30 days
  await item(a.v.id, a.b.id, 'sold 10h ago', { status: 'sold', soldAt: hoursAgo(10), soldSource: 'vendor', liveAt: hoursAgo(40) })
  await item(a.v.id, a.b.id, 'sold 50h ago', { status: 'sold', soldAt: hoursAgo(50), soldSource: 'report', liveAt: hoursAgo(60) })
  await item(a.v.id, a.b.id, 'held', { status: 'held', holdReason: 'person', liveAt: null, expiresAt: null })
  await item(a.v.id, a.b.id, 'checking', { status: 'checking', liveAt: null, expiresAt: null })
  await item(a.v.id, a.b.id, 'removed', { status: 'removed', removedAt: hoursAgo(1) })
  await item(a.v.id, a.b.id, 'expired', { status: 'expired' })
  await item(a.v.id, a.b.id, 'ask in store', { priceCents: null, askInStore: true, liveAt: hoursAgo(2) })

  const t = await vendor({ isTest: true, booth: '9001' })
  await item(t.v.id, t.b.id, 'test vendor item', { liveAt: hoursAgo(0.5) })
  const p = await vendor({ status: 'paused', booth: '200' })
  await item(p.v.id, p.b.id, 'paused vendor item')
  const r = await vendor({ status: 'removed', booth: '201' })
  await item(r.v.id, r.b.id, 'removed vendor item')
})

describe('feed visibility', () => {
  it('shows live items in date and sold items for 48 hours, newest first, nothing else', async () => {
    const feed = await getFeed(any(), { includeTest: false, now: NOW })
    expect(titles(feed)).toEqual(['live new', 'ask in store', 'live older', 'sold 10h ago'])
    expect(feed.find((i) => i.title === 'sold 10h ago')?.sold).toBe(true)
    expect(feed.find((i) => i.title === 'live new')?.sold).toBe(false)
  })

  it('includes test vendors only when asked (preview deployments)', async () => {
    const feed = await getFeed(any(), { includeTest: true, now: NOW })
    expect(titles(feed)[0]).toBe('test vendor item')
    expect(titles(feed)).not.toContain('paused vendor item')
    expect(titles(feed)).not.toContain('removed vendor item')
  })

  it('test vendors are hidden on the live site and shown elsewhere', () => {
    const before = process.env.VERCEL_ENV
    process.env.VERCEL_ENV = 'production'
    expect(includeTestVendors()).toBe(false)
    process.env.VERCEL_ENV = 'preview'
    expect(includeTestVendors()).toBe(true)
    if (before === undefined) delete process.env.VERCEL_ENV
    else process.env.VERCEL_ENV = before
  })

  it('a booth page follows the same rules', async () => {
    expect(titles((await getBoothFeed(any(), '114', { includeTest: false, now: NOW }))!)).toEqual(['live new', 'ask in store', 'live older', 'sold 10h ago'])
  })

  it('a booth that does not exist, or whose vendor shoppers cannot see, is a 404 (null)', async () => {
    expect(await getBoothFeed(any(), 'ZZZZ', { includeTest: true, now: NOW })).toBeNull()
    expect(await getBoothFeed(any(), '9001', { includeTest: false, now: NOW })).toBeNull() // test vendor on the live site
    expect(titles((await getBoothFeed(any(), '9001', { includeTest: true, now: NOW }))!)).toEqual(['test vendor item']) // on a preview
    expect(await getBoothFeed(any(), '200', { includeTest: true, now: NOW })).toBeNull() // paused vendor
    expect(await getBoothFeed(any(), '201', { includeTest: true, now: NOW })).toBeNull() // removed vendor
  })

  it('a real booth with nothing new is an empty list, not a 404', async () => {
    const quiet = await vendor({ booth: '300' })
    void quiet
    expect(await getBoothFeed(any(), '300', { includeTest: false, now: NOW })).toEqual([])
  })

  it('an item page follows the same rules', async () => {
    const all = await db.select({ id: schema.items.id, title: schema.items.title }).from(schema.items)
    const id = (t: string) => all.find((i) => i.title === t)!.id
    expect((await getVisibleItem(any(), id('live new'), { includeTest: false, now: NOW }))?.title).toBe('live new')
    for (const t of ['held', 'checking', 'removed', 'expired', 'sold 50h ago', 'live expired by date', 'test vendor item', 'paused vendor item']) {
      expect(await getVisibleItem(any(), id(t), { includeTest: false, now: NOW }), t).toBeNull()
    }
    expect(await getVisibleItem(any(), 'not-a-uuid', { includeTest: false, now: NOW })).toBeNull()
  })

  it('carries what the card needs and nothing about the vendor', async () => {
    const [first] = await getFeed(any(), { includeTest: false, now: NOW })
    expect(Object.keys(first).sort()).toEqual(['askInStore', 'booth', 'category', 'id', 'liveAt', 'photoH', 'photoUrl', 'photoW', 'priceCents', 'saleEndsAt', 'salePercent', 'sold', 'title'])
    expect(first.salePercent).toBeNull() // sales off unless asked for (the live site)
    expect(first.booth).toBe('114')
    expect(first.liveAt).toBe(hoursAgo(1).toISOString())
  })

  it('a paused vendor’s items disappear and come back', async () => {
    const [v] = await db.select().from(schema.vendors).where(eq(schema.vendors.status, 'paused'))
    await db.update(schema.vendors).set({ status: 'active' }).where(eq(schema.vendors.id, v.id))
    expect(titles(await getFeed(any(), { includeTest: false, now: NOW }))).toContain('paused vendor item')
    await db.update(schema.vendors).set({ status: 'paused' }).where(eq(schema.vendors.id, v.id))
  })
})

describe('display helpers', () => {
  it('normalizes booth numbers and rejects anything unsafe', () => {
    expect(normalizeBoothNumber('114a')).toBe('114A')
    expect(normalizeBoothNumber(' 9001 ')).toBe('9001')
    for (const bad of ['', '../x', '114/2', 'a'.repeat(13), '%2F']) expect(normalizeBoothNumber(bad)).toBeNull()
  })

  it('shows price or "Ask in store"', () => {
    expect(priceText({ priceCents: 4550, askInStore: false })).toBe('$45.50')
    expect(priceText({ priceCents: null, askInStore: true })).toBe('Ask in store')
  })

  it('writes relative times shoppers understand', () => {
    const now = NOW.getTime()
    expect(relativeLabel(new Date(now - 20_000).toISOString(), now)).toBe('Just now')
    expect(relativeLabel(new Date(now - 35 * 60_000).toISOString(), now)).toBe('35 min ago')
    expect(relativeLabel(new Date(now - 60 * 60_000).toISOString(), now)).toBe('1 hr ago')
    expect(relativeLabel(new Date(now - 5 * 3600_000).toISOString(), now)).toBe('5 hrs ago')
    expect(relativeLabel(new Date(now - 26 * 3600_000).toISOString(), now)).toBe('Yesterday')
    // NOW is 10 AM Eastern. 20 hours ago was 2 PM yesterday; 36 hours ago was 10 PM two days ago.
    expect(relativeLabel(new Date(now - 20 * 3600_000).toISOString(), now)).toBe('Yesterday')
    expect(relativeLabel(new Date(now - 36 * 3600_000).toISOString(), now)).toBe('2 days ago')
    expect(relativeLabel(new Date(now - 9 * 3600_000).toISOString(), now)).toBe('9 hrs ago') // 1 AM today
    // Just after midnight, something from 11 PM reads as hours, not "Yesterday".
    const twoAm = Date.parse('2026-11-14T07:00:00Z') // 2 AM Eastern
    expect(relativeLabel(new Date(twoAm - 3 * 3600_000).toISOString(), twoAm)).toBe('3 hrs ago')

    expect(relativeLabel(new Date(now - 3 * 86_400_000).toISOString(), now)).toBe('3 days ago')
    expect(relativeLabel(new Date(now - 10 * 86_400_000).toISOString(), now)).toBe('Nov 4')
  })
})

describe('cache keys', () => {
  it('differ between previews (with test vendors) and the live site, so one can never serve the other', async () => {
    const { cacheKeyParts } = await import('@/lib/booth-map/feed-cache')
    for (const kind of ['feed', 'booth', 'item'] as const) {
      expect(cacheKeyParts(kind, true)).not.toEqual(cacheKeyParts(kind, false))
    }
  })
})
