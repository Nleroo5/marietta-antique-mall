import type { Metadata } from 'next'

// The page is a client component, so its title and description live here.
// Each page needs its own title: Google search results and GA4's page reports both use it.
export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms for using the Marietta Antique Mall website.',
  alternates: {
    canonical: 'https://www.mariettaantiquemall.com/terms',
  },
  openGraph: {
    title: 'Terms of Service | Marietta Antique Mall',
    description: 'The terms for using the Marietta Antique Mall website.',
    url: 'https://www.mariettaantiquemall.com/terms',
  },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
