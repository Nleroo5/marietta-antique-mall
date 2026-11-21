/**
 * Google Analytics 4 helpers.
 *
 * The tag itself is loaded once in app/layout.tsx. Everything here is safe to call
 * anywhere: on a server render, or when analytics is switched off (local builds and
 * Vercel previews), `track` does nothing.
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-8LTQL1YW44'

/**
 * Trackers run on the live site only, so tests and previews never reach the reports.
 * NEXT_PUBLIC_ANALYTICS_FORCE=1 turns GA on elsewhere for checking the tag; use it
 * with a throwaway NEXT_PUBLIC_GA_MEASUREMENT_ID so test hits never land in the
 * mall's property.
 */
export const ANALYTICS_ENABLED =
  process.env.VERCEL_ENV === 'production' || process.env.NEXT_PUBLIC_ANALYTICS_FORCE === '1'

/** Meta Pixel and Clarity: live site only, never forced on. */
export const MARKETING_PIXELS_ENABLED = process.env.VERCEL_ENV === 'production'

type EventParams = Record<string, string | number | boolean | undefined>

export function track(event: string, params: EventParams = {}): void {
  if (typeof window === 'undefined') return
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag === 'function') gtag('event', event, params)
}

/** Someone tapped a phone number. Kept as GA4 `contact` so past reports still line up. */
export const trackPhoneTap = (linkLocation: string) =>
  track('contact', { method: 'phone', link_location: linkLocation })

/** Someone tapped an email address. */
export const trackEmailTap = (linkLocation: string) =>
  track('contact', { method: 'email', link_location: linkLocation })

/** Someone opened directions or the map to the mall. */
export const trackDirections = (linkLocation: string) =>
  track('get_directions', { link_location: linkLocation })

/** True for Google Maps, Apple Maps and short map links; false for embeds and anything else. */
export function isMapsUrl(href: string, base?: string): boolean {
  let url: URL
  try {
    url = new URL(href, base ?? 'https://www.mariettaantiquemall.com')
  } catch {
    return false
  }
  const host = url.hostname.toLowerCase()
  if (url.pathname.includes('/embed')) return false
  if (host === 'maps.apple.com' || host === 'maps.app.goo.gl') return true
  if (host === 'goo.gl' && url.pathname.startsWith('/maps')) return true
  const isGoogle = /(^|\.)google\.[a-z.]+$/.test(host)
  return isGoogle && (host.startsWith('maps.') || url.pathname.startsWith('/maps'))
}

/**
 * Where on the site a link sits, for the `link_location` parameter: the nearest
 * data-analytics-location wrapper, else the header or footer, else the page
 * ("home_page", "visit_page" and so on).
 */
export function linkLocationFor(el: Element, pathname: string): string {
  const tagged = el.closest('[data-analytics-location]')
  if (tagged) return tagged.getAttribute('data-analytics-location') || 'unknown'
  if (el.closest('header')) return 'header'
  if (el.closest('footer')) return 'footer'
  const page = pathname.replace(/^\/+|\/+$/g, '').split('/')[0]
  return `${page || 'home'}_page`
}
