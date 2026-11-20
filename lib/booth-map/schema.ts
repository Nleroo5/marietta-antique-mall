/**
 * Live Booth Map database schema (docs/booth-map/SPEC.md, section 4).
 *
 * Differences from the spec's table list, each needed by a rule elsewhere in the
 * spec or found in the Phase 1 audit:
 *
 * Vendors and access (link only, no PIN)
 * - vendors.link_version + vendor_devices.link_version: a cookie is valid only while
 *   its version matches the vendor's. Resetting a lost link is one UPDATE that signs
 *   out every phone at once, with no window for a device to slip through.
 * - vendor_devices.revoked_at: sign out a single phone from admin.
 * - vendors.is_test: test vendors never appear on public pages.
 * - vendors.email: the "did this sell?" and monthly stats emails need an address.
 * - vendor_status 'removed': vendors are offboarded, never deleted, so their item,
 *   match and stats history survives.
 * - auth_attempts: wrong-link counters (keys are hashed) live here because Upstash is
 *   not configured and the in-memory limiter does not hold across server instances.
 *
 * Items
 * - booths.number is text: the floor plan is unknown and may use numbers like "114A".
 * - category is text with a CHECK, not an enum, because the list is still [decide].
 * - ask_in_store replaces the free-text price_note: exactly one of a price or
 *   "ask in store", so an empty note can never stand in for a price.
 * - live_at: the 30 days start when an item goes live, not when it was uploaded, so a
 *   held photo approved later does not lose days.
 * - removed_at / photo_deleted_at: the cleanup job deletes photos 7 days after an
 *   item leaves the page. Both are tied to status so a live item's photo can't be
 *   deleted.
 * - Sold history is kept when a sold item is later removed (success measures).
 * - uploads: every Blob file, posted or not, so abandoned uploads get cleaned up too.
 *
 * Booth sales
 * - closed_at + a partial unique index: one open sale per booth, enforced by the
 *   database, and the sale-end job knows which sales it has already handled.
 *
 * Sales reports
 * - sold_lines.line_no + unique(job_id, line_no): a retried job can't duplicate lines
 *   or send the vendor the same question twice.
 * - booth_number, sold_on, method, reason, applied_at, reviewed_correct,
 *   asked_email_sent_at: matching by booth, the report's own sale date, the AI's
 *   one-line reason, and shadow mode ("would have" vs "did").
 * - inbound_jobs.from_address / started_at / next_attempt_at: sender allowlist, stuck
 *   job detection, and retry scheduling.
 *
 * Other
 * - activity_log.detail is jsonb with before and after values so admin can undo.
 * - events.visitor_hash so views can be counted once per visitor.
 */
import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { MAX_PRICE_CENTS, MAX_SALE_DAYS, MAX_SALE_PERCENT, MIN_SALE_PERCENT } from './pricing'

const id = () => uuid('id').primaryKey().defaultRandom()
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
const ts = (name: string) => timestamp(name, { withTimezone: true })

// [decide] Align with the Sell page's categories before the AI prompt is written (SPEC 6).
export const ITEM_CATEGORIES = [
  'furniture',
  'glass_china',
  'pottery',
  'jewelry',
  'collectibles',
  'art',
  'lighting',
  'textiles',
  'books',
  'home',
  'other',
] as const
export type ItemCategory = (typeof ITEM_CATEGORIES)[number]

export const vendorStatus = pgEnum('vendor_status', ['active', 'paused', 'removed'])
export const itemStatus = pgEnum('item_status', ['checking', 'live', 'held', 'sold', 'expired', 'removed'])
export const soldSource = pgEnum('sold_source', ['vendor', 'report', 'admin'])
export const jobStatus = pgEnum('job_status', ['queued', 'processing', 'done', 'failed'])
export const matchConfidence = pgEnum('match_confidence', ['high', 'medium', 'low'])
export const matchAction = pgEnum('match_action', ['auto', 'asked', 'ignored'])
export const matchMethod = pgEnum('match_method', ['code', 'haiku', 'sonnet'])
export const actor = pgEnum('actor', ['vendor', 'admin', 'system'])

const sqlList = (values: readonly (string | number)[]) =>
  sql.raw(values.map((v) => (typeof v === 'number' ? String(v) : `'${v}'`)).join(', '))

export const vendors = pgTable(
  'vendors',
  {
    id: id(),
    name: text('name').notNull(),
    displayName: text('display_name').notNull(),
    email: text('email'),
    tokenHash: text('token_hash').notNull().unique(),
    linkVersion: integer('link_version').notNull().default(1),
    status: vendorStatus('status').notNull().default('active'),
    isTest: boolean('is_test').notNull().default(false),
    consentAt: ts('consent_at'),
    statsEmailOptOutAt: ts('stats_email_opt_out_at'),
    createdAt: createdAt(),
  },
  (t) => [
    check('vendors_name_present', sql`btrim(${t.name}) <> '' and btrim(${t.displayName}) <> ''`),
    check('vendors_link_version_positive', sql`${t.linkVersion} > 0`),
  ]
)

export const vendorDevices = pgTable(
  'vendor_devices',
  {
    id: id(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'restrict' }),
    deviceCookieHash: text('device_cookie_hash').notNull().unique(),
    linkVersion: integer('link_version').notNull(),
    firstSeenAt: ts('first_seen_at').notNull().defaultNow(),
    lastSeenAt: ts('last_seen_at').notNull().defaultNow(),
    revokedAt: ts('revoked_at'),
  },
  (t) => [index('vendor_devices_vendor_idx').on(t.vendorId)]
)

export const booths = pgTable(
  'booths',
  {
    id: id(),
    number: text('number').notNull().unique(),
    vendorId: uuid('vendor_id').references(() => vendors.id, { onDelete: 'restrict' }),
    svgId: text('svg_id').unique(),
    zone: text('zone'),
  },
  (t) => [
    index('booths_vendor_idx').on(t.vendorId),
    // Uppercase letters, digits and dashes only: safe in a URL path, and '114a' can't
    // exist beside '114A'. The app uppercases what it is given.
    check('booths_number_format', sql`${t.number} ~ '^[A-Z0-9-]{1,12}$'`),
  ]
)

export const items = pgTable(
  'items',
  {
    id: id(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'restrict' }),
    boothId: uuid('booth_id').notNull().references(() => booths.id, { onDelete: 'restrict' }),
    status: itemStatus('status').notNull().default('checking'),
    title: text('title').notNull(),
    priceCents: integer('price_cents'),
    askInStore: boolean('ask_in_store').notNull().default(false),
    category: text('category'),
    tagNumber: text('tag_number'),
    photoUrl: text('photo_url').notNull(),
    photoW: integer('photo_w').notNull(),
    photoH: integer('photo_h').notNull(),
    aiSuggestedTitle: text('ai_suggested_title'),
    aiCheckAttempts: integer('ai_check_attempts').notNull().default(0),
    holdReason: text('hold_reason'),
    postedAt: ts('posted_at').notNull().defaultNow(),
    liveAt: ts('live_at'),
    expiresAt: ts('expires_at'),
    soldAt: ts('sold_at'),
    soldSource: soldSource('sold_source'),
    removedAt: ts('removed_at'),
    photoDeletedAt: ts('photo_deleted_at'),
  },
  (t) => [
    // The feed orders by go-live time, so this replaces the spec's (status, posted_at desc).
    index('items_status_live_idx').on(t.status, t.liveAt.desc()),
    index('items_booth_status_idx').on(t.boothId, t.status),
    index('items_vendor_status_idx').on(t.vendorId, t.status),
    // A photo belongs to one item. Backs up the double-post check in createItems.
    uniqueIndex('items_photo_url_idx').on(t.photoUrl),
    check('items_title', sql`btrim(${t.title}) <> '' and char_length(${t.title}) <= 80`),
    check('items_price_xor_ask', sql`(${t.priceCents} is not null) <> ${t.askInStore}`),
    check('items_price_range', sql`${t.priceCents} is null or ${t.priceCents} between 0 and ${sql.raw(String(MAX_PRICE_CENTS))}`),
    check('items_category', sql`${t.category} is null or ${t.category} in (${sqlList(ITEM_CATEGORIES)})`),
    check('items_photo_size', sql`${t.photoW} > 0 and ${t.photoH} > 0`),
    check('items_held_reason', sql`${t.status} <> 'held' or ${t.holdReason} is not null`),
    // Anything live, sold or expired carries both timestamps. A removed item may never
    // have gone live (a rejected held photo, or a card removed during the AI check).
    check(
      'items_live_window',
      sql`${t.status} in ('checking', 'held', 'removed') or (${t.liveAt} is not null and ${t.expiresAt} is not null and ${t.expiresAt} > ${t.liveAt})`
    ),
    // sold_at and sold_source come as a pair, and a sold item always has them. A sold
    // item that is later removed keeps them, so sales history survives.
    check('items_sold_pair', sql`(${t.soldAt} is null) = (${t.soldSource} is null)`),
    check('items_sold_has_date', sql`${t.status} <> 'sold' or ${t.soldAt} is not null`),
    // Undoing a sale must clear sold_at and sold_source, or stats would count it.
    check('items_sold_only_when_sold', sql`${t.soldAt} is null or ${t.status} in ('sold', 'removed')`),
    check('items_removed_has_date', sql`(${t.status} = 'removed') = (${t.removedAt} is not null)`),
    check('items_photo_deleted_only_off_page', sql`${t.photoDeletedAt} is null or ${t.status} in ('sold', 'expired', 'removed')`),
  ]
)

export const itemPhotos = pgTable(
  'item_photos',
  {
    id: id(),
    itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
    url: text('url').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
  },
  (t) => [
    uniqueIndex('item_photos_item_position_idx').on(t.itemId, t.position),
    check('item_photos_size', sql`${t.width} > 0 and ${t.height} > 0 and ${t.position} >= 1`),
  ]
)

/** Every file put in Blob, so files from cards that were never posted can be found and deleted. */
export const uploads = pgTable(
  'uploads',
  {
    id: id(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'restrict' }),
    url: text('url').notNull().unique(),
    itemId: uuid('item_id').references(() => items.id, { onDelete: 'restrict' }),
    createdAt: createdAt(),
    deletedAt: ts('deleted_at'),
  },
  (t) => [index('uploads_unclaimed_idx').on(t.createdAt).where(sql`${t.itemId} is null and ${t.deletedAt} is null`)]
)

export const boothSales = pgTable(
  'booth_sales',
  {
    id: id(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'restrict' }),
    boothId: uuid('booth_id').notNull().references(() => booths.id, { onDelete: 'restrict' }),
    percent: integer('percent').notNull(),
    startsAt: ts('starts_at').notNull().defaultNow(),
    endsAt: ts('ends_at').notNull(),
    endedEarlyAt: ts('ended_early_at'),
    /** Set when the sale is replaced, ended early, or handled by the sale-end job. */
    closedAt: ts('closed_at'),
  },
  (t) => [
    index('booth_sales_booth_idx').on(t.boothId, t.endsAt),
    uniqueIndex('booth_sales_one_open_per_booth').on(t.boothId).where(sql`${t.closedAt} is null`),
    check('booth_sales_percent', sql`${t.percent} between ${sql.raw(String(MIN_SALE_PERCENT))} and ${sql.raw(String(MAX_SALE_PERCENT))}`),
    // Two days of slack over the 30-day maximum. The sale ends at midnight after the
    // picked day, Eastern, so starting just after midnight already uses almost a full
    // extra day, and the November clock change adds one more hour. One day of slack
    // rejected that case (found in the booth-sale audit). The app enforces 30 days.
    check(
      'booth_sales_window',
      sql`${t.endsAt} > ${t.startsAt} and ${t.endsAt} <= ${t.startsAt} + interval '${sql.raw(String(MAX_SALE_DAYS + 2))} days'`
    ),
    check('booth_sales_ended_early', sql`${t.endedEarlyAt} is null or (${t.endedEarlyAt} >= ${t.startsAt} and ${t.closedAt} is not null)`),
  ]
)

export const activityLog = pgTable(
  'activity_log',
  {
    id: id(),
    actor: actor('actor').notNull(),
    vendorId: uuid('vendor_id').references(() => vendors.id, { onDelete: 'restrict' }),
    deviceId: uuid('device_id').references(() => vendorDevices.id, { onDelete: 'restrict' }),
    action: text('action').notNull(),
    itemId: uuid('item_id').references(() => items.id, { onDelete: 'restrict' }),
    boothSaleId: uuid('booth_sale_id').references(() => boothSales.id, { onDelete: 'restrict' }),
    /** { before, after } for anything admin may need to undo. */
    detail: jsonb('detail'),
    createdAt: createdAt(),
  },
  (t) => [
    index('activity_log_vendor_idx').on(t.vendorId, t.createdAt.desc()),
    index('activity_log_item_idx').on(t.itemId),
    check('activity_log_vendor_actor', sql`${t.actor} <> 'vendor' or ${t.vendorId} is not null`),
  ]
)

export const inboundJobs = pgTable(
  'inbound_jobs',
  {
    id: id(),
    resendEmailId: text('resend_email_id').notNull().unique(),
    fromAddress: text('from_address'),
    status: jobStatus('status').notNull().default('queued'),
    attempts: integer('attempts').notNull().default(0),
    error: text('error'),
    receivedAt: ts('received_at').notNull().defaultNow(),
    startedAt: ts('started_at'),
    nextAttemptAt: ts('next_attempt_at'),
    finishedAt: ts('finished_at'),
  },
  (t) => [index('inbound_jobs_due_idx').on(t.status, t.nextAttemptAt)]
)

export const soldLines = pgTable(
  'sold_lines',
  {
    id: id(),
    jobId: uuid('job_id').notNull().references(() => inboundJobs.id, { onDelete: 'restrict' }),
    lineNo: integer('line_no').notNull(),
    vendorId: uuid('vendor_id').references(() => vendors.id, { onDelete: 'restrict' }),
    boothNumber: text('booth_number'),
    rawText: text('raw_text').notNull(),
    priceCents: integer('price_cents'),
    tagNumber: text('tag_number'),
    soldOn: date('sold_on'),
    matchedItemId: uuid('matched_item_id').references(() => items.id, { onDelete: 'restrict' }),
    confidence: matchConfidence('confidence'),
    method: matchMethod('method'),
    reason: text('reason'),
    action: matchAction('action'),
    /** Null in shadow mode: the matcher decided, but nothing was changed. */
    appliedAt: ts('applied_at'),
    /** Set by admin while in shadow mode, to prove there are no wrong matches. */
    reviewedCorrect: boolean('reviewed_correct'),
    askTokenHash: text('ask_token_hash').unique(),
    askedEmailSentAt: ts('asked_email_sent_at'),
    answer: text('answer'),
    answeredAt: ts('answered_at'),
  },
  (t) => [
    uniqueIndex('sold_lines_job_line_idx').on(t.jobId, t.lineNo),
    index('sold_lines_matched_item_idx').on(t.matchedItemId),
    check('sold_lines_answer', sql`(${t.answer} is null) = (${t.answeredAt} is null) and (${t.answer} is null or ${t.answer} in ('yes', 'no'))`),
    check('sold_lines_line_no', sql`${t.lineNo} >= 1`),
  ]
)

export const events = pgTable(
  'events',
  {
    id: id(),
    itemId: uuid('item_id').references(() => items.id, { onDelete: 'set null' }),
    boothId: uuid('booth_id').references(() => booths.id, { onDelete: 'set null' }),
    type: text('type').notNull(),
    visitorHash: text('visitor_hash'),
    utmSource: text('utm_source'),
    utmCampaign: text('utm_campaign'),
    createdAt: createdAt(),
  },
  (t) => [
    index('events_created_idx').on(t.createdAt),
    index('events_item_idx').on(t.itemId),
    index('events_booth_idx').on(t.boothId),
  ]
)

/** Keys are hashed (e.g. sha256 of "ip:<address>"), never raw IP addresses. Purge old rows. */
export const authAttempts = pgTable('auth_attempts', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  windowStart: ts('window_start').notNull().defaultNow(),
  blockedUntil: ts('blocked_until'),
})
