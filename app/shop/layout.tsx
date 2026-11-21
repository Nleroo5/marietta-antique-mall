import type { Metadata } from 'next'

// The page is a client component, so its title and description live here.
// Each page needs its own title: Google search results and GA4's page reports both use it.
export const metadata: Metadata = {
  title: 'Shop Online on Facebook Marketplace',
  description:
    'Browse antiques and vintage pieces from Marietta Antique Mall vendors in our Facebook Marketplace group.',
  alternates: {
    canonical: 'https://www.mariettaantiquemall.com/shop',
  },
  openGraph: {
    title: 'Shop Online on Facebook Marketplace | Marietta Antique Mall',
    description: 'Browse antiques and vintage pieces from Marietta Antique Mall vendors in our Facebook Marketplace group.',
    url: 'https://www.mariettaantiquemall.com/shop',
  },
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children
}
