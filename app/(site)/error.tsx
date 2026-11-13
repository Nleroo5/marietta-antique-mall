'use client'

import { useEffect } from 'react'
import Button from '@/components/ui/Button'
import { BUSINESS_NAME } from '@/lib/constants'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Global error caught:', error)
  }, [error])

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
          {/* Error Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-mauve-light/30 rounded-full flex items-center justify-center border-2 border-mauve">
              <svg className="w-12 h-12 text-mauve-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Error Heading */}
          <h1 className="shimmer-text font-display text-4xl md:text-5xl font-bold mb-4">
            Something Went Wrong
          </h1>

          <p className="text-lg text-black mb-2">
            We apologize for the inconvenience
          </p>

          <p className="text-black/70 mb-8 max-w-md mx-auto">
            Something unexpected happened while browsing {BUSINESS_NAME}. Don't worry—our team has been notified and we're working on fixing it.
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-8 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-left">
              <p className="text-sm font-mono text-red-800 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              variant="primary"
              size="lg"
              onClick={reset}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="!border-2 !border-mauve"
              onClick={() => window.location.href = '/'}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Homepage
            </Button>
          </div>

          {/* Contact Support */}
          <div className="mt-12 pt-8 border-t border-mauve/20">
            <p className="text-sm text-black/70 mb-4">
              If this problem persists, please contact us
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="tel:(770) 973-5600"
                className="text-mauve-dark hover:text-mauve underline transition-colors"
              >
                Call: (770) 973-5600
              </a>
              <a
                href="mailto:info@mariettaantiquemall.com"
                className="text-mauve-dark hover:text-mauve underline transition-colors"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
