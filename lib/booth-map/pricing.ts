/**
 * Prices are stored in whole cents and never rewritten by a booth sale. The sale
 * price is worked out when a page renders (SPEC section 5b).
 */
export const SALE_PERCENTS = [10, 15, 20, 25, 30, 50] as const
export type SalePercent = (typeof SALE_PERCENTS)[number]

export const ITEM_LIFETIME_DAYS = 30
export const SOLD_STAMP_HOURS = 48
export const PHOTO_DELETE_AFTER_DAYS = 7
export const MAX_SALE_DAYS = 30
/** $1,000,000. Shared by the price parser and the database CHECK so they can't disagree. */
export const MAX_PRICE_CENTS = 100_000_000

export function isSalePercent(value: unknown): value is SalePercent {
  return typeof value === 'number' && (SALE_PERCENTS as readonly number[]).includes(value)
}

/**
 * The discounted price to the cent, rounded half up: what the register charges.
 *
 * v3.2 of the spec rounded to the nearest whole dollar. The Phase 1 audit showed
 * that breaks cheap items ($2.99 at 10% off showed a "sale" price of $3, and $1 at
 * 50% off showed no discount) and that it can never match the register. Pending
 * the owner's answer on how the register applies booth sales.
 */
export function salePriceCents(priceCents: number, percent: SalePercent): number {
  if (!Number.isInteger(priceCents) || priceCents < 0 || priceCents > MAX_PRICE_CENTS) {
    throw new RangeError(`priceCents must be an integer from 0 to ${MAX_PRICE_CENTS}, got ${priceCents}`)
  }
  // Integer arithmetic: priceCents * (100 - percent) is exact, and adding 50 before
  // the integer division rounds half up without floating-point error.
  return Math.floor((priceCents * (100 - percent) + 50) / 100)
}

/** "$1,250" for whole dollars, "$12.50" otherwise. */
export function formatPrice(priceCents: number): string {
  const dollars = Math.floor(priceCents / 100)
  const cents = priceCents % 100
  const whole = `$${dollars.toLocaleString('en-US')}`
  return cents === 0 ? whole : `${whole}.${String(cents).padStart(2, '0')}`
}

export type ParsedPrice = { ok: true; cents: number } | { ok: false; error: string }

/**
 * Parses what a vendor types in the price box. Accepts "45", "$45", "45.5", "45.50",
 * "1,250" and "1,250.00". A comma followed by one or two digits ("45,50") is read as
 * a decimal comma, which some phone keyboards show on the decimal pad. Thousands
 * groups always have three digits, so the two readings never overlap.
 */
export function parsePriceInput(input: string): ParsedPrice {
  const raw = input.trim().replace(/^\$\s*/, '')
  let normalized: string
  if (/^\d+(\.\d{1,2})?$/.test(raw)) normalized = raw
  else if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(raw)) normalized = raw.replace(/,/g, '')
  else if (/^\d+,\d{1,2}$/.test(raw)) normalized = raw.replace(',', '.')
  else return { ok: false, error: 'Enter a price like 45 or 45.50.' }

  const [whole, frac = ''] = normalized.split('.')
  if (whole.length > 7) return { ok: false, error: 'That price is too high. Check for an extra zero.' }
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, '0'))
  if (cents > MAX_PRICE_CENTS) return { ok: false, error: 'That price is too high. Check for an extra zero.' }
  return { ok: true, cents }
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}
