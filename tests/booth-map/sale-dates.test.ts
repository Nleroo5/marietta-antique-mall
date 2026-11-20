import { describe, expect, it } from 'vitest'
import { MAX_SALE_DAYS } from '@/lib/booth-map/pricing'
import { addCalendarDays, formatSaleLastDay, mallMidnight, mallToday, saleDateRange, saleEndsAt } from '@/lib/booth-map/sale-dates'

// 2026-11-20 10:00 Eastern (EST, UTC-5)
const NOW = new Date('2026-11-20T15:00:00Z')

describe('mall calendar', () => {
  it('uses the Eastern date, not the server UTC date', () => {
    // 11 pm Eastern on Nov 19 is already Nov 20 in UTC.
    expect(mallToday(new Date('2026-11-20T04:00:00Z'))).toBe('2026-11-19')
    expect(mallToday(NOW)).toBe('2026-11-20')
  })

  it('adds calendar days across months and years', () => {
    expect(addCalendarDays('2026-11-20', 11)).toBe('2026-12-01')
    expect(addCalendarDays('2026-12-25', 10)).toBe('2027-01-04')
    expect(addCalendarDays('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('finds Eastern midnight in winter and summer time', () => {
    expect(mallMidnight('2026-11-29').toISOString()).toBe('2026-11-29T05:00:00.000Z') // EST
    expect(mallMidnight('2026-07-04').toISOString()).toBe('2026-07-04T04:00:00.000Z') // EDT
  })

  it('handles the daylight-saving switch days', () => {
    // Clocks spring forward at 2 am on Mar 8 2026 and fall back at 2 am on Nov 1 2026.
    expect(mallMidnight('2026-03-08').toISOString()).toBe('2026-03-08T05:00:00.000Z')
    expect(mallMidnight('2026-03-09').toISOString()).toBe('2026-03-09T04:00:00.000Z')
    expect(mallMidnight('2026-11-01').toISOString()).toBe('2026-11-01T04:00:00.000Z')
    expect(mallMidnight('2026-11-02').toISOString()).toBe('2026-11-02T05:00:00.000Z')
  })
})

describe('saleDateRange', () => {
  it('allows today through 30 days out and suggests a week', () => {
    expect(saleDateRange(NOW)).toEqual({ min: '2026-11-20', max: '2026-12-20', suggested: '2026-11-27' })
  })
})

describe('saleEndsAt', () => {
  it('runs through the end of the picked day, Eastern time', () => {
    const r = saleEndsAt('2026-11-28', NOW)
    expect(r).toEqual({ ok: true, lastDay: '2026-11-28', endsAt: new Date('2026-11-29T05:00:00Z') })
  })

  it('allows a one-day sale that ends tonight', () => {
    const r = saleEndsAt('2026-11-20', NOW)
    expect(r.ok && r.endsAt.toISOString()).toBe('2026-11-21T05:00:00.000Z')
  })

  it('rejects past days, days beyond 30, and non-dates', () => {
    expect(saleEndsAt('2026-11-19', NOW)).toEqual({ ok: false, error: 'That day has already passed. Pick today or a later day.' })
    expect(saleEndsAt('2026-12-21', NOW).ok).toBe(false)
    expect(saleEndsAt('2026-02-30', NOW).ok).toBe(false)
    expect(saleEndsAt('Nov 28', NOW).ok).toBe(false)
    expect(saleEndsAt('', NOW).ok).toBe(false)
  })

  it('accepts the last allowed day and stays inside the database window (30 days + 1 of slack)', () => {
    // Worst case: the sale starts one second after midnight and runs to the 30th day.
    const start = new Date('2026-11-20T05:00:01Z')
    const r = saleEndsAt('2026-12-20', start)
    expect(r.ok).toBe(true)
    if (r.ok) {
      const days = (r.endsAt.getTime() - start.getTime()) / 86_400_000
      expect(days).toBeGreaterThan(MAX_SALE_DAYS)
      expect(days).toBeLessThanOrEqual(MAX_SALE_DAYS + 1)
    }
  })

  it('still fits the window across the spring-forward change', () => {
    const start = new Date('2026-02-20T05:00:01Z') // just after midnight EST
    const r = saleEndsAt(addCalendarDays('2026-02-20', 30), start)
    expect(r.ok).toBe(true)
    if (r.ok) expect((r.endsAt.getTime() - start.getTime()) / 86_400_000).toBeLessThanOrEqual(MAX_SALE_DAYS + 1)
  })
})

describe('formatSaleLastDay', () => {
  it('shows the last day of the sale, not the midnight after it', () => {
    expect(formatSaleLastDay(new Date('2026-11-29T05:00:00Z'))).toBe('Sat, Nov 28')
  })
})
