import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cachedItem } from '@/lib/booth-map/feed-cache'
import { CATEGORY_LABELS } from '@/lib/booth-map/feed-types'
import { priceText } from '@/components/booth-map/shop/ItemCard'
import TimeAgo from '@/components/booth-map/shop/TimeAgo'
import VisitButtons from '@/components/booth-map/shop/VisitButtons'
import { BUSINESS_NAME } from '@/lib/constants'

export const revalidate = 300

/** Built on first visit, then cached like the feed. */
export function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await cachedItem((await params).id)
  if (!item) return { title: 'Item not found' }
  const description = item.sold
    ? `${item.title} from Booth ${item.booth} has sold. See what else is new at Marietta Antique Mall.`
    : `${item.title}, ${priceText(item)}, in Booth ${item.booth} at Marietta Antique Mall.`
  const image = { url: item.photoUrl, width: item.photoW, height: item.photoH, alt: item.title }
  return {
    title: item.title,
    description,
    openGraph: {
      type: 'website',
      siteName: BUSINESS_NAME,
      title: item.title,
      description,
      url: `/new-arrivals/item/${item.id}`,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: item.title, description, images: [item.photoUrl] },
  }
}

export default async function ItemPage({ params }: Props) {
  const item = await cachedItem((await params).id)
  if (!item) notFound()

  return (
    <div className="container-custom py-5 md:py-8">
      <Link href="/new-arrivals" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[#2C2416] hover:underline">
        ‹ All new arrivals
      </Link>
      <div className="mt-2 grid gap-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-10">
        {/* Capped height on phones so the title and price show without scrolling past a tall photo. */}
        <div className="relative flex justify-center overflow-hidden rounded-xl bg-champagne">
          <Image
            src={item.photoUrl}
            alt={item.title}
            width={item.photoW}
            height={item.photoH}
            preload
            sizes="(min-width: 768px) 60vw, 100vw"
            className={`h-auto max-h-[360px] w-auto max-w-full object-contain md:max-h-none md:w-full ${item.sold ? 'opacity-70 grayscale-[60%]' : ''}`}
          />
          {item.sold && (
            <span className="absolute bottom-4 left-4 -rotate-6 rounded border-2 border-charcoal bg-white px-3 py-1 text-base font-extrabold tracking-[0.15em] text-charcoal">
              SOLD
            </span>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-charcoal-light">
            <Link href={`/new-arrivals/booth/${encodeURIComponent(item.booth)}`} className="font-semibold text-[#2C2416] underline">
              Booth {item.booth}
            </Link>
            {item.category && CATEGORY_LABELS[item.category] ? ` · ${CATEGORY_LABELS[item.category]}` : ''} · <TimeAgo iso={item.liveAt} prefix="Posted " />
          </p>
          <h1 className="break-words font-display text-3xl text-[#2C2416] md:text-4xl">{item.title}</h1>
          <p className="text-2xl font-bold tabular-nums text-[#2C2416]">{item.sold ? 'Sold' : priceText(item)}</p>
          {item.sold ? (
            <p className="text-base text-charcoal-light">This one found a home. Booth {item.booth} has more where it came from.</p>
          ) : (
            <p className="text-base text-charcoal-light">Title and price are written by the vendor. Find it in Booth {item.booth}.</p>
          )}
          <VisitButtons />
          <Link
            href={`/new-arrivals/booth/${encodeURIComponent(item.booth)}`}
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg border-2 border-champagne-dark bg-white px-5 font-semibold text-[#2C2416] hover:border-mauve"
          >
            More from Booth {item.booth}
          </Link>
        </div>
      </div>
    </div>
  )
}
