import { CONTACT_INFO, GOOGLE_MAPS_URL } from '@/lib/constants'
import { formatPhoneLink } from '@/lib/utils'

/**
 * Get directions and Call: the two actions the Meta ads will optimize toward
 * (tracking for them is SPEC build step 7). Holds are not agreed with the owner yet,
 * so the copy asks shoppers to check the item is still here.
 */
export default function VisitButtons() {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <a
          href={GOOGLE_MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[52px] items-center justify-center rounded-lg border-2 border-mauve bg-mauve px-5 text-lg font-semibold text-black transition-colors hover:border-mauve-dark hover:bg-mauve-dark"
        >
          Get directions
        </a>
        <a
          href={`tel:${formatPhoneLink(CONTACT_INFO.phone)}`}
          className="inline-flex min-h-[52px] items-center justify-center rounded-lg border-2 border-mauve px-5 text-lg font-semibold text-black transition-colors hover:bg-mauve-light"
        >
          Call {CONTACT_INFO.phone}
        </a>
      </div>
      <p className="text-sm text-charcoal-light">Calling? Ask if it&apos;s still here. The price on the tag in store is final.</p>
    </div>
  )
}
