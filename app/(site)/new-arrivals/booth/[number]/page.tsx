import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { cachedBoothFeed } from '@/lib/booth-map/feed-cache'
import { normalizeBoothNumber } from '@/lib/booth-map/feed'
import ItemCard from '@/components/booth-map/shop/ItemCard'
import VisitButtons from '@/components/booth-map/shop/VisitButtons'

export const revalidate = 300

export function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ number: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = normalizeBoothNumber((await params).number)
  if (!n) return { title: 'Booth not found' }
  return {
    title: `Booth ${n}`,
    description: `New finds from Booth ${n} at Marietta Antique Mall.`,
    openGraph: { title: `New finds from Booth ${n}`, url: `/new-arrivals/booth/${encodeURIComponent(n)}` },
  }
}

export default async function BoothPage({ params }: Props) {
  const raw = (await params).number
  const number = normalizeBoothNumber(raw)
  if (!number) notFound()
  if (number !== raw) permanentRedirect(`/new-arrivals/booth/${encodeURIComponent(number)}`)

  const items = await cachedBoothFeed(number)
  if (!items) notFound() // no such booth, or no vendor shoppers can see

  const live = items.filter((i) => !i.sold).length
  const summary =
    live > 0
      ? `${live} new ${live === 1 ? 'find' : 'finds'} from this booth.`
      : items.length > 0
        ? 'Everything posted here recently has sold. Stop by to see what came in since.'
        : 'No new photos from this booth right now. Stop by and see it in person.'

  return (
    <div className="container-custom py-5 md:py-8">
      <Link href="/new-arrivals" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[#2C2416] hover:underline">
        ‹ All new arrivals
      </Link>
      <div className="mt-2 flex flex-col gap-2">
        <h1 className="font-display text-4xl text-[#2C2416]">Booth {number}</h1>
        <p className="text-base text-charcoal-light">{summary}</p>
      </div>
      {items.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
          {items.map((item, i) => (
            <ItemCard key={item.id} item={item} preload={i < 2} showBooth={false} />
          ))}
        </div>
      )}
      <div className="mt-8 max-w-xl">
        <VisitButtons />
      </div>
    </div>
  )
}
