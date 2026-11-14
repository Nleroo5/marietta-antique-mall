'use client'

import { useMemo, useState } from 'react'
import { CATEGORY_LABELS, type FeedItem } from '@/lib/booth-map/feed-types'
import ItemCard from './ItemCard'

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
  const shown = cat === 'all' ? items : items.filter((i) => i.category === cat)

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
      {cats.length > 1 && (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter by category">
          {['all', ...cats].map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
              className={`min-h-[42px] flex-none rounded-full border px-4 text-sm font-semibold transition-colors ${
                cat === c ? 'border-charcoal bg-charcoal text-white' : 'border-champagne-dark bg-white text-[#2C2416] hover:border-mauve'
              }`}
            >
              {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
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
