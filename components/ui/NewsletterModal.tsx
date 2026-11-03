'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Button from '@/components/ui/Button'
import { RENDERED_AT_FIELD } from '@/lib/spam-guard'

interface NewsletterModalProps {
  delayMs?: number
  daysUntilReshow?: number
}

export default function NewsletterModal({
  delayMs = 3000,
  daysUntilReshow = 7
}: NewsletterModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)
  // The subscribe route discards posts that carry no render timestamp.
  const openedAtRef = useRef<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Check if user has dismissed the modal
    const dismissedUntil = localStorage.getItem('newsletter-modal-dismissed')

    if (dismissedUntil) {
      const dismissedDate = new Date(dismissedUntil)
      const now = new Date()

      // If dismissed date hasn't passed, don't show modal
      if (dismissedDate > now) {
        return
      }
    }

    // Show modal after delay
    const timer = setTimeout(() => {
      openedAtRef.current = Date.now()
      setIsOpen(true)
    }, delayMs)

    return () => clearTimeout(timer)
  }, [delayMs])

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleDismiss = (rememberChoice: boolean) => {
    if (rememberChoice) {
      // Set dismissed date for X days from now
      const dismissUntil = new Date()
      dismissUntil.setDate(dismissUntil.getDate() + daysUntilReshow)
      localStorage.setItem('newsletter-modal-dismissed', dismissUntil.toISOString())
    }
    handleClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Call Mailchimp API to subscribe user
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          source: 'popup',
          [RENDERED_AT_FIELD]: openedAtRef.current !== null ? String(openedAtRef.current) : '',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (data.code === 'ALREADY_SUBSCRIBED') {
          alert('You are already subscribed to our newsletter!')
        } else if (data.code === 'INVALID_EMAIL') {
          alert('Please enter a valid email address.')
        } else {
          alert('Failed to subscribe. Please try again later.')
        }
        setIsSubmitting(false)
        return
      }

      // Track Meta Pixel Lead conversion on successful subscription
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', {
          content_name: 'Newsletter Signup',
          content_category: 'Modal',
          value: 1.00,
          currency: 'USD'
        })
      }

      // Track GA4 conversion
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'generate_lead', {
          event_category: 'Newsletter',
          event_label: 'Signup Modal',
          value: 1
        })
      }

      setIsSuccess(true)
      setEmail('')
      setIsSubmitting(false)

      // Set dismissed permanently after successful signup
      const dismissUntil = new Date()
      dismissUntil.setFullYear(dismissUntil.getFullYear() + 1)
      localStorage.setItem('newsletter-modal-dismissed', dismissUntil.toISOString())

      // Close modal after 2 seconds
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      alert('Failed to subscribe. Please try again later.')
      setIsSubmitting(false)
    }
  }

  if (!mounted || !isOpen) return null

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-fade-in"
        onClick={() => handleDismiss(false)}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => handleDismiss(false)}
              className="absolute top-4 right-4 text-white hover:text-black transition-colors p-2 rounded-lg hover:bg-gray-100"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-6">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-black mb-3">
                Discover Hidden Treasures
              </h2>
              <p className="text-black">
                Join our newsletter and be the first to know about new arrivals, exclusive events, and special promotions!
              </p>
            </div>

            {isSuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center animate-fade-in">
                <svg
                  className="w-12 h-12 text-black mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="font-semibold text-black text-lg mb-1">
                  Welcome Aboard!
                </h3>
                <p className="text-black text-sm">Check your inbox for a special welcome offer.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Subscribing...
                    </span>
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>

                <p className="text-xs text-center text-black">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </form>
            )}

            {/* Don't show again option */}
            {!isSuccess && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleDismiss(true)}
                  className="text-sm text-black hover:text-black transition-colors w-full text-center"
                >
                  Don't show this again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(modalContent, document.body)
}
