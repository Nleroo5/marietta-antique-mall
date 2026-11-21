import type { Metadata } from 'next'

// The page is a client component, so its title and description live here.
// Each page needs its own title: Google search results and GA4's page reports both use it.
export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Marietta Antique Mall collects and uses information on this website.',
  alternates: {
    canonical: 'https://www.mariettaantiquemall.com/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | Marietta Antique Mall',
    description: 'How Marietta Antique Mall collects and uses information on this website.',
    url: 'https://www.mariettaantiquemall.com/privacy',
  },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
