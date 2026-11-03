'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Calendar, Camera, Flame, MapPin, PawPrint, type LucideIcon } from 'lucide-react'
import { BUSINESS_NAME, GOOGLE_MAPS_URL, LOCATION } from '@/lib/constants'
import {
  HOLIDAY_OPEN_HOUSE_ANCHOR,
  HOLIDAY_OPEN_HOUSE_END,
  HOLIDAY_OPEN_HOUSE_HOURS,
  HOLIDAY_OPEN_HOUSE_ICS,
  HOLIDAY_OPEN_HOUSE_IMAGE,
  HOLIDAY_OPEN_HOUSE_START,
  getHolidayOpenHouseState,
  holidayOpenHouseCountdown,
  trackHolidayOpenHouseClick,
} from '@/lib/holiday-open-house'

const SITE_URL = 'https://www.mariettaantiquemall.com'

const ACTIVITIES: { icon: LucideIcon; title: string; detail: string; time?: string }[] = [
  { icon: Camera, title: 'Pet Photos with Santa', detail: 'Bring your pet for a holiday portrait', time: '11 AM–4 PM' },
  { icon: Flame, title: 'Hot Dog Cookout', detail: 'Hot dogs on the grill', time: '11 AM–2 PM' },
  { icon: PawPrint, title: 'Furkids Pet Adoptions', detail: 'Meet adoptable pets looking for a home' },
]

const EVENT_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: `Holiday Open House at ${BUSINESS_NAME}`,
  description:
    'All vendors 10–50% off. Pet photos with Santa 11 AM–4 PM, hot dog cookout 11 AM–2 PM, and Furkids pet adoptions.',
  startDate: HOLIDAY_OPEN_HOUSE_START,
  endDate: HOLIDAY_OPEN_HOUSE_END,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  image: [`${SITE_URL}${HOLIDAY_OPEN_HOUSE_IMAGE}`],
  url: `${SITE_URL}/#${HOLIDAY_OPEN_HOUSE_ANCHOR}`,
  location: {
    '@type': 'Place',
    name: BUSINESS_NAME,
    address: {
      '@type': 'PostalAddress',
      streetAddress: LOCATION.address,
      addressLocality: LOCATION.city,
      addressRegion: LOCATION.state,
      postalCode: LOCATION.zip,
      addressCountry: 'US',
    },
  },
  organizer: {
    '@type': 'Organization',
    name: BUSINESS_NAME,
    url: SITE_URL,
  },
}

/**
 * Homepage section for the 14 November 2026 Holiday Open House.
 *
 * The homepage only includes this while the event is upcoming (checked at
 * render, and the page revalidates hourly). It also hides itself in the
 * browser from 00:00 Atlanta time on 15 November, so a cached copy of the
 * page never shows it late.
 */
export default function HolidayOpenHouse() {
  // null during the server render, which cannot know the visitor's date; the
  // countdown and the expiry check only run once mounted.
  const [state, setState] = useState<ReturnType<typeof getHolidayOpenHouseState> | null>(null)

  useEffect(() => {
    setState(getHolidayOpenHouseState())
  }, [])

  if (state && !state.visible) return null

  return (
    <section
      id={HOLIDAY_OPEN_HOUSE_ANCHOR}
      aria-labelledby="holiday-open-house-title"
      className="scroll-mt-24 bg-[#fbf1e1] py-16 md:py-24"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(EVENT_SCHEMA) }}
      />

      <div className="container-custom">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <figure className="mx-auto w-full max-w-sm md:max-w-none">
            <Image
              src={HOLIDAY_OPEN_HOUSE_IMAGE}
              alt="Holiday Open House flyer: Saturday, November 14 at Marietta Antique Mall. All vendors 10 to 50 percent off, pet photos with Santa 11 AM to 4 PM, hot dog cookout 11 AM to 2 PM, and Furkids pet adoptions."
              width={1122}
              height={1402}
              sizes="(min-width: 1280px) 480px, (min-width: 768px) 40vw, (min-width: 416px) 384px, 100vw"
              className="h-auto w-full rounded-xl shadow-2xl ring-1 ring-[#1f3a24]/10"
            />
          </figure>

          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-[#1f3a24] px-3 py-1 font-nav text-xs font-semibold uppercase tracking-wider text-[#fbf1e1]">
                Sat &middot; Nov 14
              </span>
              {state && (
                <span className="text-sm font-semibold text-[#4a6239]">
                  {holidayOpenHouseCountdown(state.daysLeft)}
                </span>
              )}
            </div>

            <h2
              id="holiday-open-house-title"
              className="mb-4 font-display text-4xl font-bold text-[#1f3a24] md:text-5xl"
            >
              Holiday Open House
            </h2>

            <p className="mb-8 max-w-xl text-lg leading-relaxed text-charcoal-light">
              On Saturday, November 14, every vendor across our 30,000 sq ft is taking{' '}
              <strong className="font-bold text-[#9b1c1f]">10&ndash;50% off</strong>. Get a head start
              on holiday gifts, and bring the family along.
            </p>

            <ul className="mb-8 divide-y divide-[#1f3a24]/10 border-y border-[#1f3a24]/10">
              {ACTIVITIES.map(({ icon: Icon, title, detail, time }) => (
                <li key={title} className="flex items-center gap-4 py-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e3e8d6] text-[#1f3a24]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-xl text-[#1f3a24]">{title}</span>
                    <span className="block text-sm text-charcoal-lighter">{detail}</span>
                  </span>
                  {time && (
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-[#e3e8d6] px-3 py-1 text-sm font-semibold text-[#1f3a24]">
                      {time}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={HOLIDAY_OPEN_HOUSE_ICS}
                onClick={() => trackHolidayOpenHouseClick('Add to calendar')}
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-[#1f3a24] bg-[#1f3a24] px-6 py-3 font-semibold text-[#fbf1e1] transition-colors hover:bg-[#2c4e33] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f3a24] focus-visible:ring-offset-2"
              >
                <Calendar className="h-5 w-5" aria-hidden="true" />
                Add to calendar
              </a>
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackHolidayOpenHouseClick('Get directions')}
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-mauve px-6 py-3 font-semibold text-black transition-colors hover:bg-mauve focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2"
              >
                <MapPin className="h-5 w-5" aria-hidden="true" />
                Get directions
              </a>
            </div>

            <p className="mt-5 text-sm text-charcoal-lighter">
              {LOCATION.address}, {LOCATION.city}, {LOCATION.state} {LOCATION.zip} &middot; Open{' '}
              {HOLIDAY_OPEN_HOUSE_HOURS}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
