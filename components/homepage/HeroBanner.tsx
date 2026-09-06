'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import { BUSINESS_NAME, CONTACT_INFO } from '@/lib/constants'

export default function HeroBanner() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleScrollToMarketplace = () => {
    const element = document.querySelector('#facebook-marketplace')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleShopNowClick = () => {
    // Track the click event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'click', {
        event_category: 'Facebook Marketplace',
        event_label: 'Hero Banner CTA',
        value: 1,
      })
    }

    window.location.href = '/shop'
  }

  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .hero-shimmer {
          background: linear-gradient(
            90deg,
            #ffffff 0%,
            #ffffff 40%,
            #efc393 50%,
            #ffffff 60%,
            #ffffff 100%
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
      {/*
        The poster is the hero's LCP element on any connection too slow to
        decode the video promptly. React hoists this into <head>, so the
        browser fetches it at high priority instead of queueing it behind the
        page's other assets. It lives here rather than in the root layout so
        only the homepage pays for it.
      */}
      <link rel="preload" as="image" href="/images/hero-poster.webp" fetchPriority="high" />

      {/* Video Background - Works on all devices */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/images/hero-poster.webp"
        className="absolute inset-0 w-full h-full object-cover"
        onLoadedData={() => setIsVideoLoaded(true)}
      >
        <source src="/videos/drone-optimized.webm" type="video/webm" />
        <source src="/videos/drone-optimized.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-4 pt-40 md:pt-48 lg:pt-56">
        <div className="text-center max-w-4xl mx-auto animate-fade-in">
          <h1 className="hero-shimmer font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 md:mb-6 drop-shadow-2xl">
            Your Next Find Awaits
          </h1>

          <div className="space-y-2 md:space-y-3 mb-16 md:mb-20 lg:mb-24 xl:mb-32">
            <p className="text-xl sm:text-2xl md:text-3xl font-semibold drop-shadow-lg">
              100+ Vendors • 30,000 sq ft • New Arrivals Daily
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center animate-slide-up">
            <Button
              size="lg"
              variant="primary"
              onClick={handleShopNowClick}
              className="px-8 backdrop-blur-sm transition-all hover:scale-105 !border-2 !border-mint !text-white hover:!bg-mint hover:!text-black"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              Shop Online
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => {
                // Track GA4 navigation event
                if (typeof window !== 'undefined' && (window as any).gtag) {
                  (window as any).gtag('event', 'scroll_to_section', {
                    section: 'visit_us',
                    button_location: 'hero',
                    value: 1
                  })
                }

                const element = document.querySelector('#visit-us')
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' })
                }
              }}
              className="px-8 backdrop-blur-sm transition-all hover:scale-105 !text-white hover:!text-black"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Visit Us
            </Button>
          </div>
        </div>
      </div>

      {/* Accessibility: Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus-ring"
      >
        Skip to main content
      </a>
    </section>
  )
}
