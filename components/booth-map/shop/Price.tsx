import type { FeedItem } from '@/lib/booth-map/feed-types'
import { formatPrice, isSalePercent, salePriceCents } from '@/lib/booth-map/pricing'
import { formatSaleLastDay } from '@/lib/booth-map/sale-dates'

type PriceFields = Pick<FeedItem, 'priceCents' | 'askInStore' | 'sold' | 'salePercent' | 'saleEndsAt'>

export function priceText(item: Pick<FeedItem, 'priceCents' | 'askInStore'>): string {
  return item.askInStore || item.priceCents === null ? 'Ask in store' : formatPrice(item.priceCents)
}

/** True when the item's booth has a sale running (sold items never show one). */
export function onSale(item: PriceFields): boolean {
  return !item.sold && item.salePercent !== null && item.saleEndsAt !== null && isSalePercent(item.salePercent)
}

/** "Sat, Nov 28": the sale's last day. */
export function saleLastDay(item: PriceFields): string {
  return item.saleEndsAt ? formatSaleLastDay(new Date(item.saleEndsAt)) : ''
}

/** One line of text for page descriptions and share cards. */
export function priceSummary(item: PriceFields): string {
  if (item.sold) return 'Sold'
  if (!onSale(item)) return priceText(item)
  const pct = item.salePercent as number
  if (item.askInStore || item.priceCents === null) return `Ask in store, ${pct}% off`
  return `${formatPrice(salePriceCents(item.priceCents, pct))} on sale (${pct}% off ${formatPrice(item.priceCents)})`
}

/**
 * The price as shoppers see it. On sale: the vendor's price struck through, then the
 * exact sale price (SPEC 5b). "Ask in store" items show the percent instead.
 */
export default function Price({ item, className = '' }: { item: PriceFields; className?: string }) {
  if (item.sold) return <p className={className}>Sold</p>
  if (!onSale(item)) return <p className={className}>{priceText(item)}</p>
  const pct = item.salePercent as number
  if (item.askInStore || item.priceCents === null) {
    return <p className={className}>Ask in store · {pct}% off</p>
  }
  return (
    <p className={className}>
      <s className="mr-1.5 font-normal text-charcoal-light">
        <span className="sr-only">Was </span>
        {formatPrice(item.priceCents)}
      </s>
      <span className="sr-only">now </span>
      {formatPrice(salePriceCents(item.priceCents, pct))}
    </p>
  )
}
