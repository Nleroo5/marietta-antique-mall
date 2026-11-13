'use client'

import Link from 'next/link'
import Button from '@/components/ui/Button'
import { BUSINESS_NAME } from '@/lib/constants'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-primary">
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

      <div className="container-custom text-center py-16">
        <div className="max-w-2xl mx-auto">
          {/* 404 Number */}
          <h1 className="shimmer-text font-display text-8xl md:text-9xl font-bold mb-4">
            404
          </h1>

          {/* Error Message */}
          <h2 className="font-display text-3xl md:text-4xl font-bold text-black mb-4">
            Page Not Found
          </h2>

          <p className="text-lg text-black mb-8 max-w-md mx-auto">
            Oops! The page you're looking for seems to have been misplaced—just like that perfect vintage find you're searching for at {BUSINESS_NAME}.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/">
              <Button variant="primary" size="lg">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Back to Home
              </Button>
            </Link>

            <Link href="/shop">
              <Button variant="secondary" size="lg" className="!border-2 !border-mauve">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Shop Online
              </Button>
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-mauve/20">
            <p className="text-sm text-black/70 mb-4">Looking for something specific?</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/vendors" className="text-mauve-dark hover:text-mauve underline transition-colors">
                Become a Vendor
              </Link>
              <Link href="/visit" className="text-mauve-dark hover:text-mauve underline transition-colors">
                Visit Us
              </Link>
              <Link href="/contact" className="text-mauve-dark hover:text-mauve underline transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
