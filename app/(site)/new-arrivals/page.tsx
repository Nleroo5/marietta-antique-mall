import { cachedFeed } from '@/lib/booth-map/feed-cache'
import FeedGrid from '@/components/booth-map/shop/FeedGrid'

/** Cached; refreshed when a vendor posts and at least every 5 minutes. */
export const revalidate = 300

export default async function NewArrivalsPage() {
  const items = await cachedFeed()
  const live = items.filter((i) => !i.sold).length

  return (
    <>
      <section className="border-b border-champagne-dark bg-champagne">
        <div className="container-custom flex flex-col gap-3 py-7 md:py-10">
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-mint px-3 py-1.5 text-xs font-bold tracking-[0.08em] text-[#2C2416]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#2C2416]" aria-hidden="true" />
            LIVE FROM THE FLOOR
          </span>
          <h1 className="font-display text-4xl text-[#2C2416] md:text-5xl">Just In at the Mall</h1>
          <p className="max-w-2xl text-base text-charcoal-light md:text-lg">
            Our vendors post new pieces the moment they hit the booth. See what came in, then come find it before someone else does.
          </p>
          {live > 0 && (
            <p className="text-[15px] font-semibold text-[#2C2416]">
              {live} {live === 1 ? 'find' : 'finds'} on the floor now
            </p>
          )}
        </div>
      </section>

      <div className="container-custom py-6 md:py-8">
        <FeedGrid items={items} />
        <p className="mt-6 text-sm text-charcoal-light">
          Every piece is one of a kind and sold in store. The price on the tag in store is final.
        </p>
      </div>
    </>
  )
}
