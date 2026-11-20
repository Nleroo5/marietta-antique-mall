import { cachedFeed } from '@/lib/booth-map/feed-cache'
import FeedGrid from '@/components/booth-map/shop/FeedGrid'
import VisitButtons from '@/components/booth-map/shop/VisitButtons'
import { onSale } from '@/components/booth-map/shop/Price'

/** Cached; refreshed when a vendor posts and at least every 5 minutes. */
export const revalidate = 300

export default async function NewArrivalsPage() {
  const items = await cachedFeed()
  const live = items.filter((i) => !i.sold).length

  return (
    <>
      {/* Kept short on phones so the first photos show without scrolling (photos first, SPEC 8). */}
      <section className="border-b border-champagne-dark bg-champagne">
        <div className="container-custom flex flex-col gap-2 py-5 md:gap-3 md:py-10">
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-mint px-3 py-1 text-[11px] font-bold tracking-[0.08em] text-[#2C2416] md:py-1.5 md:text-xs">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#2C2416]" aria-hidden="true" />
            LIVE FROM THE FLOOR
          </span>
          <h1 className="font-display text-3xl text-[#2C2416] md:text-5xl">Just In at the Mall</h1>
          <p className="max-w-2xl text-[15px] text-charcoal-light md:text-lg">
            {live > 0 ? `${live} new ${live === 1 ? 'find' : 'finds'} from our vendors. ` : ''}
            <span className="hidden sm:inline">Vendors post new pieces the moment they hit the booth. </span>
            Come find yours before someone else does.
          </p>
          <div className="max-w-md pt-1">
            <VisitButtons compact />
          </div>
        </div>
      </section>

      <div className="container-custom py-5 md:py-8">
        <FeedGrid items={items} />
        <p className="mt-6 text-sm text-charcoal-light">
          Every piece is one of a kind and sold in store. Calling? Ask if it&apos;s still here.{' '}
          {items.some(onSale) ? 'Tag prices are final, except booth sale prices shown here, which are confirmed at the register.' : 'The price on the tag in store is final.'}
        </p>
      </div>
    </>
  )
}
