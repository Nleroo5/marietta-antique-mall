import type { Metadata } from 'next'

// The page is a client component, so its title and description live here.
// Each page needs its own title: Google search results and GA4's page reports both use it.
export const metadata: Metadata = {
  title: 'Plan Your Visit: Hours & Directions',
  description:
    'Hours, directions and what to expect at Marietta Antique Mall: 30,000 sq ft of antiques and vintage from 100+ vendors at 1477 Roswell Rd in Marietta, GA.',
  alternates: {
    canonical: 'https://www.mariettaantiquemall.com/visit',
  },
  openGraph: {
    title: 'Plan Your Visit: Hours & Directions | Marietta Antique Mall',
    description: 'Hours, directions and what to expect at Marietta Antique Mall: 30,000 sq ft of antiques and vintage from 100+ vendors at 1477 Roswell Rd in Marietta, GA.',
    url: 'https://www.mariettaantiquemall.com/visit',
  },
}

export default function VisitLayout({ children }: { children: React.ReactNode }) {
  return children
}
