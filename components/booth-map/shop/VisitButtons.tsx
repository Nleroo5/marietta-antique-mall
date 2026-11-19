import { CONTACT_INFO, GOOGLE_MAPS_URL } from '@/lib/constants'
import { formatPhoneLink } from '@/lib/utils'

/**
 * Get directions and Call: the two actions the Meta ads will optimize toward
 * (tracking for them is SPEC build step 7). Holds are not agreed with the owner yet,
 * so the copy asks shoppers to check the item is still here.
 */
export default function VisitButtons({ compact = false }: { compact?: boolean }) {
  const h = compact ? 'min-h-[44px] text-base' : 'min-h-[52px] text-lg'
  return (
    <div className="flex flex-col gap-2">
      {/* Full size stacks on phones so "Call (770) 973-5600" never wraps; compact labels fit side by side. */}
      <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <a
          href={GOOGLE_MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex ${h} items-center justify-center rounded-lg border-2 border-mauve bg-mauve px-3 text-center font-semibold text-black transition-colors hover:border-mauve-dark hover:bg-mauve-dark`}
        >
          Get directions
        </a>
        <a
          href={`tel:${formatPhoneLink(CONTACT_INFO.phone)}`}
          className={`inline-flex ${h} items-center justify-center rounded-lg border-2 border-mauve px-3 text-center font-semibold text-black transition-colors hover:bg-mauve-light`}
        >
          {compact ? 'Call the mall' : `Call ${CONTACT_INFO.phone}`}
        </a>
      </div>
      {!compact && <p className="text-sm text-charcoal-light">Calling? Ask if it&apos;s still here. The price on the tag in store is final.</p>}
    </div>
  )
}
