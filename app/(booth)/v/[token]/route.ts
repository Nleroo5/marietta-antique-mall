import { NextResponse, type NextRequest } from 'next/server'
import { getDb } from '@/lib/booth-map/db'
import { openVendorLink, VENDOR_COOKIE, VENDOR_COOKIE_MAX_AGE } from '@/lib/booth-map/access'
import { counterKey, isBlocked, recordHit } from '@/lib/booth-map/rate-limit'
import { clientIp, cookieIsSecure, withPrivateHeaders } from '@/lib/booth-map/http'

/**
 * A vendor's private link (sent to them by text). Swaps the token for a cookie and
 * redirects to /vendor, so the token never stays in the address bar (SPEC 9).
 *
 * Rate limits, per IP, stored in the database:
 * - Wrong links: 10 in 15 minutes blocks wrong links from that IP for an hour. A
 *   valid link still works from a blocked IP, so one person trying old links on
 *   the mall wifi can't lock every vendor out.
 * - New phones signed in: 30 an hour, so one link can't create devices without end.
 *
 * Note: the token is part of the request path, so it appears in Vercel's request
 * logs and the browser's history entry for the redirect.
 */
export const dynamic = 'force-dynamic'

const BAD_LINKS_WINDOW = 15 * 60
const BAD_LINKS_LIMIT = 10
const BLOCK_SECONDS = 60 * 60
const NEW_DEVICES_PER_HOUR = 30

function problemPage(status: 404 | 429): NextResponse {
  const line =
    status === 429
      ? 'Too many tries from this connection. Wait an hour, or ask at the front desk.'
      : "This link doesn't work. Ask at the front desk for a new link."
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Vendor page</title></head><body style="margin:0;font:17px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F7F0E8;color:#2C2416;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;text-align:center"><div style="max-width:420px"><p style="font-size:20px;font-weight:600;margin:0 0 8px">Marietta Antique Mall</p><p style="margin:0">${line}</p></div></body></html>`
  return withPrivateHeaders(new NextResponse(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }))
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const db = getDb()
  const ip = clientIp(req)
  const badKey = counterKey('vendor-link-bad-ip', ip)

  const result = await openVendorLink(db, token, req.cookies.get(VENDOR_COOKIE)?.value)

  if (!result.ok) {
    if (await isBlocked(db, badKey)) return problemPage(429)
    // A paused or removed vendor's real link is not a guessing attempt.
    if (result.reason !== 'inactive') {
      const hit = await recordHit(db, badKey, { windowSeconds: BAD_LINKS_WINDOW, blockAt: BAD_LINKS_LIMIT, blockSeconds: BLOCK_SECONDS })
      if (hit.blocked) return problemPage(429)
    }
    return problemPage(404)
  }

  if (result.created) {
    const { count } = await recordHit(db, counterKey('vendor-link-new-device-ip', ip), { windowSeconds: 3600 })
    if (count > NEW_DEVICES_PER_HOUR) return problemPage(429)
  }

  const res = NextResponse.redirect(new URL('/vendor', req.url), 303)
  res.cookies.set(VENDOR_COOKIE, result.cookie, {
    httpOnly: true,
    secure: cookieIsSecure(req),
    sameSite: 'lax',
    path: '/',
    maxAge: VENDOR_COOKIE_MAX_AGE,
  })
  return withPrivateHeaders(res)
}

/** HEAD requests (link checkers, previews) must not sign in a device. */
export function HEAD() {
  return withPrivateHeaders(new NextResponse(null, { status: 200 }))
}
