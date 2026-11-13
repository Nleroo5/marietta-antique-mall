/**
 * Runs the real generated migration (drizzle/booth-map) on PGlite, an in-process
 * Postgres 17, then checks that the database itself enforces the spec's rules.
 * Every test creates its own vendor and booth, so tests don't depend on order.
 */
import { PGlite } from '@electric-sql/pglite'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { beforeAll, describe, expect, it } from 'vitest'
import * as schema from '@/lib/booth-map/schema'
import { removeTestVendors, seedTestVendors } from '@/lib/booth-map/seed'
import { generateToken, hashToken } from '@/lib/booth-map/tokens'
import { addDays, ITEM_LIFETIME_DAYS } from '@/lib/booth-map/pricing'

let client: PGlite
let db: PgliteDatabase<typeof schema>
let n = 0

/** Drizzle wraps driver errors; the Postgres message is on the cause. */
async function pgError(p: Promise<unknown>): Promise<string> {
  try {
    await p
  } catch (e) {
    const err = e as { message?: string; cause?: { message?: string } }
    return `${err.message ?? ''} ${err.cause?.message ?? ''}`
  }
  throw new Error('expected the database to reject this')
}

async function vendorWithBooth(opts: { isTest?: boolean } = {}) {
  n += 1
  const [v] = await db
    .insert(schema.vendors)
    .values({ name: `V${n}`, displayName: `Vendor ${n}`, tokenHash: hashToken(generateToken()), isTest: opts.isTest ?? false })
    .returning()
  const [b] = await db.insert(schema.booths).values({ number: `B${n}`, vendorId: v.id }).returning()
  return { vendor: v, booth: b }
}

function liveItem(vendorId: string, boothId: string, extra: Partial<typeof schema.items.$inferInsert> = {}) {
  const liveAt = new Date()
  return {
    vendorId,
    boothId,
    title: 'Brass floor lamp',
    priceCents: 4500,
    photoUrl: `https://example.public.blob.vercel-storage.com/${n}-${Math.random()}.jpg`,
    photoW: 1600,
    photoH: 1200,
    status: 'live' as const,
    liveAt,
    expiresAt: addDays(liveAt, ITEM_LIFETIME_DAYS),
    ...extra,
  }
}

beforeAll(async () => {
  client = new PGlite()
  db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: './drizzle/booth-map' })
})

describe('migration', () => {
  it('creates all 12 tables', async () => {
    const r = await client.query<{ n: number }>(
      `select count(*)::int as n from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'`
    )
    expect(r.rows[0].n).toBe(12) // the spec's 11 plus uploads
  })

  it('creates the three item indexes (feed index on go-live time)', async () => {
    const r = await client.query<{ indexname: string }>(`select indexname from pg_indexes where tablename = 'items'`)
    expect(r.rows.map((x) => x.indexname)).toEqual(
      expect.arrayContaining(['items_status_live_idx', 'items_booth_status_idx', 'items_vendor_status_idx'])
    )
  })
})

describe('seed and teardown', () => {
  it('creates two test vendors on booths 9001-9003, stores only hashes, refuses a rerun, then removes cleanly', async () => {
    const real = await vendorWithBooth()
    const seeded = await seedTestVendors(db)
    expect(seeded.map((s) => s.booths)).toEqual([['9001'], ['9002', '9003']])
    for (const s of seeded) {
      const [v] = await db.select().from(schema.vendors).where(eq(schema.vendors.id, s.vendorId))
      expect(v.isTest).toBe(true)
      expect(v.tokenHash).toBe(hashToken(s.token))
      expect(JSON.stringify(v)).not.toContain(s.token)
    }

    const before = await db.select().from(schema.vendors)
    await expect(seedTestVendors(db)).rejects.toThrow(/already/)
    expect(await db.select().from(schema.vendors)).toHaveLength(before.length) // rerun created nothing

    // Give a test vendor an item, an upload and a sale, then tear down.
    const [b] = await db.select().from(schema.booths).where(eq(schema.booths.number, '9001'))
    const [item] = await db.insert(schema.items).values(liveItem(seeded[0].vendorId, b.id)).returning()
    await db.insert(schema.uploads).values({ vendorId: seeded[0].vendorId, url: item.photoUrl, itemId: item.id })
    await db.insert(schema.boothSales).values({ vendorId: seeded[0].vendorId, boothId: b.id, percent: 20, endsAt: addDays(new Date(), 7) })
    await db.insert(schema.activityLog).values({ actor: 'vendor', vendorId: seeded[0].vendorId, action: 'post', itemId: item.id })
    // Rows that point at a test vendor's things without naming the vendor.
    const [testSale] = await db.select().from(schema.boothSales).where(eq(schema.boothSales.boothId, b.id))
    await db.insert(schema.activityLog).values({ actor: 'system', action: 'sale_ended', boothSaleId: testSale.id })
    const [dev] = await db
      .insert(schema.vendorDevices)
      .values({ vendorId: seeded[1].vendorId, deviceCookieHash: hashToken(generateToken()), linkVersion: 1 })
      .returning()
    await db.insert(schema.activityLog).values({ actor: 'admin', action: 'revoke_device', deviceId: dev.id })
    // A real vendor's item that was put on a test booth by mistake.
    await db.insert(schema.items).values(liveItem(real.vendor.id, b.id))

    const r = await removeTestVendors(db)
    expect(r.vendors).toBe(2)
    expect(r.blobUrls).toContain(item.photoUrl)
    expect(await db.select().from(schema.vendors).where(eq(schema.vendors.isTest, true))).toHaveLength(0)
    expect(await db.select().from(schema.booths).where(sql`${schema.booths.number} like '900%'`)).toHaveLength(0)
    // The real vendor is untouched.
    expect(await db.select().from(schema.vendors).where(eq(schema.vendors.id, real.vendor.id))).toHaveLength(1)
  })
})

describe('items', () => {
  it('a new item defaults to checking and needs no live dates yet', async () => {
    const { vendor, booth } = await vendorWithBooth()
    const [row] = await db
      .insert(schema.items)
      .values({ vendorId: vendor.id, boothId: booth.id, title: 'Lamp', priceCents: 100, photoUrl: 'u1', photoW: 1, photoH: 1 })
      .returning()
    expect(row.status).toBe('checking')
    expect(row.askInStore).toBe(false)
  })

  it('needs exactly one of a price or "ask in store"', async () => {
    const { vendor, booth } = await vendorWithBooth()
    await db.insert(schema.items).values(liveItem(vendor.id, booth.id, { priceCents: null, askInStore: true }))
    expect(await pgError(db.insert(schema.items).values(liveItem(vendor.id, booth.id, { priceCents: null })))).toMatch(/items_price_xor_ask/)
    expect(await pgError(db.insert(schema.items).values(liveItem(vendor.id, booth.id, { askInStore: true })))).toMatch(/items_price_xor_ask/)
  })

  it('rejects negative or over-maximum prices and blank or long titles', async () => {
    const { vendor, booth } = await vendorWithBooth()
    expect(await pgError(db.insert(schema.items).values(liveItem(vendor.id, booth.id, { priceCents: -1 })))).toMatch(/items_price_range/)
    expect(await pgError(db.insert(schema.items).values(liveItem(vendor.id, booth.id, { priceCents: 100_000_001 })))).toMatch(/items_price_range/)
    expect(await pgError(db.insert(schema.items).values(liveItem(vendor.id, booth.id, { title: '   ' })))).toMatch(/items_title/)
    expect(await pgError(db.insert(schema.items).values(liveItem(vendor.id, booth.id, { title: 'x'.repeat(81) })))).toMatch(/items_title/)
  })

  it('rejects a category outside the list', async () => {
    const { vendor, booth } = await vendorWithBooth()
    expect(await pgError(db.insert(schema.items).values(liveItem(vendor.id, booth.id, { category: 'toys' })))).toMatch(/items_category/)
    await db.insert(schema.items).values(liveItem(vendor.id, booth.id, { category: 'collectibles' }))
  })

  it('a held item needs a reason, and a live item needs live and expiry dates', async () => {
    const { vendor, booth } = await vendorWithBooth()
    expect(
      await pgError(db.insert(schema.items).values(liveItem(vendor.id, booth.id, { status: 'held', liveAt: null, expiresAt: null })))
    ).toMatch(/items_held_reason/)
    await db.insert(schema.items).values(liveItem(vendor.id, booth.id, { status: 'held', holdReason: 'person', liveAt: null, expiresAt: null }))
    expect(await pgError(db.insert(schema.items).values(liveItem(vendor.id, booth.id, { liveAt: null })))).toMatch(/items_live_window/)
  })

  it('sold dates come as a pair and a sold item always has them', async () => {
    const { vendor, booth } = await vendorWithBooth()
    expect(await pgError(db.insert(schema.items).values(liveItem(vendor.id, booth.id, { status: 'sold' })))).toMatch(/items_sold_has_date/)
    // On a removed item (where sold dates are allowed), a date without a source is still rejected.
    expect(
      await pgError(db.insert(schema.items).values(liveItem(vendor.id, booth.id, { status: 'removed', removedAt: new Date(), soldAt: new Date() })))
    ).toMatch(/items_sold_pair/)
    await db.insert(schema.items).values(liveItem(vendor.id, booth.id, { status: 'sold', soldAt: new Date(), soldSource: 'report' }))
  })

  it('a sold item that is later removed keeps its sale history', async () => {
    const { vendor, booth } = await vendorWithBooth()
    const [it1] = await db
      .insert(schema.items)
      .values(liveItem(vendor.id, booth.id, { status: 'sold', soldAt: new Date(), soldSource: 'vendor' }))
      .returning()
    await db.update(schema.items).set({ status: 'removed', removedAt: new Date() }).where(eq(schema.items.id, it1.id))
    const [after] = await db.select().from(schema.items).where(eq(schema.items.id, it1.id))
    expect(after.soldSource).toBe('vendor')
  })

  it('removed_at is set exactly when removed, so undoing a remove must clear it', async () => {
    const { vendor, booth } = await vendorWithBooth()
    expect(await pgError(db.insert(schema.items).values(liveItem(vendor.id, booth.id, { removedAt: new Date() })))).toMatch(
      /items_removed_has_date/
    )
    expect(await pgError(db.insert(schema.items).values(liveItem(vendor.id, booth.id, { status: 'removed' })))).toMatch(
      /items_removed_has_date/
    )
  })

  it('an item that never went live can be removed (rejected held photo, card removed during the AI check)', async () => {
    const { vendor, booth } = await vendorWithBooth()
    const [held] = await db
      .insert(schema.items)
      .values(liveItem(vendor.id, booth.id, { status: 'held', holdReason: 'person', liveAt: null, expiresAt: null }))
      .returning()
    await db.update(schema.items).set({ status: 'removed', removedAt: new Date() }).where(eq(schema.items.id, held.id))
    const [checking] = await db
      .insert(schema.items)
      .values(liveItem(vendor.id, booth.id, { status: 'checking', liveAt: null, expiresAt: null }))
      .returning()
    await db.update(schema.items).set({ status: 'removed', removedAt: new Date() }).where(eq(schema.items.id, checking.id))
  })

  it('undoing a sale must clear the sold dates: a live item cannot carry them', async () => {
    const { vendor, booth } = await vendorWithBooth()
    const [it1] = await db
      .insert(schema.items)
      .values(liveItem(vendor.id, booth.id, { status: 'sold', soldAt: new Date(), soldSource: 'vendor' }))
      .returning()
    expect(await pgError(db.update(schema.items).set({ status: 'live' }).where(eq(schema.items.id, it1.id)))).toMatch(
      /items_sold_only_when_sold/
    )
    await db.update(schema.items).set({ status: 'live', soldAt: null, soldSource: null }).where(eq(schema.items.id, it1.id))
  })

  it('a live item can never be marked as having its photo deleted', async () => {
    const { vendor, booth } = await vendorWithBooth()
    expect(await pgError(db.insert(schema.items).values(liveItem(vendor.id, booth.id, { photoDeletedAt: new Date() })))).toMatch(
      /items_photo_deleted_only_off_page/
    )
    await db.insert(schema.items).values(liveItem(vendor.id, booth.id, { status: 'expired', photoDeletedAt: new Date() }))
  })
})

describe('booth sales', () => {
  const sale = (vendorId: string, boothId: string, percent: number, days: number) => {
    const startsAt = new Date()
    return { vendorId, boothId, percent, startsAt, endsAt: addDays(startsAt, days) }
  }

  it('allows one open sale per booth; a closed one does not block a new one', async () => {
    const { vendor, booth } = await vendorWithBooth()
    const [first] = await db.insert(schema.boothSales).values(sale(vendor.id, booth.id, 20, 7)).returning()
    expect(await pgError(db.insert(schema.boothSales).values(sale(vendor.id, booth.id, 50, 7)))).toMatch(/booth_sales_one_open_per_booth/)
    // Replacing a sale: close the old one and open the new one in one transaction.
    await db.transaction(async (tx) => {
      await tx.update(schema.boothSales).set({ closedAt: new Date() }).where(eq(schema.boothSales.id, first.id))
      await tx.insert(schema.boothSales).values(sale(vendor.id, booth.id, 50, 7))
    })
    const open = await db
      .select()
      .from(schema.boothSales)
      .where(and(eq(schema.boothSales.boothId, booth.id), isNull(schema.boothSales.closedAt)))
    expect(open.map((s) => s.percent)).toEqual([50])
  })

  it('a failed replacement leaves the original sale open (transaction rolls back)', async () => {
    const { vendor, booth } = await vendorWithBooth()
    const [first] = await db.insert(schema.boothSales).values(sale(vendor.id, booth.id, 20, 7)).returning()
    await pgError(
      db.transaction(async (tx) => {
        await tx.update(schema.boothSales).set({ closedAt: new Date() }).where(eq(schema.boothSales.id, first.id))
        await tx.insert(schema.boothSales).values(sale(vendor.id, booth.id, 40, 7)) // invalid percent
      })
    )
    const [still] = await db.select().from(schema.boothSales).where(eq(schema.boothSales.id, first.id))
    expect(still.closedAt).toBeNull()
  })

  it('rejects other percents', async () => {
    const { vendor, booth } = await vendorWithBooth()
    expect(await pgError(db.insert(schema.boothSales).values(sale(vendor.id, booth.id, 40, 7)))).toMatch(/booth_sales_percent/)
  })

  it('accepts a sale ending at the end of the 30th day, rejects 32 days or an end before the start', async () => {
    const a = await vendorWithBooth()
    const startsAt = new Date('2026-11-13T20:00:00Z') // 3 PM Eastern
    await db.insert(schema.boothSales).values({
      vendorId: a.vendor.id,
      boothId: a.booth.id,
      percent: 20,
      startsAt,
      endsAt: new Date('2026-12-14T04:59:00Z'), // 11:59 PM Eastern on Dec 13
    })
    const b = await vendorWithBooth()
    expect(await pgError(db.insert(schema.boothSales).values(sale(b.vendor.id, b.booth.id, 20, 32)))).toMatch(/booth_sales_window/)
    expect(await pgError(db.insert(schema.boothSales).values(sale(b.vendor.id, b.booth.id, 20, -1)))).toMatch(/booth_sales_window/)
  })

  it('an early end cannot be before the start and must close the sale', async () => {
    const { vendor, booth } = await vendorWithBooth()
    const s = sale(vendor.id, booth.id, 20, 7)
    expect(
      await pgError(db.insert(schema.boothSales).values({ ...s, endedEarlyAt: addDays(s.startsAt, -3), closedAt: new Date() }))
    ).toMatch(/booth_sales_ended_early/)
    expect(await pgError(db.insert(schema.boothSales).values({ ...s, endedEarlyAt: addDays(s.startsAt, 1) }))).toMatch(
      /booth_sales_ended_early/
    )
  })
})

describe('vendors and access', () => {
  it('a vendor with items cannot be deleted; offboarding is a status', async () => {
    const { vendor, booth } = await vendorWithBooth()
    await db.insert(schema.items).values(liveItem(vendor.id, booth.id))
    expect(await pgError(db.delete(schema.vendors).where(eq(schema.vendors.id, vendor.id)))).toMatch(/foreign key/)
    await db.update(schema.vendors).set({ status: 'removed' }).where(eq(schema.vendors.id, vendor.id))
  })

  it('a booth with items cannot be deleted', async () => {
    const { vendor, booth } = await vendorWithBooth()
    await db.insert(schema.items).values(liveItem(vendor.id, booth.id))
    expect(await pgError(db.delete(schema.booths).where(eq(schema.booths.id, booth.id)))).toMatch(/foreign key/)
  })

  it('bumping link_version invalidates every device in one update', async () => {
    const { vendor } = await vendorWithBooth()
    await db.insert(schema.vendorDevices).values([
      { vendorId: vendor.id, deviceCookieHash: hashToken(generateToken()), linkVersion: 1 },
      { vendorId: vendor.id, deviceCookieHash: hashToken(generateToken()), linkVersion: 1 },
    ])
    const validDevices = () =>
      db
        .select({ id: schema.vendorDevices.id })
        .from(schema.vendorDevices)
        .innerJoin(schema.vendors, eq(schema.vendors.id, schema.vendorDevices.vendorId))
        .where(
          and(
            eq(schema.vendorDevices.vendorId, vendor.id),
            eq(schema.vendorDevices.linkVersion, schema.vendors.linkVersion),
            isNull(schema.vendorDevices.revokedAt)
          )
        )
    expect(await validDevices()).toHaveLength(2)
    await db
      .update(schema.vendors)
      .set({ tokenHash: hashToken(generateToken()), linkVersion: sql`${schema.vendors.linkVersion} + 1` })
      .where(eq(schema.vendors.id, vendor.id))
    expect(await validDevices()).toHaveLength(0)
  })

  it('token hashes and device cookie hashes are unique', async () => {
    const a = await vendorWithBooth()
    expect(
      await pgError(db.insert(schema.vendors).values({ name: 'dup', displayName: 'dup', tokenHash: a.vendor.tokenHash }))
    ).toMatch(/vendors_token_hash_unique/)
    const h = hashToken(generateToken())
    await db.insert(schema.vendorDevices).values({ vendorId: a.vendor.id, deviceCookieHash: h, linkVersion: 1 })
    const b = await vendorWithBooth()
    expect(await pgError(db.insert(schema.vendorDevices).values({ vendorId: b.vendor.id, deviceCookieHash: h, linkVersion: 1 }))).toMatch(
      /device_cookie_hash_unique/
    )
  })

  it('booth numbers are URL-safe text', async () => {
    const { vendor } = await vendorWithBooth()
    await db.insert(schema.booths).values({ number: '114A', vendorId: vendor.id })
    expect(await pgError(db.insert(schema.booths).values({ number: '114/../x', vendorId: vendor.id }))).toMatch(/booths_number_format/)
    expect(await pgError(db.insert(schema.booths).values({ number: '114a', vendorId: vendor.id }))).toMatch(/booths_number_format/)
    expect(await pgError(db.insert(schema.booths).values({ number: '', vendorId: vendor.id }))).toMatch(/booths_number_format/)
  })
})

describe('sales report intake', () => {
  it('a retried job cannot insert the same line twice, and answers are yes or no with a time', async () => {
    const [job] = await db.insert(schema.inboundJobs).values({ resendEmailId: `em_${Math.random()}` }).returning()
    await db.insert(schema.soldLines).values({ jobId: job.id, lineNo: 1, rawText: 'x' })
    expect(await pgError(db.insert(schema.soldLines).values({ jobId: job.id, lineNo: 1, rawText: 'x' }))).toMatch(/sold_lines_job_line_idx/)
    expect(await pgError(db.insert(schema.soldLines).values({ jobId: job.id, lineNo: 2, rawText: 'x', answer: 'maybe', answeredAt: new Date() }))).toMatch(
      /sold_lines_answer/
    )
    expect(await pgError(db.insert(schema.soldLines).values({ jobId: job.id, lineNo: 3, rawText: 'x', answer: 'yes' }))).toMatch(
      /sold_lines_answer/
    )
    expect(await pgError(db.insert(schema.inboundJobs).values({ resendEmailId: job.resendEmailId }))).toMatch(/resend_email_id_unique/)
  })
})
