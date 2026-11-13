import { describe, expect, it } from 'vitest'
import { formatPrice, isSalePercent, MAX_PRICE_CENTS, parsePriceInput, salePriceCents, SALE_PERCENTS } from '@/lib/booth-map/pricing'

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
  ])('%i cents at %i%% -> %i', (price, pct, expected) => {
    expect(salePriceCents(price, pct as 10)).toBe(expected)
  })

  it('matches exact arithmetic for every percent across a wide price range', () => {
    for (const p of SALE_PERCENTS) {
      for (let cents = 0; cents <= 50_000; cents += 7) {
        const exact = (cents * (100 - p)) / 100
        expect(salePriceCents(cents, p)).toBe(Math.floor(exact + 0.5))
      }
    }
  })

  it('is always below the original price for anything priced at 10 cents or more', () => {
    for (const p of SALE_PERCENTS) {
      for (let cents = 10; cents <= 20_000; cents += 1) {
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
})

describe('isSalePercent', () => {
  it('accepts only the six allowed values', () => {
    expect(SALE_PERCENTS.every(isSalePercent)).toBe(true)
    for (const bad of [0, 5, 12, 40, 100, '20', null]) expect(isSalePercent(bad)).toBe(false)
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
