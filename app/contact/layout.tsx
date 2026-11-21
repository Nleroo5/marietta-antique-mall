import type { Metadata } from 'next'

// The page is a client component, so its title and description live here.
// Each page needs its own title: Google search results and GA4's page reports both use it.
export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Call, email or visit Marietta Antique Mall at 1477 Roswell Rd, Suite 100, Marietta, GA 30062.',
  alternates: {
    canonical: 'https://www.mariettaantiquemall.com/contact',
  },
  openGraph: {
    title: 'Contact Us | Marietta Antique Mall',
    description: 'Call, email or visit Marietta Antique Mall at 1477 Roswell Rd, Suite 100, Marietta, GA 30062.',
    url: 'https://www.mariettaantiquemall.com/contact',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
