'use client'

import { useEffect, useState } from 'react'

/**
 * "35 min ago". Pages are cached, so the server renders a fixed date and the browser
 * swaps in the live relative time after it loads. Both renders agree on first paint,
 * so there is no hydration mismatch.
 */
function dateLabel(iso: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }).format(new Date(iso))
}

/** Calendar day in the mall's time zone, as a number of days since 1970. */
function etDay(ms: number): number {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms))
  return Math.round(Date.parse(`${ymd}T00:00:00Z`) / 86_400_000)
}

export function relativeLabel(iso: string, now: number): string {
  const then = new Date(iso).getTime()
  const mins = Math.max(0, Math.round((now - then) / 60_000))
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const days = etDay(now) - etDay(then) // calendar days, so "Yesterday" means yesterday
  if (days <= 0 || mins < 6 * 60) {
    const hrs = Math.round(mins / 60)
    return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'} ago`
  }
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return dateLabel(iso)
}

export default function TimeAgo({ iso, prefix = '' }: { iso: string; prefix?: string }) {
  const [text, setText] = useState(() => dateLabel(iso))
  useEffect(() => {
    const update = () => setText(relativeLabel(iso, Date.now()))
    update()
    const t = setInterval(update, 60_000)
    return () => clearInterval(t)
  }, [iso])
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {prefix}
      {text}
    </time>
  )
}

/** "JUST IN" for anything that went live in the last 24 hours (shown after load, so cached pages stay right). */
export function JustIn({ iso }: { iso: string }) {
  const [fresh, setFresh] = useState(false)
  useEffect(() => setFresh(Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000), [iso])
  if (!fresh) return null
  return (
    <span className="absolute right-2 top-2 rounded-md bg-mint px-2 py-1 text-[11px] font-bold tracking-wide text-[#2C2416]">JUST IN</span>
  )
}
