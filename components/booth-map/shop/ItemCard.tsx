import Image from 'next/image'
import Link from 'next/link'
import type { FeedItem } from '@/lib/booth-map/feed-types'
import { formatPrice } from '@/lib/booth-map/pricing'
import TimeAgo, { JustIn } from './TimeAgo'

export function priceText(item: Pick<FeedItem, 'priceCents' | 'askInStore'>): string {
  return item.askInStore || item.priceCents === null ? 'Ask in store' : formatPrice(item.priceCents)
}

/** One find in the feed or on a booth page. Photo first, then the vendor's own title and price (SPEC 8). */
export default function ItemCard({ item, priority = false, showBooth = true }: { item: FeedItem; priority?: boolean; showBooth?: boolean }) {
  return (
    <Link
      href={`/new-arrivals/item/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-champagne-dark bg-white shadow-sm transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
    >
      <div className="relative aspect-square w-full bg-champagne">
        <Image
          src={item.photoUrl}
          alt={item.title}
          fill
          sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
          priority={priority}
          className={`object-cover ${item.sold ? 'opacity-70 grayscale-[60%]' : ''}`}
        />
        {showBooth && (
          <span className="absolute left-2 top-2 rounded-md bg-charcoal px-2 py-1 text-xs font-bold text-white">Booth {item.booth}</span>
        )}
        {!item.sold && <JustIn iso={item.liveAt} />}
        {item.sold && (
          <span className="absolute bottom-2 left-2 -rotate-6 rounded border-2 border-charcoal bg-white px-2 py-0.5 text-xs font-extrabold tracking-[0.15em] text-charcoal">
            SOLD
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 p-3">
        <p className="text-[15px] font-semibold leading-snug text-[#2C2416]">{item.title}</p>
        <p className="text-base font-bold tabular-nums text-[#2C2416]">{item.sold ? 'Sold' : priceText(item)}</p>
        <p className="text-[13px] text-charcoal-light">
          <TimeAgo iso={item.liveAt} />
        </p>
      </div>
    </Link>
  )
}
