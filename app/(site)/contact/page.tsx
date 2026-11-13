'use client'

import { BUSINESS_NAME, LOCATION, CONTACT_INFO, BUSINESS_HOURS } from '@/lib/constants'
import { getGoogleMapsUrl } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Card, { CardBody } from '@/components/ui/Card'

export default function ContactPage() {
  const mapUrl = getGoogleMapsUrl(LOCATION.address, LOCATION.city, LOCATION.state, LOCATION.zip)

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-mauve-light/10 to-white py-16 md:py-24">
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
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="shimmer-text font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-black">
              Have a question or want to learn more? We'd love to hear from you!
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods Section */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-5xl">
          {/* Contact Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Phone Card */}
            <Card className="!border-2 !border-mauve">
              <CardBody className="text-center p-6 md:p-8">
                <div className="w-20 h-20 bg-mauve-light rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-10 h-10 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-bold text-black mb-3">
                  Call Us
                </h3>
                <p className="text-black mb-6">
                  Speak directly with our friendly staff during business hours
                </p>
                <a
                  href={`tel:${CONTACT_INFO.phone.replace(/[^\d]/g, '')}`}
                  className="text-2xl font-bold text-black hover:text-accent transition-colors mb-6 block"
                >
                  {CONTACT_INFO.phone}
                </a>
                <Button
                  variant="primary"
                  size="lg"
                  className="!border-2 !border-mint !text-black hover:!bg-mint hover:!text-black"
                  onClick={() => {
                    // Track GA4 contact event
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                      (window as any).gtag('event', 'contact', {
                        method: 'phone',
                        page: 'contact',
                        value: 1
                      })
                    }

                    // Track Meta Pixel contact event
                    if (typeof window !== 'undefined' && (window as any).fbq) {
                      (window as any).fbq('track', 'Contact', {
                        content_name: 'Phone Call',
                        content_category: 'Contact Page'
                      })
                    }
                    window.location.href = `tel:${CONTACT_INFO.phone.replace(/[^\d]/g, '')}`
                  }}
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
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Call Now
                </Button>
              </CardBody>
            </Card>

            {/* Email Card */}
            <Card className="!border-2 !border-mauve">
              <CardBody className="text-center p-6 md:p-8">
                <div className="w-20 h-20 bg-mauve-light rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-10 h-10 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-bold text-black mb-3">
                  Email Us
                </h3>
                <p className="text-black mb-6">
                  Send us a message and we'll respond as soon as possible
                </p>
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="text-xl font-bold text-black hover:text-accent transition-colors mb-6 block break-all"
                >
                  {CONTACT_INFO.email}
                </a>
                <Button
                  variant="accent"
                  size="lg"
                  className="!border-2 !border-mauve"
                  onClick={() => {
                    // Track GA4 contact event
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                      (window as any).gtag('event', 'contact', {
                        method: 'email',
                        page: 'contact',
                        value: 1
                      })
                    }

                    // Track Meta Pixel contact event
                    if (typeof window !== 'undefined' && (window as any).fbq) {
                      (window as any).fbq('track', 'Contact', {
                        content_name: 'Email',
                        content_category: 'Contact Page'
                      })
                    }
                    window.location.href = `mailto:${CONTACT_INFO.email}`
                  }}
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Send Email
                </Button>
              </CardBody>
            </Card>
          </div>

          {/* Additional Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location Card */}
            <Card className="!border-2 !border-slate">
              <CardBody>
                <div className="flex items-start gap-3 mb-4">
                  <svg
                    className="w-6 h-6 text-black flex-shrink-0 mt-1"
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
                  <div>
                    <h3 className="font-display text-lg font-bold text-black mb-2">
                      Visit Us
                    </h3>
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black hover:text-accent transition-colors"
                    >
                      {LOCATION.address}
                      <br />
                      {LOCATION.city}, {LOCATION.state} {LOCATION.zip}
                    </a>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  className="!border !border-slate"
                  onClick={() => {
                    // Track GA4 get directions event
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                      (window as any).gtag('event', 'get_directions', {
                        page: 'contact',
                        destination: 'Marietta Antique Mall'
                      })
                    }
                    window.open(mapUrl, '_blank')
                  }}
                >
                  Get Directions
                </Button>
              </CardBody>
            </Card>

            {/* Social Media Card */}
            <Card className="!border-2 !border-slate">
              <CardBody>
                <div className="flex items-start gap-3 mb-4">
                  <svg
                    className="w-6 h-6 text-black flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-bold text-black mb-2">
                      Follow Us
                    </h3>
                    <p className="text-sm text-black mb-4">
                      Stay updated on new arrivals and events
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 justify-center">
                  <a
                    href={CONTACT_INFO.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-black hover:text-[#1877F2] hover:scale-110 transition-all"
                    aria-label="Facebook"
                  >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  {CONTACT_INFO.instagram && (
                    <a
                      href={CONTACT_INFO.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-black hover:text-[#E4405F] hover:scale-110 transition-all"
                      aria-label="Instagram"
                    >
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </a>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="section-padding bg-bg-primary">
        <div className="container-custom">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-black mb-4">
              Find Us
            </h2>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="h-[400px] lg:h-[500px] rounded-lg overflow-hidden shadow-lg border-2 border-mauve">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(`${LOCATION.address}, ${LOCATION.city}, ${LOCATION.state} ${LOCATION.zip}`)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Marietta Antique Mall Location"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
