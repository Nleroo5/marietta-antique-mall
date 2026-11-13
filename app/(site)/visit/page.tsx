'use client'

import {
  LOCATION,
  CONTACT_INFO,
  BUSINESS_HOURS,
  GOOGLE_MAPS_URL,
  GOOGLE_REVIEWS_URL,
} from '@/lib/constants'
import Button from '@/components/ui/Button'
import Card, { CardBody } from '@/components/ui/Card'

export default function VisitPage() {
  const mapUrl = GOOGLE_MAPS_URL

  // Get current day and time to show if open/closed
  const now = new Date()
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' })
  const currentHours = BUSINESS_HOURS.find(h => h.day === currentDay)

  return (
    <main className="min-h-screen">
      {/* Small Page Hero */}
      <section className="bg-gradient-to-b from-slate-light/50 to-white py-12 md:py-16">
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
          <div className="max-w-4xl mx-auto">
            <h1 className="shimmer-text font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-center">
              Plan Your Visit
            </h1>
          </div>
        </div>
      </section>

      {/* Location & Hours - 50/50 Split */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LEFT: Map */}
            <div className="h-[300px] md:h-[400px] lg:h-[500px] rounded-lg overflow-hidden shadow-lg border-2 border-mauve bg-slate-light/20">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3310.4883193824697!2d-84.5132398!3d33.9518798!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88f513e56c72b8e3%3A0xdc254e9a961f132e!2sMarietta%20Antique%20Mall!5e0!3m2!1sen!2sus!4v1733676800000!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Marietta Antique Mall Location"
              />
            </div>

            {/* RIGHT: Info Card */}
            <div>
              <Card className="!border-2 !border-mauve">
                <CardBody>
                  {/* Current Status */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-display text-2xl font-bold text-black">
                        Store Hours
                      </h2>
                    </div>
                    {currentHours && (
                      <p className="text-lg font-semibold text-black">
                        Today: {currentHours.open} - {currentHours.close}
                      </p>
                    )}
                  </div>

                  {/* Full Week Schedule */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="font-semibold text-black mb-3">Weekly Schedule</h3>
                    <ul className="space-y-2">
                      {BUSINESS_HOURS.map((hours) => (
                        <li
                          key={hours.day}
                          className={`flex justify-between ${
                            hours.day === currentDay
                              ? 'font-semibold text-black'
                              : 'text-black'
                          }`}
                        >
                          <span>{hours.day}</span>
                          <span>
                            {hours.open} - {hours.close}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Address */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-black mb-2">Address</h3>
                    <p className="text-black">
                      {LOCATION.address}
                      <br />
                      {LOCATION.city}, {LOCATION.state} {LOCATION.zip}
                    </p>
                  </div>

                  {/* Contact */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-black mb-2">Phone</h3>
                    <a
                      href={`tel:${CONTACT_INFO.phone}`}
                      className="text-lg font-semibold text-black hover:text-black transition-colors"
                    >
                      {CONTACT_INFO.phone}
                    </a>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => window.open(mapUrl, '_blank')}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      Get Directions
                    </Button>

                    <Button
                      variant="secondary"
                      size="lg"
                      className="!bg-mauve !border-mauve !text-white hover:!bg-mauve-dark"
                      onClick={() => window.open(GOOGLE_REVIEWS_URL, '_blank')}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                      Leave a Review
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Parking & Accessibility */}
      <section className="section-padding bg-bg-primary">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-black mb-4">
              Visitor Amenities
            </h2>
            <p className="text-lg text-black max-w-2xl mx-auto">
              We've made visiting comfortable and accessible for everyone
            </p>
          </div>

          {/* Amenities Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Free Parking */}
              <Card hover className="!border-2 !border-mauve">
                <CardBody className="text-center">
                  <div className="w-16 h-16 bg-mauve-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-xl font-bold text-black mb-2">
                    Free Parking
                  </h3>
                  <p className="text-black">
                    Ample parking lot with spaces for large vehicles
                  </p>
                </CardBody>
              </Card>

              {/* Wheelchair Access */}
              <Card hover className="!border-2 !border-mauve">
                <CardBody className="text-center">
                  <div className="w-16 h-16 bg-mauve-light/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-xl font-bold text-black mb-2">
                    Wheelchair Accessible
                  </h3>
                  <p className="text-black">
                    Accessible entrance, wide aisles, and designated parking
                  </p>
                </CardBody>
              </Card>

              {/* Shopping Carts */}
              <Card hover className="!border-2 !border-mauve">
                <CardBody className="text-center">
                  <div className="w-16 h-16 bg-mauve-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-xl font-bold text-black mb-2">
                    Shopping Carts
                  </h3>
                  <p className="text-black">
                    Carts available for your convenience while browsing
                  </p>
                </CardBody>
              </Card>

              {/* Restrooms */}
              <Card hover className="!border-2 !border-mauve">
                <CardBody className="text-center">
                  <div className="w-16 h-16 bg-mauve-light/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="font-display text-xl font-bold text-black mb-2">
                    Clean Restrooms
                  </h3>
                  <p className="text-black">
                    Well-maintained facilities for our visitors
                  </p>
                </CardBody>
              </Card>
          </div>
        </div>
      </section>

      {/* Nearby Attractions */}
      <section className="section-padding bg-bg-primary">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-black mb-4">
              Nearby Attractions
            </h2>
            <p className="text-lg text-black max-w-2xl mx-auto">
              Make a day of it! Explore the best of Marietta while you're here
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Big Chicken */}
            <Card hover className="!border-2 !border-mauve">
              <CardBody>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-mauve-light/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-black mb-2">
                      The Big Chicken
                    </h3>
                    <p className="text-sm text-black mb-2">2 minutes away</p>
                    <p className="text-black">
                      Iconic Marietta landmark and local meeting point. A must-see photo opportunity!
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Marietta Square */}
            <Card hover className="!border-2 !border-mauve">
              <CardBody>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-mauve-light rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-black mb-2">
                      Marietta Square
                    </h3>
                    <p className="text-sm text-black mb-2">10 minutes away</p>
                    <p className="text-black">
                      Historic downtown area with shops, galleries, and seasonal farmers market.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Dining */}
            <Card hover className="!border-2 !border-mauve">
              <CardBody>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-mauve-light/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-black mb-2">
                      Great Dining Options
                    </h3>
                    <p className="text-sm text-black mb-2">Walking distance</p>
                    <p className="text-black">
                      Numerous restaurants, cafes, and eateries within minutes of the mall.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-3xl">
          <div className="text-center p-8 bg-gradient-to-r from-slate-light/20 to-mauve-light/20 rounded-lg border-2 border-mauve">
            <h3 className="font-display text-2xl font-bold text-black mb-3">
              Still Have Questions?
            </h3>
            <p className="text-black mb-6">
              Our friendly staff is here to help! Give us a call or stop by during business hours.
            </p>
            <div className="flex justify-center">
              <Button
                variant="primary"
                size="lg"
                className="!border-2 !border-mint !text-black hover:!bg-mint hover:!text-black"
                onClick={() => (window.location.href = `tel:${CONTACT_INFO.phone}`)}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Call Us
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
