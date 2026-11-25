import type { Metadata } from 'next'
import Link from 'next/link'
import { cachedMapBooths } from '@/lib/booth-map/feed-cache'
import { getSpace } from '@/lib/booth-map/floor-plan'
import StoreMap from '@/components/booth-map/map/StoreMap'

/** Cached like the feed: refreshed when a vendor posts and at least every 5 minutes. */
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Store map',
  description: 'Find any booth at Marietta Antique Mall, with walking directions from the front door.',
  openGraph: {
    title: 'Store map | Marietta Antique Mall',
    description: 'Find any booth at Marietta Antique Mall, with walking directions from the front door.',
    url: '/new-arrivals/map',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Marietta Antique Mall' }],
  },
}

export default async function StoreMapPage() {
  const booths = await cachedMapBooths()
  const lit = booths.filter((n) => getSpace(n))
  // A vendor's booth that the floor plan doesn't have (test booths on previews, or a booth
  // added since the plan was drawn) is listed instead of silently missing.
  const notOnPlan = booths.filter((n) => !getSpace(n))

  return (
    <div className="container-custom py-5 md:py-8">
      <Link href="/new-arrivals" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[#2C2416] hover:underline">
        ‹ All new arrivals
      </Link>
      <div className="mt-2 flex flex-col gap-1">
        <h1 className="font-display text-4xl text-[#2C2416]">Store map</h1>
        <p className="max-w-2xl text-base text-charcoal-light">Find any booth by its number and get walking directions from the front door.</p>
      </div>
      <div className="mt-5">
        <StoreMap lit={lit} />
      </div>
      {notOnPlan.length > 0 && (
        <p className="mt-5 text-sm text-charcoal-light">
          Not on the map yet:{' '}
          {notOnPlan.map((n, i) => (
            <span key={n}>
              {i > 0 && ', '}
              <Link href={`/new-arrivals/booth/${encodeURIComponent(n)}`} className="underline">
                Booth {n}
              </Link>
            </span>
          ))}
          .
        </p>
      )}
    </div>
  )
}
