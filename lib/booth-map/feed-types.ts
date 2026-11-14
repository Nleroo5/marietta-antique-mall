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
