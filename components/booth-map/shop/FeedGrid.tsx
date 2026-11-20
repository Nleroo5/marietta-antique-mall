'use client'

import { useMemo, useState } from 'react'
import { CATEGORY_LABELS, type FeedItem } from '@/lib/booth-map/feed-types'
import ItemCard from './ItemCard'
import { onSale } from './Price'

/**
 * The feed with category chips. Filtering happens in the browser, so the page itself
 * stays cached and the chips respond instantly. Chips appear only for categories
 * that have items.
 */
export default function FeedGrid({ items }: { items: FeedItem[] }) {
  const [cat, setCat] = useState<string>('all')
  const cats = useMemo(() => {
    const present = new Set(items.map((i) => i.category).filter((c): c is string => !!c && c in CATEGORY_LABELS))
    return Object.keys(CATEGORY_LABELS).filter((c) => present.has(c))
  }, [items])
  const anySale = useMemo(() => items.some(onSale), [items])
  const shown = cat === 'all' ? items : cat === 'sale' ? items.filter(onSale) : items.filter((i) => i.category === cat)
  // One category chip on its own filters nothing, so categories show only when there are two or more.
  const chips = ['all', ...(anySale ? ['sale'] : []), ...(cats.length > 1 ? cats : [])]

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-champagne-dark bg-white p-6 text-center">
        <p className="font-display text-xl text-[#2C2416]">New finds are on their way</p>
        <p className="mt-2 text-base text-charcoal-light">Vendors post here the moment new pieces hit their booths. Check back soon, or come browse 30,000 sq ft in person.</p>
      </div>
    )
  }

  return (
    <>
      {chips.length > 1 && (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter by category">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
              className={`min-h-[42px] flex-none rounded-full border px-4 text-sm font-semibold transition-colors ${
                cat === c ? 'border-charcoal bg-charcoal text-white' : 'border-champagne-dark bg-white text-[#2C2416] hover:border-mauve'
              }`}
            >
              {c === 'all' ? 'All' : c === 'sale' ? 'On sale' : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
        {shown.map((item, i) => (
          <ItemCard key={item.id} item={item} preload={i < 4} />
        ))}
      </div>
    </>
  )
}
