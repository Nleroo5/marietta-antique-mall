import type { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { head } from '@vercel/blob'
import { getDb } from '@/lib/booth-map/db'
import { resolveSession, VENDOR_COOKIE } from '@/lib/booth-map/access'
import { createItems, validateCards, verifyPhotos } from '@/lib/booth-map/items'
import { counterKey, recordHit } from '@/lib/booth-map/rate-limit'
import { isSameOrigin, json } from '@/lib/booth-map/http'
import { FEED_TAG } from '@/lib/booth-map/cache'

export const dynamic = 'force-dynamic'

const POSTS_PER_HOUR = 40

/** Post new items. Title and price are exactly what the vendor typed (SPEC rule 3). */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return json({ error: 'This request came from somewhere else.' }, 403)
  const db = getDb()
  const session = await resolveSession(db, req.cookies.get(VENDOR_COOKIE)?.value)
  if (!session) return json({ error: 'Your vendor link has expired. Scan your card again.' }, 401)

  const body = (await req.json().catch(() => null)) as { items?: unknown; consent?: unknown } | null
  const checked = validateCards(body?.items, session)
  if (!checked.ok) return json({ error: checked.message ?? 'Check the highlighted photos.', errors: checked.errors }, 422)

  const { count } = await recordHit(db, counterKey('posts', session.vendorId), { windowSeconds: 3600 })
  if (count > POSTS_PER_HOUR) return json({ error: 'Too many posts this hour. Try again later.' }, 429)

  const photoErrors = await verifyPhotos(checked.cards, async (url) => {
    const info = await head(url)
    return { url: info.url, size: info.size, contentType: info.contentType }
  })
  if (photoErrors.length) return json({ error: 'Some photos need to be added again.', errors: photoErrors }, 422)

  const result = await createItems(db, session, checked.cards, { consent: body?.consent === true })
  if (!result.ok) {
    const status = result.code === 'CONSENT_REQUIRED' ? 422 : 409
    return json({ error: result.message, code: result.code, indexes: result.indexes }, status)
  }

  // Expire now, so the very next shopper sees the new items (not a stale copy).
  revalidateTag(FEED_TAG, { expire: 0 })
  return json({ ok: true, itemIds: result.itemIds })
}
