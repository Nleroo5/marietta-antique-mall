import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sell or Donate an Item',
  description:
    'Have an antique, collectible, or vintage piece to sell or donate? Send it to Marietta Antique Mall in a few quick steps — free, no obligation. We typically respond within 24 hours.',
  alternates: {
    canonical: 'https://www.mariettaantiquemall.com/sell',
  },
  openGraph: {
    title: 'Sell or Donate an Item | Marietta Antique Mall',
    description:
      'Send us an antique, collectible, or vintage piece to sell or donate. Free, no obligation.',
    url: 'https://www.mariettaantiquemall.com/sell',
  },
}

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children
}
