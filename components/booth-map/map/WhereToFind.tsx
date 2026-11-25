import Link from 'next/link'
import { getSpace, getStreet, spaceTitle } from '@/lib/booth-map/floor-plan'
import { directionsFor } from '@/lib/booth-map/directions'

/**
 * "Booth 705 · Marietta Street", walking directions from the front door, and a link to the
 * store map. Shown on booth and item pages; renders nothing for a booth that isn't on the
 * floor plan (test booths 9001-9003, or a number the plan doesn't have yet).
 */
export default function WhereToFind({ booth }: { booth: string }) {
  const space = getSpace(booth)
  if (!space) return null
  return (
    <div className="rounded-xl border border-champagne-dark bg-white px-4 py-3">
      <p className="text-sm font-semibold text-[#2C2416]">
        {spaceTitle(space)} · {getStreet(space.street).name}
      </p>
      <p className="mt-1 text-[15px] leading-relaxed text-charcoal-light">{directionsFor(space.id)}</p>
      <Link
        href={`/new-arrivals/map?booth=${encodeURIComponent(space.id)}`}
        className="mt-1 inline-flex min-h-[44px] items-center font-semibold text-[#2C2416] underline"
      >
        Show it on the store map
      </Link>
    </div>
  )
}
