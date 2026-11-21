'use client'

import { useEffect } from 'react'
import { isMapsUrl, linkLocationFor, trackDirections, trackEmailTap, trackPhoneTap } from '@/lib/analytics'

/**
 * One listener for the whole site: every tap on a phone number, email address or map
 * link is sent to GA4, wherever the link is and whenever it's added, with
 * `link_location` saying where it was (header, footer, visit_page and so on).
 *
 * Buttons that open the phone or a map from code (not plain links) call the
 * trackers in lib/analytics.ts themselves.
 */
export default function LinkTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      const link = target?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!link) return
      const href = link.getAttribute('href') || ''
      const where = linkLocationFor(link, window.location.pathname)
      if (href.startsWith('tel:')) trackPhoneTap(where)
      else if (href.startsWith('mailto:')) trackEmailTap(where)
      else if (isMapsUrl(link.href, window.location.href)) trackDirections(where)
    }
    // Capture phase, so the event is sent before the link navigates away.
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}
