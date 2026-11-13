import { and, eq, inArray, isNull, sql } from 'drizzle-orm'
import * as schema from './schema'
import { isVendorBlobUrl, MAX_ITEMS_PER_POST, MAX_PHOTO_BYTES, PHOTO_CONTENT_TYPE } from './blob'
import { addDays, ITEM_LIFETIME_DAYS, parsePriceInput } from './pricing'
import type { AnyDb, VendorSession } from './types'

/**
 * Until the AI photo check is built (SPEC build step 4), posted items go live
 * straight away. When it is on, they start as 'checking' instead.
 */
export const PHOTO_CHECK_ENABLED = false

export interface PostedCardInput {
  url: unknown
  width: unknown
  height: unknown
  title: unknown
  price: unknown
  askInStore: unknown
  booth?: unknown
}

export interface ValidCard {
  url: string
  width: number
  height: number
  title: string
  priceCents: number | null
  askInStore: boolean
  boothId: string
}

export type CardError = { index: number; field: 'photo' | 'title' | 'price' | 'booth'; message: string }

/** Control characters, zero-width characters, line/paragraph separators, BOM. */
function isInvisible(cp: number): boolean {
  return cp <= 0x1f || (cp >= 0x7f && cp <= 0x9f) || (cp >= 0x200b && cp <= 0x200f) || cp === 0x2028 || cp === 0x2029 || cp === 0xfeff
}

/** Collapse whitespace and drop invisible characters. Nothing else is changed. */
export function cleanTitle(value: string): string {
  return Array.from(value, (ch) => (isInvisible(ch.codePointAt(0)!) ? ' ' : ch))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

const isDim = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 10_000

/**
 * Checks what the vendor's browser sent, card by card. Pure: no database or network.
 * The vendor's title and price are the record (SPEC rule 3), so nothing is rewritten
 * beyond trimming whitespace.
 */
export function validateCards(
  input: unknown,
  session: Pick<VendorSession, 'vendorId' | 'booths'>
): { ok: true; cards: ValidCard[] } | { ok: false; errors: CardError[]; message?: string } {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, errors: [], message: 'Add at least one photo.' }
  if (input.length > MAX_ITEMS_PER_POST) {
    return { ok: false, errors: [], message: `Post up to ${MAX_ITEMS_PER_POST} items at a time.` }
  }

  const errors: CardError[] = []
  const cards: ValidCard[] = []
  const seen = new Set<string>()

  input.forEach((raw: PostedCardInput, index) => {
    const c = raw && typeof raw === 'object' ? raw : ({} as PostedCardInput)

    const url = typeof c.url === 'string' ? c.url : ''
    if (!isVendorBlobUrl(url, session.vendorId) || !isDim(c.width) || !isDim(c.height)) {
      errors.push({ index, field: 'photo', message: 'This photo did not upload. Remove it and add it again.' })
    } else if (seen.has(url)) {
      errors.push({ index, field: 'photo', message: 'This photo is in the list twice.' })
    }
    seen.add(url)

    const title = typeof c.title === 'string' ? cleanTitle(c.title) : ''
    if (!title) errors.push({ index, field: 'title', message: 'Add a title, like what the tag says.' })
    else if (title.length > 80) errors.push({ index, field: 'title', message: 'Keep the title under 80 characters.' })

    const askInStore = c.askInStore === true
    let priceCents: number | null = null
    if (!askInStore) {
      const parsed = parsePriceInput(typeof c.price === 'string' ? c.price : '')
      if (parsed.ok) priceCents = parsed.cents
      else errors.push({ index, field: 'price', message: parsed.error })
    }

    let boothId: string | undefined
    if (session.booths.length === 1 && (c.booth === undefined || c.booth === session.booths[0].number)) {
      boothId = session.booths[0].id
    } else {
      boothId = session.booths.find((b) => b.number === c.booth)?.id
    }
    if (!boothId) errors.push({ index, field: 'booth', message: 'Pick which booth this is in.' })

    if (!errors.some((e) => e.index === index)) {
      cards.push({ url, width: c.width as number, height: c.height as number, title, priceCents, askInStore, boothId: boothId! })
    }
  })

  return errors.length ? { ok: false, errors } : { ok: true, cards }
}

export interface BlobInfo {
  size: number
  contentType: string
}

/**
 * Confirms each photo really is in our Blob store, is a JPEG, and is within size.
 * `headBlob` is @vercel/blob's head(), injected so tests don't need the network.
 */
export async function verifyPhotos(
  cards: ValidCard[],
  headBlob: (url: string) => Promise<BlobInfo>
): Promise<CardError[]> {
  const results = await Promise.all(
    cards.map(async (card, index): Promise<CardError | null> => {
      try {
        const info = await headBlob(card.url)
        if (info.contentType !== PHOTO_CONTENT_TYPE || info.size <= 0 || info.size > MAX_PHOTO_BYTES) {
          return { index, field: 'photo', message: 'This photo could not be used. Remove it and add it again.' }
        }
        return null
      } catch {
        return { index, field: 'photo', message: 'This photo did not finish uploading. Remove it and add it again.' }
      }
    })
  )
  return results.filter((r): r is CardError => r !== null)
}

export type CreateResult =
  | { ok: true; itemIds: string[] }
  | { ok: false; code: 'CONSENT_REQUIRED' | 'ALREADY_POSTED'; message: string; indexes?: number[] }

/**
 * Creates the items in one transaction: consent (first post only), items, the
 * upload records, and one activity row per item.
 */
export async function createItems(
  db: AnyDb,
  session: VendorSession,
  cards: ValidCard[],
  opts: { consent: boolean; now?: Date }
): Promise<CreateResult> {
  const now = opts.now ?? new Date()
  return db.transaction(async (tx) => {
    const [vendor] = await tx
      .select({ consentAt: schema.vendors.consentAt })
      .from(schema.vendors)
      .where(eq(schema.vendors.id, session.vendorId))
      .for('update')
    if (!vendor.consentAt) {
      if (!opts.consent) {
        return { ok: false as const, code: 'CONSENT_REQUIRED' as const, message: 'Tick the box to confirm these are your items and photos.' }
      }
      await tx.update(schema.vendors).set({ consentAt: now }).where(eq(schema.vendors.id, session.vendorId))
    }

    // A double tap on Post must not create the same items twice.
    const urls = cards.map((c) => c.url)
    const existing = await tx.select({ url: schema.items.photoUrl }).from(schema.items).where(inArray(schema.items.photoUrl, urls))
    if (existing.length) {
      const dup = new Set(existing.map((e) => e.url))
      return {
        ok: false as const,
        code: 'ALREADY_POSTED' as const,
        message: 'Some of these were already posted.',
        indexes: cards.map((c, i) => (dup.has(c.url) ? i : -1)).filter((i) => i >= 0),
      }
    }

    const live = !PHOTO_CHECK_ENABLED
    const inserted = await tx
      .insert(schema.items)
      .values(
        cards.map((c) => ({
          vendorId: session.vendorId,
          boothId: c.boothId,
          status: live ? ('live' as const) : ('checking' as const),
          title: c.title,
          priceCents: c.priceCents,
          askInStore: c.askInStore,
          photoUrl: c.url,
          photoW: c.width,
          photoH: c.height,
          postedAt: now,
          liveAt: live ? now : null,
          expiresAt: live ? addDays(now, ITEM_LIFETIME_DAYS) : null,
        }))
      )
      .returning({ id: schema.items.id, url: schema.items.photoUrl })

    const idByUrl = new Map(inserted.map((r) => [r.url, r.id]))
    for (const c of cards) {
      await tx
        .insert(schema.uploads)
        .values({ vendorId: session.vendorId, url: c.url, itemId: idByUrl.get(c.url)! })
        .onConflictDoUpdate({ target: schema.uploads.url, set: { itemId: idByUrl.get(c.url)! } })
    }
    await tx.insert(schema.activityLog).values(
      cards.map((c) => ({
        actor: 'vendor' as const,
        vendorId: session.vendorId,
        deviceId: session.deviceId,
        action: 'post',
        itemId: idByUrl.get(c.url)!,
        detail: { after: { title: c.title, priceCents: c.priceCents, askInStore: c.askInStore, boothId: c.boothId } },
      }))
    )
    return { ok: true as const, itemIds: cards.map((c) => idByUrl.get(c.url)!) }
  })
}

/** Records a finished upload right away, so photos from cards that are never posted can be cleaned up. */
export async function registerUpload(db: AnyDb, session: VendorSession, url: string): Promise<boolean> {
  if (!isVendorBlobUrl(url, session.vendorId)) return false
  await db.insert(schema.uploads).values({ vendorId: session.vendorId, url }).onConflictDoNothing({ target: schema.uploads.url })
  return true
}

/** Live items for the vendor's home screen count. */
export async function countLiveItems(db: AnyDb, vendorId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.items)
    .where(and(eq(schema.items.vendorId, vendorId), eq(schema.items.status, 'live'), isNull(schema.items.removedAt)))
  return Number(row?.n ?? 0)
}
