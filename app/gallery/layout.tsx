import type { Metadata } from 'next'

// The page is a client component, so its title and description live here.
// Each page needs its own title: Google search results and GA4's page reports both use it.
export const metadata: Metadata = {
  title: 'Gallery',
  description:
    'Photos of the antiques, vintage finds and booths inside Marietta Antique Mall in Marietta, GA.',
  alternates: {
    canonical: 'https://www.mariettaantiquemall.com/gallery',
  },
  openGraph: {
    title: 'Gallery | Marietta Antique Mall',
    description: 'Photos of the antiques, vintage finds and booths inside Marietta Antique Mall in Marietta, GA.',
    url: 'https://www.mariettaantiquemall.com/gallery',
  },
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children
}
