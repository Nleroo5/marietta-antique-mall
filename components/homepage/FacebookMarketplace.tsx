'use client'

import Image from 'next/image'
import { BUSINESS_NAME, CONTACT_INFO } from '@/lib/constants'

/**
 * Homepage "Follow Us on Facebook" card.
 *
 * This used to embed Facebook's Page Plugin timeline. Facebook stopped serving
 * that timeline (checked 3 Nov 2026): the plugin renders only the page header
 * and its feed request fails with error 1357032, for logged-out visitors too and
 * even for facebook.com/facebook itself. Every visitor saw a 131px header stub.
 *
 * The card is built here instead, so it renders without Facebook's SDK, which
 * also drops several hundred KB of third-party script from the homepage. The
 * Meta Pixel in the root layout is separate and unaffected.
 */

const PHOTOS = [
  {
    src: '/images/vendors/antique-store-marietta-vintage-collectibles-mall-15.webp',
    alt: 'Vintage UGA bulldog figure in a red jersey',
  },
  {
    src: '/images/vendors/marietta-antique-store-vintage-finds-interior-27.webp',
    alt: 'Vintage Coca-Cola cooler and advertising signs in a vendor booth',
  },
  {
    src: '/images/vendors/atlanta-antique-store-marietta-vintage-treasures-06.webp',
    alt: 'Carved wooden antique wall clock',
  },
  {
    src: '/images/vendors/marietta-antique-mall-vintage-store-interior-01.webp',
    alt: 'Set of vintage painted kitchen canisters',
  },
]

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export default function FacebookMarketplace() {
  const handleFollowClick = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'facebook_follow_click', {
        event_category: 'Facebook',
        event_label: 'Homepage card',
      })
    }
  }

  return (
    <div id="facebook-marketplace" className="h-full flex flex-col">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-black mb-3">
          Follow Us on Facebook
        </h2>
        <p className="text-base text-black">
          Stay up to date with our latest arrivals, events, and exclusive offers.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-[500px] overflow-hidden rounded-xl border-2 border-mauve bg-white shadow-lg">
          {/* Page header */}
          <div className="flex items-center gap-4 p-5">
            <Image
              src="/images/new-logo.png"
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-full ring-1 ring-black/10"
            />
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl text-black">{BUSINESS_NAME}</p>
              <p className="text-sm text-charcoal-light">10K+ followers on Facebook</p>
            </div>
            <FacebookIcon className="h-8 w-8 shrink-0 text-[#1877F2]" />
          </div>

          {/* Photos from the mall floor */}
          <div className="grid grid-cols-2 gap-1">
            {PHOTOS.map((photo) => (
              <div key={photo.src} className="relative aspect-[4/3] bg-champagne">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 768px) 250px, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <div className="p-5 md:p-6">
            <p className="mb-5 text-base text-charcoal">
              We post new arrivals, vendor finds, and event news on our Facebook page.
            </p>
            <a
              href={CONTACT_INFO.facebook}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleFollowClick}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#166FE5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2] focus-visible:ring-offset-2"
            >
              <FacebookIcon className="h-5 w-5" />
              Follow us on Facebook
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
