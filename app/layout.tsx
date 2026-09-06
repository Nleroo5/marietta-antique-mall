import type { Metadata } from 'next'
import Script from 'next/script'
import { Crete_Round, Inter, Montserrat } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import AwardVoteBar from '@/components/layout/AwardVoteBar'
import Footer from '@/components/layout/Footer'
import { BUSINESS_NAME, LOCATION, SEO_KEYWORDS, GOOGLE_MAPS_URL } from '@/lib/constants'

const creteRound = Crete_Round({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-nav',
  display: 'swap',
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
        {/* Google Analytics 4 */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* Resource Hints for External Domains */}
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="preconnect" href="https://scontent.facebook.com" />
        <link rel="dns-prefetch" href="https://scontent.facebook.com" />
        <link rel="preconnect" href="https://scontent.xx.fbcdn.net" />
        <link rel="dns-prefetch" href="https://scontent.xx.fbcdn.net" />
        <link rel="preconnect" href="https://maps.google.com" />
        <link rel="dns-prefetch" href="https://maps.google.com" />
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://www.google.com" />
        <link rel="dns-prefetch" href="https://www.google.com" />

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

        {/* Meta Pixel Code - Inline for immediate execution */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '852163140862887');
              fbq('track', 'PageView');
            `,
          }}
        />
      </head>
      <body className={`${creteRound.variable} ${inter.variable} ${montserrat.variable} antialiased`}>
        {/* Google Analytics 4 - gtag.js */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-8LTQL1YW44"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8LTQL1YW44');
          `}
        </Script>

        {/* Microsoft Clarity - Session recording & heatmaps */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "uxxqhkqoqk");
          `}
        </Script>

        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=852163140862887&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

        <AwardVoteBar />
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
