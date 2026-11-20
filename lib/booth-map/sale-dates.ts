import { MAX_SALE_DAYS } from './pricing'

/**
 * Booth sale end dates (SPEC section 5b). The vendor picks the exact last day of the
 * sale on a calendar. The sale runs through the end of that day in the mall's own time
 * zone, so ends_at is midnight at the start of the next day, Eastern time.
 *
 * Everything here works in the mall's time zone on purpose. The server runs on UTC, so
 * "end of the day" computed in server time would end an Eastern sale at 7 or 8 pm the
 * evening before.
 */
export const MALL_TIME_ZONE = 'America/New_York'
export const DEFAULT_SALE_DAYS = 7

const DAY_MS = 24 * 60 * 60 * 1000
const YMD = /^(\d{4})-(\d{2})-(\d{2})$/

/** Year, month and day of `date` on the mall's calendar. */
function mallParts(date: Date): { y: number; m: number; d: number; h: number; min: number; s: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MALL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return { y: get('year'), m: get('month'), d: get('day'), h: get('hour'), min: get('minute'), s: get('second') }
}

const pad = (n: number) => String(n).padStart(2, '0')
const toYmd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`

/** Today's date on the mall's calendar, as YYYY-MM-DD. */
export function mallToday(now: Date = new Date()): string {
  const p = mallParts(now)
  return toYmd(p.y, p.m, p.d)
}

/** Calendar arithmetic on YYYY-MM-DD strings (no time zone involved). */
export function addCalendarDays(ymd: string, days: number): string {
  const m = YMD.exec(ymd)
  if (!m) throw new RangeError(`Expected YYYY-MM-DD, got ${ymd}`)
  const t = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]) + days * DAY_MS)
  return toYmd(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate())
}

/** True when the string is a real calendar date (rejects 2026-02-30). */
function isRealDate(ymd: string): boolean {
  const m = YMD.exec(ymd)
  if (!m) return false
  const t = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return t.getUTCFullYear() === +m[1] && t.getUTCMonth() === +m[2] - 1 && t.getUTCDate() === +m[3]
}

/** The UTC instant of midnight starting `ymd` in the mall's time zone (handles daylight saving). */
export function mallMidnight(ymd: string): Date {
  const m = YMD.exec(ymd)
  if (!m) throw new RangeError(`Expected YYYY-MM-DD, got ${ymd}`)
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3])
  // Guess with the offset at that wall time, then correct once for a daylight-saving change.
  let guess = wall
  for (let i = 0; i < 2; i++) {
    const p = mallParts(new Date(guess))
    const shownAsUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s)
    guess += wall - shownAsUtc
  }
  return new Date(guess)
}

/** What the date picker allows: today through today + 30 days, defaulting to a week out. */
export function saleDateRange(now: Date = new Date()): { min: string; max: string; suggested: string } {
  const today = mallToday(now)
  return { min: today, max: addCalendarDays(today, MAX_SALE_DAYS), suggested: addCalendarDays(today, DEFAULT_SALE_DAYS) }
}

export type SaleEnd = { ok: true; lastDay: string; endsAt: Date } | { ok: false; error: string }

/**
 * Checks the last day a vendor picked and returns when the sale ends: midnight after
 * that day, mall time. Today is allowed (a one-day sale ends tonight at midnight).
 */
export function saleEndsAt(lastDay: string, now: Date = new Date()): SaleEnd {
  const day = typeof lastDay === 'string' ? lastDay.trim() : ''
  if (!isRealDate(day)) return { ok: false, error: 'Pick the last day of your sale.' }
  const { min, max } = saleDateRange(now)
  if (day < min) return { ok: false, error: 'That day has already passed. Pick today or a later day.' }
  if (day > max) return { ok: false, error: `A sale can run up to ${MAX_SALE_DAYS} days. Pick an earlier day.` }
  return { ok: true, lastDay: day, endsAt: mallMidnight(addCalendarDays(day, 1)) }
}

/** The sale's last day for shoppers and vendors, e.g. "Sat, Nov 28". */
export function formatSaleLastDay(endsAt: Date): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: MALL_TIME_ZONE, weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(endsAt.getTime() - 1))
}
