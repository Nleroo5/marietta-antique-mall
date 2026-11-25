import { and, desc, eq, gt, isNull, lte, or, sql, type SQL } from 'drizzle-orm'
import * as schema from './schema'
import { SOLD_STAMP_HOURS } from './pricing'
import type { AnyDb } from './types'
import type { FeedItem } from './feed-types'

export type { FeedItem } from './feed-types'
export { CATEGORY_LABELS } from './feed-types'

/**
 * What shoppers can see (SPEC sections 2 and 8). One set of rules for the feed,
 * booth pages and item pages:
 * - live items that have not passed their 30 days,
 * - sold items for 48 hours after the sale, shown with a SOLD stamp,
 * - only from active vendors,
 * - never test vendors, except on preview deployments (owner's choice).
 * Checking, held, expired and removed items are never shown.
 */

export const FEED_LIMIT = 200

export interface FeedOptions {
  includeTest: boolean
  /** Show booth sales (off on the live site until the owner says yes; see lib/booth-map/sales.ts). */
  includeSales?: boolean
  now?: Date
}

/** Test vendors show on preview deployments and locally, never on the live site. */
export function includeTestVendors(): boolean {
  return process.env.VERCEL_ENV !== 'production'
}

function visible(opts: FeedOptions): SQL {
  const now = opts.now ?? new Date()
  const soldCutoff = new Date(now.getTime() - SOLD_STAMP_HOURS * 60 * 60 * 1000)
  return and(
    eq(schema.vendors.status, 'active'),
    opts.includeTest ? undefined : eq(schema.vendors.isTest, false),
    or(
      and(eq(schema.items.status, 'live'), gt(schema.items.expiresAt, now)),
      and(eq(schema.items.status, 'sold'), gt(schema.items.soldAt, soldCutoff))
    )
  )!
}

const columns = {
  id: schema.items.id,
  title: schema.items.title,
  priceCents: schema.items.priceCents,
  askInStore: schema.items.askInStore,
  category: schema.items.category,
  booth: schema.booths.number,
  photoUrl: schema.items.photoUrl,
  photoW: schema.items.photoW,
  photoH: schema.items.photoH,
  liveAt: schema.items.liveAt,
  status: schema.items.status,
  salePercent: schema.boothSales.percent,
  saleEndsAt: schema.boothSales.endsAt,
}

type Row = { [K in keyof typeof columns]: unknown } & { liveAt: Date | null; status: string; salePercent: number | null; saleEndsAt: Date | null }

function toFeedItem(r: Row): FeedItem {
  return {
    id: r.id as string,
    title: r.title as string,
    priceCents: r.priceCents as number | null,
    askInStore: r.askInStore as boolean,
    category: r.category as string | null,
    booth: r.booth as string,
    photoUrl: r.photoUrl as string,
    photoW: r.photoW as number,
    photoH: r.photoH as number,
    liveAt: (r.liveAt ?? new Date(0)).toISOString(),
    sold: r.status === 'sold',
    salePercent: r.salePercent ?? null,
    saleEndsAt: r.saleEndsAt ? r.saleEndsAt.toISOString() : null,
  }
}

/** The booth's running sale, if any (at most one: one open sale per booth is a unique index). */
function base(db: AnyDb, opts: FeedOptions) {
  const now = opts.now ?? new Date()
  return db
    .select(columns)
    .from(schema.items)
    .innerJoin(schema.booths, eq(schema.booths.id, schema.items.boothId))
    .innerJoin(schema.vendors, eq(schema.vendors.id, schema.items.vendorId))
    .leftJoin(
      schema.boothSales,
      and(
        opts.includeSales ? undefined : sql`false`,
        eq(schema.boothSales.boothId, schema.items.boothId),
        // Only the item's own vendor's sale: if a booth changes hands, one vendor's sale never discounts another's items.
        eq(schema.boothSales.vendorId, schema.items.vendorId),
        isNull(schema.boothSales.closedAt),
        lte(schema.boothSales.startsAt, now),
        gt(schema.boothSales.endsAt, now)
      )
    )
}

/** Newest first. */
export async function getFeed(db: AnyDb, opts: FeedOptions): Promise<FeedItem[]> {
  const rows = await base(db, opts).where(visible(opts)).orderBy(desc(schema.items.liveAt), desc(schema.items.id)).limit(FEED_LIMIT)
  return rows.map((r) => toFeedItem(r as Row))
}

/**
 * A booth's items, or null when the booth doesn't exist or has no vendor shoppers
 * may see (paused, removed, or a test vendor on the live site). Null becomes a 404,
 * so made-up booth numbers don't get real-looking pages.
 */
export async function getBoothFeed(db: AnyDb, boothNumber: string, opts: FeedOptions): Promise<FeedItem[] | null> {
  const [booth] = await db
    .select({ id: schema.booths.id })
    .from(schema.booths)
    .innerJoin(schema.vendors, eq(schema.vendors.id, schema.booths.vendorId))
    .where(
      and(
        eq(schema.booths.number, boothNumber),
        eq(schema.vendors.status, 'active'),
        opts.includeTest ? undefined : eq(schema.vendors.isTest, false)
      )
    )
    .limit(1)
  if (!booth) return null
  const rows = await base(db, opts)
    .where(and(visible(opts), eq(schema.booths.number, boothNumber)))
    .orderBy(desc(schema.items.liveAt), desc(schema.items.id))
    .limit(FEED_LIMIT)
  return rows.map((r) => toFeedItem(r as Row))
}

/**
 * Booth numbers with a vendor shoppers may see, for the store map: the same rule as
 * getBoothFeed, so every booth the map lights up opens a real booth page.
 */
export async function getMapBooths(db: AnyDb, opts: FeedOptions): Promise<string[]> {
  const rows = await db
    .selectDistinct({ number: schema.booths.number })
    .from(schema.booths)
    .innerJoin(schema.vendors, eq(schema.vendors.id, schema.booths.vendorId))
    .where(and(eq(schema.vendors.status, 'active'), opts.includeTest ? undefined : eq(schema.vendors.isTest, false)))
    .orderBy(schema.booths.number)
  return rows.map((r) => r.number)
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export async function getVisibleItem(db: AnyDb, id: string, opts: FeedOptions): Promise<FeedItem | null> {
  if (!UUID.test(id)) return null
  const rows = await base(db, opts).where(and(visible(opts), eq(schema.items.id, id))).limit(1)
  return rows[0] ? toFeedItem(rows[0] as Row) : null
}

/** Booth numbers are stored uppercase (letters, digits, dashes). */
export function normalizeBoothNumber(raw: string): string | null {
  const n = raw.trim().toUpperCase() // route params arrive already decoded
  return /^[A-Z0-9-]{1,12}$/.test(n) ? n : null
}
