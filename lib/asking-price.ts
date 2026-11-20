/**
 * Asking price on the Sell or donate form. Sellers must name a price in whole
 * US dollars; the form and the API share these rules so they never disagree.
 */
export const MAX_ASKING_PRICE = 1_000_000

/** Whole dollars from $1 to $1,000,000, or null when the input isn't a usable price. */
export function parseAskingPrice(input: unknown): number | null {
  if (typeof input !== 'string' && typeof input !== 'number') return null
  const raw = String(input).trim().replace(/[$,\s]/g, '')
  if (!/^\d+$/.test(raw)) return null
  const dollars = Number(raw)
  if (!Number.isSafeInteger(dollars) || dollars < 1 || dollars > MAX_ASKING_PRICE) return null
  return dollars
}

/** "$1,250" */
export const formatDollars = (dollars: number): string => `$${dollars.toLocaleString('en-US')}`

/** The reseller notice sellers must acknowledge before sending an item. */
export const BELOW_RETAIL_NOTICE = {
  title: 'We buy to resell',
  body:
    'Marietta Antique Mall is a reseller, so we can’t pay full retail price. We have to leave room to resell the piece and cover our costs. Offers are usually well below what an item would sell for in a shop.',
  acknowledgement: 'I understand the mall buys items below retail price.',
} as const
