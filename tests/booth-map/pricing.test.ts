import { describe, expect, it } from 'vitest'
import { formatPrice, isSalePercent, MAX_PRICE_CENTS, MAX_SALE_PERCENT, MIN_SALE_PERCENT, parsePriceInput, parseSalePercentInput, salePriceCents } from '@/lib/booth-map/pricing'

const ALL_PERCENTS = Array.from({ length: MAX_SALE_PERCENT - MIN_SALE_PERCENT + 1 }, (_, i) => MIN_SALE_PERCENT + i)

describe('salePriceCents: exact discounted price to the cent, half up', () => {
  it.each([
    [14500, 20, 11600], // $145 at 20% = $116
    [14500, 30, 10150], // $101.50, not rounded to a dollar
    [299, 10, 269], // $2.99 at 10% = $2.69 (whole-dollar rounding showed $3)
    [199, 10, 179],
    [100, 50, 50], // $1 at 50% = $0.50 (whole-dollar rounding showed $1)
    [4999, 15, 4249], // 4249.15
    [4995, 10, 4496], // 4495.5 rounds half up
    [0, 50, 0],
    [14500, 35, 9425], // any whole percent: $145 at 35% = $94.25
    [14500, 1, 14355],
    [14500, 90, 1450],
  ])('%i cents at %i%% -> %i', (price, pct, expected) => {
    expect(salePriceCents(price, pct as 10)).toBe(expected)
  })

  it('matches exact arithmetic for every allowed percent across a wide price range', () => {
    for (const p of ALL_PERCENTS) {
      for (let cents = 0; cents <= 50_000; cents += 7) {
        const exact = (cents * (100 - p)) / 100
        expect(salePriceCents(cents, p)).toBe(Math.floor(exact + 0.5))
      }
    }
  })

  it('is always below the original price for anything priced at $1 or more, at every percent', () => {
    // At 1% off, items under 51 cents round back to their own price; from $1 up, never.
    for (const p of ALL_PERCENTS) {
      for (let cents = 100; cents <= 20_000; cents += 3) {
        expect(salePriceCents(cents, p)).toBeLessThan(cents)
      }
    }
  })

  it('works at the maximum price without overflow', () => {
    expect(salePriceCents(MAX_PRICE_CENTS, 10)).toBe(90_000_000)
  })

  it('rejects bad prices', () => {
    expect(() => salePriceCents(-1, 10)).toThrow(RangeError)
    expect(() => salePriceCents(10.5, 10)).toThrow(RangeError)
    expect(() => salePriceCents(MAX_PRICE_CENTS + 1, 10)).toThrow(RangeError)
  })

  it('rejects percents outside 1 to 90 or not whole', () => {
    for (const bad of [0, 91, 100, 12.5, -5]) expect(() => salePriceCents(1000, bad)).toThrow(RangeError)
  })
})

describe('isSalePercent', () => {
  it('accepts any whole percent from 1 to 90', () => {
    expect(ALL_PERCENTS.every(isSalePercent)).toBe(true)
    for (const ok of [1, 12, 35, 40, 90]) expect(isSalePercent(ok)).toBe(true)
    for (const bad of [0, 91, 100, 12.5, -1, NaN, '20', null]) expect(isSalePercent(bad)).toBe(false)
  })
})

describe('parseSalePercentInput', () => {
  it.each([
    ['35', 35],
    ['35%', 35],
    [' 35 % ', 35],
    ['1', 1],
    ['90', 90],
    ['07', 7],
  ])('reads %j as %i', (input, percent) => {
    expect(parseSalePercentInput(input)).toEqual({ ok: true, percent })
  })

  it.each([
    ['', 'Enter a discount, like 15 or 35.'],
    ['abc', 'Enter the discount as a number, like 15 or 35.'],
    ['-10', 'Enter the discount as a number, like 15 or 35.'],
    ['12.5', 'Use a whole number, like 15 or 35.'],
    ['0', 'Enter a discount from 1% to 90%.'],
    ['95', 'Enter a discount from 1% to 90%.'],
  ])('refuses %j', (input, error) => {
    expect(parseSalePercentInput(input)).toEqual({ ok: false, error })
  })
})

describe('parsePriceInput', () => {
  it.each([
    ['45', 4500],
    ['$45', 4500],
    ['$ 45', 4500],
    [' 45.5 ', 4550],
    ['45.05', 4505],
    ['1,250', 125000],
    ['1,250.00', 125000],
    ['12,500,000', null], // over the maximum, handled below
    ['45,50', 4550], // decimal comma from some phone keyboards
    ['4,5', 450],
    ['0', 0],
    ['1000000', MAX_PRICE_CENTS],
  ])('%j', (input, cents) => {
    const r = parsePriceInput(input)
    if (cents === null) expect(r.ok).toBe(false)
    else expect(r).toEqual({ ok: true, cents })
  })

  it.each(['', 'abc', '-5', '4.555', '45.', '$', '1e3', '1,2,3', '12,34,567', '1,2345', '.5'])('rejects %j', (input) => {
    expect(parsePriceInput(input).ok).toBe(false)
  })

  it('rejects anything over the database maximum with a field error, never a server error', () => {
    for (const input of ['1000000.01', '4500000', '99999999']) {
      const r = parsePriceInput(input)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toMatch(/too high/)
    }
  })
})

describe('formatPrice', () => {
  it.each([
    [4500, '$45'],
    [125000, '$1,250'],
    [4550, '$45.50'],
    [10150, '$101.50'],
    [5, '$0.05'],
    [0, '$0'],
  ])('%i -> %s', (cents, text) => expect(formatPrice(cents)).toBe(text))
})
