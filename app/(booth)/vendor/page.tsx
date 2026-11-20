import { cookies } from 'next/headers'
import { getDb } from '@/lib/booth-map/db'
import { resolveSession, VENDOR_COOKIE } from '@/lib/booth-map/access'
import { countLiveItems } from '@/lib/booth-map/items'
import { activeSalesForVendor, boothSalesEnabled, salePreviewItems } from '@/lib/booth-map/sales'
import { saleDateRange } from '@/lib/booth-map/sale-dates'
import VendorApp from '@/components/booth-map/VendorApp'

export const dynamic = 'force-dynamic'

/**
 * A vendor's private page. Shows nothing about any vendor until the device cookie
 * checks out (SPEC 9: "Nothing before auth").
 */
export default async function VendorPage() {
  const db = getDb()
  const session = await resolveSession(db, (await cookies()).get(VENDOR_COOKIE)?.value)

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <p className="font-display text-2xl">Marietta Antique Mall</p>
          <p className="mt-3 text-base">
            Open this page from the private link the mall texted you. Can&apos;t find it? Ask at the front desk.
          </p>
        </div>
      </main>
    )
  }

  const liveCount = await countLiveItems(db, session.vendorId)
  let sales
  if (boothSalesEnabled() && session.booths.length > 0) {
    const [active, previews] = await Promise.all([activeSalesForVendor(db, session.vendorId), salePreviewItems(db, session.vendorId)])
    sales = {
      range: saleDateRange(),
      booths: session.booths.map((b) => ({ number: b.number, active: active.find((s) => s.boothNumber === b.number) ?? null, preview: previews[b.number] ?? null })),
    }
  }
  return (
    <VendorApp
      vendorId={session.vendorId}
      displayName={session.displayName}
      booths={session.booths.map((b) => b.number)}
      liveCount={liveCount}
      needsConsent={!session.consentAt}
      sales={sales}
    />
  )
}
