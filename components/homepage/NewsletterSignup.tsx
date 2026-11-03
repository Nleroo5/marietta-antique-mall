'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { CONTACT_INFO } from '@/lib/constants'
import { HONEYPOT_FIELD, RENDERED_AT_FIELD } from '@/lib/spam-guard'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const ref = useRef(null)
  const honeypotRef = useRef<HTMLInputElement>(null)
  // The subscribe route discards posts that arrive without this or too soon
  // after it, which is what a script hitting the endpoint directly looks like.
  const renderedAtRef = useRef<number | null>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  useEffect(() => {
    renderedAtRef.current = Date.now()
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'homepage',
          [HONEYPOT_FIELD]: honeypotRef.current?.value ?? '',
          [RENDERED_AT_FIELD]: renderedAtRef.current !== null ? String(renderedAtRef.current) : '',
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          data.code === 'INVALID_EMAIL'
            ? 'Please enter a valid email address.'
            : `We couldn't sign you up just now. Please try again, or email us at ${CONTACT_INFO.email}.`
        )
        setIsSubmitting(false)
        return
      }
    } catch {
      setError(`We couldn't sign you up just now. Please try again, or email us at ${CONTACT_INFO.email}.`)
      setIsSubmitting(false)
      return
    }

    // Track GA4 lead conversion, only once the signup has actually gone through
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'generate_lead', {
        lead_type: 'newsletter',
        source: 'homepage_form',
        value: 1
      })
    }

    setIsSuccess(true)
    setEmail('')
    setIsSubmitting(false)

    // Reset success message after 5 seconds
    setTimeout(() => setIsSuccess(false), 5000)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-black mb-3">
          Join the Treasure Hunter&apos;s Club
        </h2>
        <p className="text-base text-charcoal">
          Subscribe to our newsletter
        </p>
      </div>

      {/* Newsletter Card */}
      <motion.div
        ref={ref}
        initial={{ height: 'auto' }}
        animate={{
          height: !isMobile && isInView ? '50%' : 'auto'
        }}
        transition={{
          duration: 1.2,
          ease: [0.4, 0.0, 0.2, 1],
          delay: 0.2
        }}
        className="sticky top-24 rounded-2xl shadow-lg p-6 md:p-8 overflow-hidden flex flex-col border-2 border-mauve bg-white"
      >
            {/* Decorative top accent */}
            <div
              className="absolute top-0 left-0 right-0 h-[4px] opacity-60 pointer-events-none"
              style={{
                background: 'linear-gradient(to right, transparent 0%, rgba(201, 168, 106, 0.5) 50%, transparent 100%)',
              }}
            />

            <div className="text-center mb-6 relative z-10">
              {/* Treasure Chest Icon */}
              <div className="flex justify-center mb-4">
                <Image
                  src="/images/treasure.jpg"
                  alt="Treasure chest"
                  width={96}
                  height={96}
                  className="w-24 h-24 object-contain"
                />
              </div>
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
                  Successfully Subscribed!
                </h3>
                <p className="text-black">Thank you for joining our newsletter.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
                {/*
                  Honeypot, same as the vendor form. Off-screen rather than
                  display:none, because some bots skip inputs they can tell are
                  hidden. Anything typed here means a script filled the form.
                */}
                <div
                  aria-hidden="true"
                  style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
                >
                  <label htmlFor={`newsletter-${HONEYPOT_FIELD}`}>Company website (leave this field empty)</label>
                  <input
                    ref={honeypotRef}
                    type="text"
                    id={`newsletter-${HONEYPOT_FIELD}`}
                    name={HONEYPOT_FIELD}
                    tabIndex={-1}
                    autoComplete="off"
                    defaultValue=""
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="flex-1 px-6 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base transition-all hover:border-primary/50"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    className="whitespace-nowrap transition-all hover:scale-105"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
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
                      'Subscribe'
                    )}
                  </Button>
                </div>
                {error && (
                  <p role="alert" className="text-sm text-red-700 mt-3 text-center">
                    {error}
                  </p>
                )}
                <p className="text-xs text-black mt-3 text-center">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </form>
            )}

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-accent/30 relative z-10">
              <div className="flex items-start gap-3 text-charcoal">
                <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold">Vendor Spotlights</p>
                  <p className="text-xs text-charcoal/80">Featured collections</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-charcoal">
                <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold">No Spam</p>
                  <p className="text-xs text-charcoal/80">Unsubscribe anytime</p>
                </div>
              </div>
            </div>
          </motion.div>
    </div>
  )
}
