import type { Metadata, Viewport } from 'next'

/**
 * Layout for booth map vendor and admin pages. It sits outside app/(site), so none
 * of the site's trackers, promo bars, header or footer load here (SPEC section 9).
 * The proxy adds noindex, no-referrer and no-store headers to these routes as well.
 */
export const metadata: Metadata = {
  title: 'Vendor page',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  referrer: 'no-referrer',
  openGraph: null,
  twitter: null,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#A5B8C8',
}

export default function BoothLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-champagne text-[#2C2416]">{children}</div>
}
