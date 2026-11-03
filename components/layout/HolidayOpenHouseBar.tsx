'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  HOLIDAY_OPEN_HOUSE_ANCHOR,
  getHolidayOpenHouseState,
  holidayOpenHouseCountdown,
  trackHolidayOpenHouseClick,
} from '@/lib/holiday-open-house'

/**
 * Sitewide bar for the 14 November 2026 Holiday Open House. Links to the
 * homepage section and comes down on its own from 15 November (Atlanta time).
 */

const DISMISS_KEY = 'mam-holiday-open-house-2026-dismissed'

export default function HolidayOpenHouseBar() {
  // Rendered only after mount: whether it shows depends on today's date and on
  // localStorage, neither of which the server render can know.
  const [mounted, setMounted] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === '1')
    } catch {
      // Private browsing or blocked storage - show the bar rather than fail.
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    try {
      window.localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Non-fatal: the bar closes for this pageview even if we cannot persist it.
    }
  }

  if (!mounted || dismissed) return null

  const { visible, daysLeft } = getHolidayOpenHouseState()
  if (!visible) return null

  const isToday = daysLeft <= 0

  return (
    <aside aria-label="Holiday Open House" className="relative bg-[#1f3a24] text-[#fbf1e1]">
      <div className="container-custom py-2.5 pr-9 sm:pr-10">
        <div className="flex flex-col items-center justify-center gap-x-3 gap-y-1.5 text-center sm:flex-row sm:text-left">
          <p className="text-sm leading-snug">
            <span className="font-semibold text-mauve">
              {isToday ? 'Holiday Open House is today!' : <>Holiday Open House, Saturday Nov&nbsp;14.</>}
            </span>{' '}
            <span className="text-white/85">10&ndash;50% off at every vendor, plus pet photos with Santa.</span>
          </p>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href={`/#${HOLIDAY_OPEN_HOUSE_ANCHOR}`}
              onClick={() => trackHolidayOpenHouseClick('Sitewide bar')}
              className="rounded-full bg-[#fbf1e1] px-4 py-1.5 text-sm font-bold text-[#1f3a24] transition-colors hover:bg-mauve focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f3a24]"
            >
              See details &rarr;
            </Link>
            <span className="hidden text-xs font-medium uppercase tracking-wide text-white/70 sm:inline">
              {holidayOpenHouseCountdown(daysLeft)}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss Holiday Open House announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-white/60 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </aside>
  )
}
