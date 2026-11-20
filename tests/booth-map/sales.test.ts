/**
 * Booth sales (SPEC 5b): start, replace and end a sale on the exact day the vendor
 * picks, and the sale prices shoppers see. Real migration on PGlite.
 */
import { PGlite } from '@electric-sql/pglite'
import { and, eq, isNull } from 'drizzle-orm'
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import * as schema from '@/lib/booth-map/schema'
import { openVendorLink, resolveSession } from '@/lib/booth-map/access'
import { activeSalesForVendor, boothSalesEnabled, endBoothSale, salePreviewItems, startBoothSale } from '@/lib/booth-map/sales'
import { getBoothFeed, getFeed, getVisibleItem } from '@/lib/booth-map/feed'
import { onSale, priceSummary, saleLastDay } from '@/components/booth-map/shop/Price'
import { generateToken, hashToken } from '@/lib/booth-map/tokens'
import type { AnyDb, VendorSession } from '@/lib/booth-map/types'

let db: PgliteDatabase<typeof schema>
let n = 0
const any = () => db as unknown as AnyDb
// Fri Nov 20 2026, 10:00 Eastern
const NOW = new Date('2026-11-20T15:00:00Z')

async function vendor(booths: string[] = [`S${++n}`]): Promise<VendorSession> {
  const token = generateToken()
  const [v] = await db.insert(schema.vendors).values({ name: `S${n}`, displayName: `Sale ${n}`, tokenHash: hashToken(token) }).returning()
  await db.insert(schema.booths).values(booths.map((number) => ({ number, vendorId: v.id })))
  const link = await openVendorLink(any(), token)
  if (!link.ok) throw new Error('link')
  return (await resolveSession(any(), link.cookie))!
}

async function liveItem(s: VendorSession, booth: string, over: Partial<typeof schema.items.$inferInsert> = {}) {
  const b = s.booths.find((x) => x.number === booth)!
  const [it] = await db
    .insert(schema.items)
    .values({
      vendorId: s.vendorId,
      boothId: b.id,
      status: 'live',
      title: 'Brass lamp',
      priceCents: 42500,
      askInStore: false,
      photoUrl: `https://x.public.blob.vercel-storage.com/booth-map/${s.vendorId}/${crypto.randomUUID()}.jpg`,
      photoW: 1200,
      photoH: 1200,
      postedAt: new Date(NOW.getTime() - 3600_000),
      liveAt: new Date(NOW.getTime() - 3600_000),
      expiresAt: new Date(NOW.getTime() + 20 * 86_400_000),
      ...over,
    })
    .returning()
  return it
}

const openSales = (boothId: string) => db.select().from(schema.boothSales).where(and(eq(schema.boothSales.boothId, boothId), isNull(schema.boothSales.closedAt)))

beforeAll(async () => {
  db = drizzle(new PGlite(), { schema })
  await migrate(db, { migrationsFolder: './drizzle/booth-map' })
})

describe('switch', () => {
  const env = { ...process.env }
  afterEach(() => {
    process.env = { ...env }
  })
  it('is off on the live site until BOOTH_SALES_ENABLED=true, and on for previews and local', () => {
    process.env.VERCEL_ENV = 'production'
    delete process.env.BOOTH_SALES_ENABLED
    expect(boothSalesEnabled()).toBe(false)
    process.env.BOOTH_SALES_ENABLED = 'true'
    expect(boothSalesEnabled()).toBe(true)
    process.env.VERCEL_ENV = 'preview'
    delete process.env.BOOTH_SALES_ENABLED
    expect(boothSalesEnabled()).toBe(true)
  })
})

describe('starting a sale', () => {
  it('runs through the end of the picked day, Eastern time, and is logged', async () => {
    const s = await vendor()
    const r = await startBoothSale(any(), s, { booth: s.booths[0].number, percent: 20, lastDay: '2026-11-28' }, NOW)
    expect(r).toEqual({ ok: true, sale: { boothNumber: s.booths[0].number, percent: 20, endsAt: '2026-11-29T05:00:00.000Z', lastDayLabel: 'Sat, Nov 28' } })
    const [row] = await openSales(s.booths[0].id)
    expect(row.endsAt.toISOString()).toBe('2026-11-29T05:00:00.000Z')
    expect(row.startsAt.toISOString()).toBe(NOW.toISOString())
    const log = await db.select().from(schema.activityLog).where(eq(schema.activityLog.boothSaleId, row.id))
    expect(log.map((l) => l.action)).toEqual(['sale_start'])
    expect(log[0].detail).toMatchObject({ after: { percent: 20, lastDay: '2026-11-28' } })
  })

  it('allows a one-day sale that ends tonight, and the 30th day', async () => {
    const s = await vendor(['T1', 'T2'])
    expect((await startBoothSale(any(), s, { booth: 'T1', percent: 10, lastDay: '2026-11-20' }, NOW)).ok).toBe(true)
    expect((await startBoothSale(any(), s, { booth: 'T2', percent: 50, lastDay: '2026-12-20' }, NOW)).ok).toBe(true)
  })

  it('replaces the sale already running in that booth, keeping one open sale', async () => {
    const s = await vendor()
    const booth = s.booths[0]
    await startBoothSale(any(), s, { booth: booth.number, percent: 20, lastDay: '2026-11-28' }, NOW)
    const later = new Date(NOW.getTime() + 3600_000)
    const r = await startBoothSale(any(), s, { booth: booth.number, percent: 30, lastDay: '2026-12-05' }, later)
    expect(r.ok && r.sale?.percent).toBe(30)
    const open = await openSales(booth.id)
    expect(open).toHaveLength(1)
    expect(open[0].percent).toBe(30)
    const all = await db.select().from(schema.boothSales).where(eq(schema.boothSales.boothId, booth.id))
    expect(all).toHaveLength(2)
    expect(all.find((x) => x.percent === 20)?.closedAt?.toISOString()).toBe(later.toISOString())
  })

  it('the furthest day is accepted even when the sale crosses the November clock change (audit finding)', async () => {
    const s = await vendor()
    const justAfterMidnight = new Date('2026-10-05T04:00:30Z') // 12:00:30 am EDT, Oct 5
    const r = await startBoothSale(any(), s, { booth: s.booths[0].number, percent: 20, lastDay: '2026-11-04' }, justAfterMidnight)
    expect(r).toMatchObject({ ok: true, sale: { endsAt: '2026-11-05T05:00:00.000Z', lastDayLabel: 'Wed, Nov 4' } })
  })

  it('refuses another vendor’s booth, odd discounts, past days and days past 30', async () => {
    const s = await vendor()
    const other = await vendor()
    expect(await startBoothSale(any(), s, { booth: other.booths[0].number, percent: 20, lastDay: '2026-11-28' }, NOW)).toMatchObject({ ok: false, status: 422 })
    expect(await startBoothSale(any(), s, { booth: s.booths[0].number, percent: 22, lastDay: '2026-11-28' }, NOW)).toMatchObject({ ok: false, status: 422 })
    expect(await startBoothSale(any(), s, { booth: s.booths[0].number, percent: 20, lastDay: '2026-11-19' }, NOW)).toMatchObject({ ok: false, error: 'That day has already passed. Pick today or a later day.' })
    expect(await startBoothSale(any(), s, { booth: s.booths[0].number, percent: 20, lastDay: '2026-12-21' }, NOW)).toMatchObject({ ok: false, status: 422 })
    expect(await startBoothSale(any(), s, { booth: s.booths[0].number, percent: 20, lastDay: 7 }, NOW)).toMatchObject({ ok: false, status: 422 })
    expect(await openSales(s.booths[0].id)).toHaveLength(0)
  })
})

describe('ending a sale', () => {
  it('ends it now and logs it; the vendor page no longer lists it', async () => {
    const s = await vendor()
    await startBoothSale(any(), s, { booth: s.booths[0].number, percent: 20, lastDay: '2026-11-28' }, NOW)
    expect(await activeSalesForVendor(any(), s.vendorId, NOW)).toHaveLength(1)
    const at = new Date(NOW.getTime() + 2 * 3600_000)
    expect(await endBoothSale(any(), s, { booth: s.booths[0].number }, at)).toEqual({ ok: true, sale: null })
    const [row] = await db.select().from(schema.boothSales).where(eq(schema.boothSales.vendorId, s.vendorId))
    expect(row.endedEarlyAt?.toISOString()).toBe(at.toISOString())
    expect(row.closedAt?.toISOString()).toBe(at.toISOString())
    expect(await activeSalesForVendor(any(), s.vendorId, at)).toHaveLength(0)
    const log = await db.select().from(schema.activityLog).where(eq(schema.activityLog.boothSaleId, row.id))
    expect(log.map((l) => l.action).sort()).toEqual(['sale_end', 'sale_start'])
  })

  it('a sale stops counting at midnight after its last day, even before anything closes it', async () => {
    const s = await vendor()
    await startBoothSale(any(), s, { booth: s.booths[0].number, percent: 15, lastDay: '2026-11-21' }, NOW)
    expect(await activeSalesForVendor(any(), s.vendorId, new Date('2026-11-22T04:59:59Z'))).toHaveLength(1) // 11:59:59 pm Sat, Eastern
    expect(await activeSalesForVendor(any(), s.vendorId, new Date('2026-11-22T05:00:00Z'))).toHaveLength(0) // midnight
  })
})

describe('what shoppers see', () => {
  it('items in a booth with a running sale carry the percent and end; others and the live site do not', async () => {
    const s = await vendor(['U1', 'U2'])
    const lamp = await liveItem(s, 'U1', { title: 'sale lamp' })
    const ask = await liveItem(s, 'U1', { title: 'sale ask', priceCents: null, askInStore: true })
    const plain = await liveItem(s, 'U2', { title: 'no sale' })
    await startBoothSale(any(), s, { booth: 'U1', percent: 20, lastDay: '2026-11-28' }, NOW)

    const feed = await getFeed(any(), { includeTest: true, includeSales: true, now: NOW })
    const byId = (id: string) => feed.find((i) => i.id === id)!
    expect(byId(lamp.id)).toMatchObject({ salePercent: 20, saleEndsAt: '2026-11-29T05:00:00.000Z' })
    expect(byId(plain.id)).toMatchObject({ salePercent: null, saleEndsAt: null })
    expect(priceSummary(byId(lamp.id))).toBe('$340 on sale (20% off $425)')
    expect(priceSummary(byId(ask.id))).toBe('Ask in store, 20% off')
    expect(saleLastDay(byId(lamp.id))).toBe('Sat, Nov 28')

    // Sales switched off (the live site): no sale fields at all.
    const off = await getFeed(any(), { includeTest: true, includeSales: false, now: NOW })
    expect(off.find((i) => i.id === lamp.id)).toMatchObject({ salePercent: null })

    // Booth and item pages use the same rules.
    const booth = await getBoothFeed(any(), 'U1', { includeTest: true, includeSales: true, now: NOW })
    expect(booth!.every((i) => i.salePercent === 20)).toBe(true)
    expect((await getVisibleItem(any(), lamp.id, { includeTest: true, includeSales: true, now: NOW }))?.salePercent).toBe(20)

    // After the last day, prices go back to normal.
    const after = await getFeed(any(), { includeTest: true, includeSales: true, now: new Date('2026-11-29T05:00:00Z') })
    expect(after.find((i) => i.id === lamp.id)?.salePercent).toBeNull()
  })

  it('a sale only discounts its own vendor’s items, even if the booth changes hands', async () => {
    const a = await vendor(['X1'])
    const lamp = await liveItem(a, 'X1', { title: 'vendor A item' })
    await startBoothSale(any(), a, { booth: 'X1', percent: 30, lastDay: '2026-11-28' }, NOW)
    // The booth moves to vendor B; A's item is still live, and B posts a new one.
    const b = await vendor([`Y${n}`])
    const boothX1 = a.booths[0]
    await db.update(schema.booths).set({ vendorId: b.vendorId }).where(eq(schema.booths.id, boothX1.id))
    const [bItem] = await db
      .insert(schema.items)
      .values({ ...(({ id, ...rest }) => rest)(lamp), vendorId: b.vendorId, title: 'vendor B item', photoUrl: lamp.photoUrl.replace('.jpg', '-b.jpg') })
      .returning()
    const feed = await getFeed(any(), { includeTest: true, includeSales: true, now: NOW })
    expect(feed.find((i) => i.id === lamp.id)?.salePercent).toBe(30)
    expect(feed.find((i) => i.id === bItem.id)?.salePercent).toBeNull()
  })

  it('sold items never show a sale price, and the feed has no duplicate rows', async () => {
    const s = await vendor()
    const sold = await liveItem(s, s.booths[0].number, { status: 'sold', soldAt: new Date(NOW.getTime() - 3600_000), soldSource: 'vendor' })
    await startBoothSale(any(), s, { booth: s.booths[0].number, percent: 25, lastDay: '2026-11-25' }, NOW)
    const feed = await getFeed(any(), { includeTest: true, includeSales: true, now: NOW })
    const rows = feed.filter((i) => i.id === sold.id)
    expect(rows).toHaveLength(1)
    expect(onSale(rows[0])).toBe(false)
  })

  it('the vendor’s preview uses their newest priced item in each booth', async () => {
    const s = await vendor(['W1'])
    await liveItem(s, 'W1', { title: 'older', liveAt: new Date(NOW.getTime() - 7200_000) })
    await liveItem(s, 'W1', { title: 'no price', priceCents: null, askInStore: true })
    await liveItem(s, 'W1', { title: 'newest priced', liveAt: new Date(NOW.getTime() - 60_000) })
    const p = await salePreviewItems(any(), s.vendorId)
    expect(p.W1.title).toBe('newest priced')
  })
})
