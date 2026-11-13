import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/booth-map/db'
import { resolveSession, VENDOR_COOKIE } from '@/lib/booth-map/access'
import { registerUpload } from '@/lib/booth-map/items'
import { isSameOrigin, json } from '@/lib/booth-map/http'

/**
 * The browser reports each finished upload here, before the item is posted, so
 * photos from cards that are never posted can still be found and deleted later.
 */
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return json({ error: 'This request came from somewhere else.' }, 403)
  const db = getDb()
  const session = await resolveSession(db, req.cookies.get(VENDOR_COOKIE)?.value)
  if (!session) return json({ error: 'Your vendor link has expired. Scan your card again.' }, 401)

  const body = (await req.json().catch(() => null)) as { url?: unknown } | null
  const url = typeof body?.url === 'string' ? body.url : ''
  if (!(await registerUpload(db, session, url))) return json({ error: 'Bad request.' }, 400)
  return json({ ok: true })
}
