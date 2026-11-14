import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { BUSINESS_NAME, LOCATION, SEO_KEYWORDS, GOOGLE_MAPS_URL } from '@/lib/constants'

// Fonts are stored in app/fonts instead of downloaded from Google at build time,
// which failed intermittently and broke builds (see app/fonts/README.md). Same
// families, weights, Latin subset and CSS variables as before.
const creteRound = localFont({
  src: './fonts/crete-round-latin-400-normal.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-display',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
})

const inter = localFont({
  src: './fonts/inter-latin-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-body',
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
})

const montserrat = localFont({
  src: './fonts/montserrat-latin-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-nav',
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
})

export const metadata: Metadata = {
  title: {
    default: `${BUSINESS_NAME} | 30,000 sq ft of Antiques & Vintage Treasures`,
    template: `%s | ${BUSINESS_NAME}`,
  },
  description:
    'Discover unique antiques, vintage items, and collectibles from 100+ vendors. Located near the Big Chicken in Marietta, GA. Follow us on Facebook for upcoming events and new arrivals!',
  keywords: SEO_KEYWORDS,
  authors: [
    { name: BUSINESS_NAME },
    { name: 'Drive Lead Media', url: 'https://www.driveleadmedia.com/' }
  ],
  creator: 'Drive Lead Media - Atlanta Web Design & Digital Marketing Agency',
  publisher: BUSINESS_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.mariettaantiquemall.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.mariettaantiquemall.com',
    siteName: BUSINESS_NAME,
    title: `${BUSINESS_NAME} | 30,000 sq ft of Antiques & Vintage Treasures`,
    description:
      'Discover unique antiques, vintage items, and collectibles from 100+ vendors in Marietta, GA.',
    images: [
      {
        url: 'https://www.mariettaantiquemall.com/og-image.png',
        width: 1200,
        height: 630,
        alt: `${BUSINESS_NAME} - Antiques & Vintage`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BUSINESS_NAME} | 30,000 sq ft of Antiques & Vintage Treasures`,
    description: 'Discover unique antiques from 100+ vendors in Marietta, GA.',
    images: ['https://www.mariettaantiquemall.com/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '500x500', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '500x500', type: 'image/png' },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'hQcFLXByL3Hm1BwiUvV5u3wV849mFJNyMmckusQ2Psw',
    // Add other verification codes as needed
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`scroll-smooth ${creteRound.variable} ${inter.variable} ${montserrat.variable}`}>
      {/*
        Website Designed & Developed by Drive Lead Media
        Professional Web Design & Digital Marketing Agency
        Atlanta, GA | https://www.driveleadmedia.com/

        Services: Custom Web Design, SEO, Lead Generation, Digital Marketing
        Specializing in conversion-focused websites for local businesses

        Contact Drive Lead Media for your web design and marketing needs:
        - Custom Website Design & Development
        - Search Engine Optimization (SEO)
        - Local Business Marketing
        - Lead Generation & Conversion Optimization
        - E-commerce Solutions
        - Brand Identity & Strategy

        © Drive Lead Media - All Rights Reserved
      */}
      <head>
        {/*
          Trackers (Meta Pixel, GA4, Clarity), their resource hints, and the site
          header and footer live in components/layout/SiteShell.tsx, used by
          app/(site)/layout.tsx and app/not-found.tsx. Booth map vendor and admin
          pages sit outside (site) and load none of them.
        */}

        {/* Enhanced Business Structured Data - Local SEO Optimized */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'AntiqueStore',
              '@id': 'https://www.mariettaantiquemall.com/#business',
              name: BUSINESS_NAME,
              alternateName: 'MAM - Marietta Antique Mall',
              description: 'Premier antique mall in Marietta, Georgia featuring 30,000 sq ft of curated antiques, vintage furniture, collectibles, and unique treasures from 100+ independent vendors. Located near the Big Chicken landmark.',
              image: [
                'https://www.mariettaantiquemall.com/og-image.png',
                'https://www.mariettaantiquemall.com/images/vendors/marietta-antique-mall-vintage-furniture-display-05.jpg',
                'https://www.mariettaantiquemall.com/images/vendors/marietta-antique-mall-vintage-store-interior-01.jpg',
              ],
              url: 'https://www.mariettaantiquemall.com',
              telephone: '(770) 973-5600',
              email: 'info@mariettaantiquemall.com',
              priceRange: '$$',
              address: {
                '@type': 'PostalAddress',
                streetAddress: LOCATION.address,
                addressLocality: LOCATION.city,
                addressRegion: LOCATION.state,
                postalCode: LOCATION.zip,
                addressCountry: 'US',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: LOCATION.lat,
                longitude: LOCATION.lng,
              },
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                  opens: '10:00',
                  closes: '18:00',
                },
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Friday', 'Saturday'],
                  opens: '10:00',
                  closes: '19:00',
                },
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: 'Sunday',
                  opens: '12:00',
                  closes: '18:00',
                },
              ],
              sameAs: [
                'https://www.facebook.com/Mariettaantiquemall/',
                'https://www.instagram.com/mariettaantiquemall/',
                GOOGLE_MAPS_URL,
              ],
              hasMap: GOOGLE_MAPS_URL,
              areaServed: [
                {
                  '@type': 'City',
                  name: 'Marietta',
                  '@id': 'https://en.wikipedia.org/wiki/Marietta,_Georgia',
                },
                {
                  '@type': 'City',
                  name: 'Atlanta',
                },
                {
                  '@type': 'Place',
                  name: 'Cobb County',
                },
                {
                  '@type': 'Place',
                  name: 'East Cobb',
                },
              ],
              paymentAccepted: 'Cash, Credit Card, Debit Card',
              currenciesAccepted: 'USD',
              keywords: 'antique mall, vintage furniture, collectibles, antique store, mid-century modern, vintage jewelry, estate sales, consignment, antique dealers, Marietta antiques, Big Chicken area',
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.5',
                reviewCount: '100',
              },
              amenityFeature: [
                {
                  '@type': 'LocationFeatureSpecification',
                  name: 'Wheelchair Accessible',
                  value: true,
                },
                {
                  '@type': 'LocationFeatureSpecification',
                  name: 'Shopping Carts Available',
                  value: true,
                },
                {
                  '@type': 'LocationFeatureSpecification',
                  name: 'Wide Aisles',
                  value: true,
                },
                {
                  '@type': 'LocationFeatureSpecification',
                  name: 'Free Parking',
                  value: true,
                },
              ],
              knowsAbout: [
                'Antique Furniture',
                'Vintage Collectibles',
                'Mid-Century Modern',
                'Estate Sales',
                'Vintage Jewelry',
                'Antique Restoration',
                'Collectible Trading',
              ],
            }),
          }}
        />

        {/* Website Creator - Drive Lead Media Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              '@id': 'https://www.mariettaantiquemall.com/#website',
              url: 'https://www.mariettaantiquemall.com',
              name: BUSINESS_NAME,
              description: 'Discover unique antiques, vintage items, and collectibles from 100+ vendors in Marietta, GA',
              publisher: {
                '@id': 'https://www.mariettaantiquemall.com/#organization',
              },
              creator: {
                '@type': 'Organization',
                '@id': 'https://www.driveleadmedia.com/#organization',
                name: 'Drive Lead Media',
                url: 'https://www.driveleadmedia.com/',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://www.driveleadmedia.com/logo.png',
                },
                sameAs: [
                  'https://www.facebook.com/driveleadmedia',
                  'https://www.linkedin.com/company/drive-lead-media',
                ],
                description: 'Professional Web Design & Digital Marketing Agency specializing in lead generation, SEO, and conversion optimization for businesses in Atlanta and beyond',
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: 'Atlanta',
                  addressRegion: 'GA',
                  addressCountry: 'US',
                },
                areaServed: [
                  {
                    '@type': 'City',
                    name: 'Atlanta',
                  },
                  {
                    '@type': 'City',
                    name: 'Marietta',
                  },
                  {
                    '@type': 'State',
                    name: 'Georgia',
                  },
                ],
                knowsAbout: [
                  'Web Design',
                  'Digital Marketing',
                  'SEO',
                  'Lead Generation',
                  'Conversion Optimization',
                  'Local Business Marketing',
                ],
              },
            }),
          }}
        />

        {/* WebPage Schema with Drive Lead Media Attribution */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              '@id': 'https://www.mariettaantiquemall.com/#webpage',
              url: 'https://www.mariettaantiquemall.com',
              name: `${BUSINESS_NAME} | 30,000 sq ft of Antiques & Vintage Treasures`,
              isPartOf: {
                '@id': 'https://www.mariettaantiquemall.com/#website',
              },
              about: {
                '@id': 'https://www.mariettaantiquemall.com/#organization',
              },
              provider: {
                '@type': 'Organization',
                name: 'Drive Lead Media',
                url: 'https://www.driveleadmedia.com/',
                description: 'Atlanta Web Design & Digital Marketing Agency',
              },
              creator: {
                '@type': 'Organization',
                name: 'Drive Lead Media',
                url: 'https://www.driveleadmedia.com/',
              },
            }),
          }}
        />

        {/* Service Relationship Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Service',
              serviceType: 'Web Design & Development',
              provider: {
                '@type': 'Organization',
                '@id': 'https://www.driveleadmedia.com/#organization',
                name: 'Drive Lead Media',
                url: 'https://www.driveleadmedia.com/',
                telephone: '+1-XXX-XXX-XXXX',
                email: 'info@driveleadmedia.com',
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: 'Atlanta',
                  addressRegion: 'GA',
                  addressCountry: 'US',
                },
              },
              serviceOutput: {
                '@type': 'WebSite',
                url: 'https://www.mariettaantiquemall.com',
                name: BUSINESS_NAME,
              },
              areaServed: {
                '@type': 'State',
                name: 'Georgia',
              },
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Web Design & Marketing Services',
                itemListElement: [
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Custom Web Design',
                      description: 'Professional website design and development for local businesses',
                    },
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'SEO Services',
                      description: 'Search engine optimization for improved online visibility',
                    },
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Digital Marketing',
                      description: 'Comprehensive digital marketing strategies for lead generation',
                    },
                  },
                ],
              },
            }),
          }}
        />

      </head>
      <body className={`${creteRound.variable} ${inter.variable} ${montserrat.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
