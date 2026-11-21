import type { Metadata } from 'next'

// The page is a client component, so its title and description live here.
// Each page needs its own title: Google search results and GA4's page reports both use it.
export const metadata: Metadata = {
  title: 'Become a Vendor: Rent a Booth',
  description:
    'Rent a booth at Marietta Antique Mall in Marietta, GA: 30,000 sq ft and 100+ vendors. Apply online in a few minutes.',
  alternates: {
    canonical: 'https://www.mariettaantiquemall.com/vendors',
  },
  openGraph: {
    title: 'Become a Vendor: Rent a Booth | Marietta Antique Mall',
    description: 'Rent a booth at Marietta Antique Mall in Marietta, GA: 30,000 sq ft and 100+ vendors. Apply online in a few minutes.',
    url: 'https://www.mariettaantiquemall.com/vendors',
  },
}

export default function VendorsLayout({ children }: { children: React.ReactNode }) {
  return children
}
