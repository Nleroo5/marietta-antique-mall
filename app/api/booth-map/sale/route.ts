import type { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getDb } from '@/lib/booth-map/db'
import { resolveSession, VENDOR_COOKIE } from '@/lib/booth-map/access'
import { boothSalesEnabled, endBoothSale, startBoothSale } from '@/lib/booth-map/sales'
import { counterKey, recordHit } from '@/lib/booth-map/rate-limit'
import { isSameOrigin, json } from '@/lib/booth-map/http'
import { FEED_TAG } from '@/lib/booth-map/cache'

export const dynamic = 'force-dynamic'

const CHANGES_PER_HOUR = 30

/**
 * Start, replace or end a booth sale (SPEC 5b).
 * Body: { action: 'start', booth, percent, lastDay: 'YYYY-MM-DD' } or { action: 'end', booth }.
 */
export async function POST(req: NextRequest) {
  if (!boothSalesEnabled()) return json({ error: 'Booth sales are not available yet.' }, 404)
  if (!isSameOrigin(req)) return json({ error: 'This request came from somewhere else.' }, 403)
  const db = getDb()
  const session = await resolveSession(db, req.cookies.get(VENDOR_COOKIE)?.value)
  if (!session) return json({ error: 'Your vendor link has expired. Tap the link the mall texted you again.' }, 401)

  const body = (await req.json().catch(() => null)) as { action?: unknown; booth?: unknown; percent?: unknown; lastDay?: unknown } | null
  if (!body || (body.action !== 'start' && body.action !== 'end')) return json({ error: 'Something went wrong. Reload the page and try again.' }, 400)

  const { count } = await recordHit(db, counterKey('sale-changes', session.vendorId), { windowSeconds: 3600 })
  if (count > CHANGES_PER_HOUR) return json({ error: 'Too many changes this hour. Try again later.' }, 429)

  const result = body.action === 'start' ? await startBoothSale(db, session, body) : await endBoothSale(db, session, body)
  if (!result.ok) return json({ error: result.error }, result.status)

  // Shoppers see the new prices on their next visit.
  revalidateTag(FEED_TAG, { expire: 0 })
  return json({ ok: true, sale: result.sale })
}
