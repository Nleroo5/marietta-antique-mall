import { and, desc, eq, gt, inArray, isNotNull, isNull, lte } from 'drizzle-orm'
import * as schema from './schema'
import { isSalePercent, MAX_SALE_PERCENT, MIN_SALE_PERCENT } from './pricing'
import { formatSaleLastDay, saleEndsAt } from './sale-dates'
import type { AnyDb, VendorSession } from './types'

/**
 * Booth sales (SPEC section 5b): one discount for every live item in a booth, ending
 * on the exact day the vendor picks.
 *
 * Off on the live site until the owner confirms how the register applies a booth-wide
 * discount (SPEC 5b, "Do not ship this until the owner answers"). On for preview
 * deployments and local builds, so it can be reviewed. To switch it on in production,
 * set BOOTH_SALES_ENABLED=true in Vercel.
 */
export function boothSalesEnabled(): boolean {
  return process.env.BOOTH_SALES_ENABLED === 'true' || process.env.VERCEL_ENV !== 'production'
}

/** A sale as the vendor page and the API show it. */
export interface BoothSaleView {
  boothNumber: string
  percent: number
  /** ISO time the sale ends: midnight after the last day, mall time. */
  endsAt: string
  /** "Sat, Nov 28" */
  lastDayLabel: string
}

/** One recent priced item per booth, for the "how it will look to shoppers" preview. */
export interface SalePreviewItem {
  title: string
  priceCents: number
  photoUrl: string
}

export type SaleResult = { ok: true; sale: BoothSaleView | null } | { ok: false; status: 404 | 409 | 422; error: string }

const toView = (boothNumber: string, percent: number, endsAt: Date): BoothSaleView => ({
  boothNumber,
  percent,
  endsAt: endsAt.toISOString(),
  lastDayLabel: formatSaleLastDay(endsAt),
})

/** A sale counts as running while it is not closed, has started, and has not reached its end. */
const running = (now: Date) => and(isNull(schema.boothSales.closedAt), lte(schema.boothSales.startsAt, now), gt(schema.boothSales.endsAt, now))

/** Sales running now in the vendor's booths. */
export async function activeSalesForVendor(db: AnyDb, vendorId: string, now: Date = new Date()): Promise<BoothSaleView[]> {
  const rows = await db
    .select({ booth: schema.booths.number, percent: schema.boothSales.percent, endsAt: schema.boothSales.endsAt })
    .from(schema.boothSales)
    .innerJoin(schema.booths, eq(schema.booths.id, schema.boothSales.boothId))
    .where(and(eq(schema.boothSales.vendorId, vendorId), running(now)))
  return rows.map((r) => toView(r.booth, r.percent, r.endsAt))
}

/** The newest live priced item in each of the vendor's booths. */
export async function salePreviewItems(db: AnyDb, vendorId: string): Promise<Record<string, SalePreviewItem>> {
  const rows = await db
    .select({ booth: schema.booths.number, title: schema.items.title, priceCents: schema.items.priceCents, photoUrl: schema.items.photoUrl })
    .from(schema.items)
    .innerJoin(schema.booths, eq(schema.booths.id, schema.items.boothId))
    .where(and(eq(schema.items.vendorId, vendorId), eq(schema.items.status, 'live'), isNotNull(schema.items.priceCents), isNull(schema.items.removedAt)))
    .orderBy(desc(schema.items.liveAt))
    .limit(50)
  const out: Record<string, SalePreviewItem> = {}
  for (const r of rows) if (!out[r.booth] && r.priceCents !== null) out[r.booth] = { title: r.title, priceCents: r.priceCents, photoUrl: r.photoUrl }
  return out
}

const isUniqueViolation = (err: unknown) => {
  const e = err as { code?: string; cause?: { code?: string } }
  return e?.code === '23505' || e?.cause?.code === '23505'
}

/**
 * Starts a sale in one of the vendor's booths, or replaces the one already there
 * (SPEC 5b: one sale per booth). `lastDay` is the YYYY-MM-DD the vendor picked; the
 * sale runs through the end of that day, mall time.
 */
export async function startBoothSale(
  db: AnyDb,
  session: VendorSession,
  input: { booth?: unknown; percent?: unknown; lastDay?: unknown },
  now: Date = new Date()
): Promise<SaleResult> {
  const booth = session.booths.find((b) => b.number === input.booth)
  if (!booth) return { ok: false, status: 422, error: 'Pick one of your booths.' }
  // Any whole percent from 1 to 90; the vendor types it (SPEC 5b).
  const percent = typeof input.percent === 'number' ? input.percent : typeof input.percent === 'string' && /^\d+$/.test(input.percent.trim()) ? Number(input.percent) : NaN
  if (!isSalePercent(percent)) return { ok: false, status: 422, error: `Enter a whole-number discount from ${MIN_SALE_PERCENT}% to ${MAX_SALE_PERCENT}%.` }
  const end = saleEndsAt(typeof input.lastDay === 'string' ? input.lastDay : '', now)
  if (!end.ok) return { ok: false, status: 422, error: end.error }

  try {
    return await db.transaction(async (tx) => {
      const open = await tx
        .select({ id: schema.boothSales.id, percent: schema.boothSales.percent, endsAt: schema.boothSales.endsAt })
        .from(schema.boothSales)
        .where(and(eq(schema.boothSales.boothId, booth.id), isNull(schema.boothSales.closedAt)))
        .for('update')
      if (open.length) {
        await tx.update(schema.boothSales).set({ closedAt: now }).where(inArray(schema.boothSales.id, open.map((o) => o.id)))
      }
      // A sale whose last day already passed isn't "replaced"; it had simply ended.
      const replaced = open.find((o) => o.endsAt > now)
      const [sale] = await tx
        .insert(schema.boothSales)
        .values({ vendorId: session.vendorId, boothId: booth.id, percent, startsAt: now, endsAt: end.endsAt })
        .returning({ id: schema.boothSales.id })
      await tx.insert(schema.activityLog).values({
        actor: 'vendor',
        vendorId: session.vendorId,
        deviceId: session.deviceId,
        action: replaced ? 'sale_replace' : 'sale_start',
        boothSaleId: sale.id,
        detail: {
          before: replaced ? { percent: replaced.percent, endsAt: replaced.endsAt.toISOString() } : null,
          after: { booth: booth.number, percent, lastDay: end.lastDay, endsAt: end.endsAt.toISOString() },
        },
      })
      return { ok: true as const, sale: toView(booth.number, percent, end.endsAt) }
    })
  } catch (err) {
    // Two taps at once: the one-open-sale-per-booth index lets only one through.
    if (isUniqueViolation(err)) return { ok: false, status: 409, error: 'Your sale was just changed. Reload the page to see it.' }
    throw err
  }
}

/** Ends the booth's sale now. Ending a sale that already finished just tidies it up. */
export async function endBoothSale(db: AnyDb, session: VendorSession, input: { booth?: unknown }, now: Date = new Date()): Promise<SaleResult> {
  const booth = session.booths.find((b) => b.number === input.booth)
  if (!booth) return { ok: false, status: 422, error: 'Pick one of your booths.' }
  return db.transaction(async (tx) => {
    const [open] = await tx
      .select({ id: schema.boothSales.id, percent: schema.boothSales.percent, startsAt: schema.boothSales.startsAt, endsAt: schema.boothSales.endsAt })
      .from(schema.boothSales)
      .where(and(eq(schema.boothSales.boothId, booth.id), isNull(schema.boothSales.closedAt)))
      .for('update')
    if (!open) return { ok: true as const, sale: null }
    const stillRunning = open.endsAt > now && open.startsAt <= now
    await tx
      .update(schema.boothSales)
      .set(stillRunning ? { endedEarlyAt: now, closedAt: now } : { closedAt: now })
      .where(eq(schema.boothSales.id, open.id))
    if (stillRunning) {
      await tx.insert(schema.activityLog).values({
        actor: 'vendor',
        vendorId: session.vendorId,
        deviceId: session.deviceId,
        action: 'sale_end',
        boothSaleId: open.id,
        detail: { before: { percent: open.percent, endsAt: open.endsAt.toISOString() }, after: { endedEarlyAt: now.toISOString() } },
      })
    }
    return { ok: true as const, sale: null }
  })
}
