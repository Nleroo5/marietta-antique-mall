'use client'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import VendorCarousel from '@/components/shop/VendorCarousel'
import { LOCATION } from '@/lib/constants'

export default function ShopPage() {
  const handleVisitGroupClick = () => {
    // Track Google Analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'click', {
        event_category: 'Facebook Marketplace',
        event_label: 'Visit Group Button',
        value: 1,
      })
    }

    // Track Meta Pixel conversion event
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_name: 'MAM Marketplace Group',
        content_category: 'Facebook Group',
        value: 0,
        currency: 'USD'
      })
    }

    window.open('https://www.facebook.com/groups/MAM.Marketplace/', '_blank')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/50">
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .shimmer-text {
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 1) 0%,
            rgba(0, 0, 0, 1) 40%,
            rgba(239, 195, 147, 1) 50%,
            rgba(0, 0, 0, 1) 60%,
            rgba(0, 0, 0, 1) 100%
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
      `}</style>

      {/* Hero Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="shimmer-text font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Shop Our Facebook Marketplace
            </h1>
            <p className="text-base md:text-lg text-black/80 leading-relaxed max-w-3xl mx-auto">
              Browse hundreds of unique antiques, vintage finds, and collectibles from our 100+ vendors. New items added daily!
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-black mb-4">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card hover className="!border-[3px] !border-mauve text-center !p-8 !cursor-default">
              <div className="flex flex-col items-center">
                <h3 className="font-display text-xl font-bold text-black mb-3">
                  Join the Group
                </h3>
                <p className="text-black leading-relaxed">
                  Click the button below to join our MAM Marketplace Facebook Group - it's free and takes just a moment
                </p>
              </div>
            </Card>

            <Card hover className="!border-[3px] !border-mauve text-center !p-8 !cursor-default">
              <div className="flex flex-col items-center">
                <h3 className="font-display text-xl font-bold text-black mb-3">
                  Browse & Message
                </h3>
                <p className="text-black leading-relaxed">
                  See all available items with photos, descriptions, and prices. Message vendors directly with questions
                </p>
              </div>
            </Card>

            <Card hover className="!border-[3px] !border-mauve text-center !p-8 !cursor-default">
              <div className="flex flex-col items-center">
                <h3 className="font-display text-xl font-bold text-black mb-3">
                  Pick Up In-Store
                </h3>
                <p className="text-black leading-relaxed">
                  Visit us at {LOCATION.address} to pick up your treasure or browse even more items in person
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Visit Facebook Group CTA with Gallery Carousel */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Left: MAM Marketplace Card */}
            <Card hover className="!border-[3px] !border-mauve text-center !p-6 md:!p-8 flex flex-col justify-center">
              <div className="mb-6">
                <svg
                  className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-[#1877F2] drop-shadow-[0_0_15px_rgba(24,119,242,0.5)]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <h2 className="font-display text-xl md:text-2xl lg:text-3xl font-bold text-black mb-3">
                  Browse Available Items
                </h2>
                <p className="text-sm md:text-base text-black mb-2 leading-relaxed">
                  Join our <strong>MAM Marketplace</strong> Facebook Group to see all items currently for sale
                </p>
                <p className="text-xs md:text-sm text-black/80 leading-relaxed">
                  Hundreds of antiques, vintage items, and collectibles with photos, descriptions, and prices
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleVisitGroupClick}
                  className="w-full sm:w-auto sm:min-w-[280px] !bg-transparent !text-[#1877F2] !border-2 !border-[#1877F2] shadow-[0_0_15px_rgba(24,119,242,0.3)] hover:!bg-[#1877F2] hover:!text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(24,119,242,0.5)]"
                >
                  <svg
                    className="w-6 h-6 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Visit MAM Marketplace Group
                </Button>

                <p className="text-sm text-black/60">
                  Free to join • Browse & message vendors directly
                </p>
              </div>
            </Card>

            {/* Right: Vendor Photos Carousel */}
            <div className="relative w-full h-[350px] md:h-[400px] lg:h-[450px] p-4 bg-white rounded-lg shadow-md border-2 border-slate">
              <VendorCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* Vendor Showcase Video */}
      <section className="section-padding bg-gradient-to-b from-white to-slate-50">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4">
                Discover Our Vendors
              </h2>
              <p className="text-base md:text-lg text-black/80 leading-relaxed max-w-2xl mx-auto">
                Take a tour through our 30,000 sq ft showroom featuring treasures from 100+ unique vendors
              </p>
            </div>

            {/* Professional Video Frame - 4:5 Aspect Ratio */}
            <div className="relative w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] lg:max-w-[400px] mx-auto">
              <div className="bg-white p-3 md:p-4 rounded-xl shadow-xl border-4 border-mauve">
                <div className="relative w-full" style={{ paddingBottom: '125%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    src="https://www.youtube.com/embed/SfWKEEtyH6U?rel=0&modestbranding=1&iv_load_policy=3"
                    title="Marietta Antique Mall Vendor Showcase"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>

              {/* Decorative corner accents */}
              <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-bronze rounded-tl-lg"></div>
              <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-bronze rounded-tr-lg"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-bronze rounded-bl-lg"></div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-bronze rounded-br-lg"></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
