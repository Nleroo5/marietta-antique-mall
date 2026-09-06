'use client'

import { useEffect, useState } from 'react'

/**
 * Sitewide bar promoting the 2026 Atlanta's Best Awards vote.
 *
 * Marietta Antique Mall is a nominee for Best Antique Store. Voting runs
 * 1-17 September 2026, and Atlanta's Best brand guidelines require vote-for-us
 * promotion to come down once the window closes, so this self-expires.
 *
 * Their logo is not licensed for stand-alone use and no nominee badge exists
 * (badges go to finalists and winners only), so this is deliberately
 * typographic and uses only the Atlanta's Best(TM) name.
 */

export const VOTE_URL = 'https://atlantasbest.com/vote/'

const VOTING_OPENS = '2026-09-01'
const VOTING_CLOSES = '2026-09-17'
const DISMISS_KEY = 'mam-atlantas-best-2026-dismissed'
const MS_PER_DAY = 86_400_000

/**
 * The contest runs on Atlanta time, so the window is evaluated against the
 * calendar date in America/New_York rather than the visitor's own timezone or
 * UTC. Comparing ISO date strings sidesteps daylight-saving offset maths
 * entirely: '2026-09-05' <= '2026-09-17' is true regardless of where the
 * visitor is.
 */
export function easternDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function getVoteBarState(etDate: string): { visible: boolean; daysLeft: number } {
  const visible = etDate >= VOTING_OPENS && etDate <= VOTING_CLOSES
  const daysLeft = Math.round((Date.parse(VOTING_CLOSES) - Date.parse(etDate)) / MS_PER_DAY)
  return { visible, daysLeft }
}

export default function AwardVoteBar() {
  // Rendered only after mount: the visible window depends on the current date,
  // which would otherwise differ between the server render and the client.
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

  const handleVoteClick = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'award_vote_click', {
        event_category: "Atlanta's Best 2026",
        event_label: 'Sitewide bar',
      })
    }
  }

  if (!mounted || dismissed) return null

  const { visible, daysLeft } = getVoteBarState(easternDate())
  if (!visible) return null

  const urgency =
    daysLeft <= 0 ? 'Last day to vote' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`

  return (
    <aside
      aria-label="Atlanta's Best Awards voting"
      className="relative bg-charcoal text-white"
    >
      <div className="container-custom py-2.5 pr-9 sm:pr-10">
        <div className="flex flex-col items-center justify-center gap-x-3 gap-y-1 text-center sm:flex-row sm:text-left">
          <p className="text-sm leading-snug">
            <span className="font-semibold text-mauve">We&rsquo;re nominated for Atlanta&rsquo;s Best&trade; Antique Store.</span>{' '}
            <span className="text-white/85">Voting closes September 17 &mdash; one vote per person.</span>
          </p>

          <div className="flex shrink-0 items-center gap-3">
            <a
              href={VOTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleVoteClick}
              className="rounded-full bg-mauve px-4 py-1.5 text-sm font-bold text-charcoal transition-colors hover:bg-mauve-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
            >
              Vote for us &rarr;
            </a>
            <span className="hidden text-xs font-medium uppercase tracking-wide text-white/70 sm:inline">
              {urgency}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss voting announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-white/60 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </aside>
  )
}
