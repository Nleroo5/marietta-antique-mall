/** Shopper-page types and labels, safe to import in browser code (no database imports). */

export interface FeedItem {
  id: string
  title: string
  priceCents: number | null
  askInStore: boolean
  category: string | null
  booth: string
  photoUrl: string
  photoW: number
  photoH: number
  /** ISO time the item went live, used for "posted 2 hours ago". */
  liveAt: string
  sold: boolean
  /** Booth sale running now (SPEC 5b), or null. Prices are never rewritten; the sale price is worked out on the page. */
  salePercent: number | null
  /** ISO time the sale ends (midnight after its last day, mall time), or null. */
  saleEndsAt: string | null
}

export const CATEGORY_LABELS: Record<string, string> = {
  furniture: 'Furniture',
  glass_china: 'Glass & China',
  pottery: 'Pottery',
  jewelry: 'Jewelry',
  collectibles: 'Collectibles',
  art: 'Art',
  lighting: 'Lighting',
  textiles: 'Textiles',
  books: 'Books',
  home: 'Home',
  other: 'Other',
}
