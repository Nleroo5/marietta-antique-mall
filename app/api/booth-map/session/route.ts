import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/booth-map/db'
import { resolveSession, VENDOR_COOKIE } from '@/lib/booth-map/access'
import { json } from '@/lib/booth-map/http'

/** Lets the vendor page tell "your link was reset" apart from a network problem when an upload fails. */
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await resolveSession(getDb(), req.cookies.get(VENDOR_COOKIE)?.value)
  return session ? json({ ok: true }) : json({ error: 'Your vendor link has expired. Scan your card again.' }, 401)
}
