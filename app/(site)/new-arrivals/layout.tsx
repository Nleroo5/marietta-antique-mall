import type { Metadata } from 'next'
import { BUSINESS_NAME } from '@/lib/constants'

/**
 * Shopper pages for the Live Booth Map (SPEC section 8). Hidden until the owner
 * launches it: not in the menu, not in the sitemap, and not indexed by search
 * engines. Ads can still send people here.
 *
 * Share previews (Facebook, iMessage) describe these pages, not the homepage.
 */
const TITLE = `New Arrivals at ${BUSINESS_NAME}`
const DESCRIPTION = 'New finds from the vendors at Marietta Antique Mall, posted the moment they hit the booth.'

export const metadata: Metadata = {
  title: { default: 'New Arrivals', template: `%s | New Arrivals | ${BUSINESS_NAME}` },
  description: DESCRIPTION,
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  openGraph: {
    type: 'website',
    siteName: BUSINESS_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: '/new-arrivals',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/og-image.png'] },
}

export default function NewArrivalsLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-champagne/40">{children}</div>
}
