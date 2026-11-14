import type { Metadata } from 'next'

/**
 * Shopper pages for the Live Booth Map (SPEC section 8). Hidden until the owner
 * launches it: not in the menu, not in the sitemap, and not indexed by search
 * engines. Ads can still send people here.
 */
export const metadata: Metadata = {
  title: { default: 'New Arrivals', template: '%s | New Arrivals' },
  description: 'New finds from the vendors at Marietta Antique Mall, posted the moment they hit the booth.',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

export default function NewArrivalsLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-champagne/40">{children}</div>
}
