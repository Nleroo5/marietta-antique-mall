import { NextResponse, type NextRequest } from 'next/server'
import { getDb } from '@/lib/booth-map/db'
import { openVendorLink, VENDOR_COOKIE, VENDOR_COOKIE_MAX_AGE } from '@/lib/booth-map/access'
import { counterKey, isBlocked, recordHit } from '@/lib/booth-map/rate-limit'
import { clientIp, cookieIsSecure, withPrivateHeaders } from '@/lib/booth-map/http'

/**
 * A vendor's private link (printed as a QR code). Swaps the token for a cookie and
 * redirects to /vendor, so the token never stays in the address bar (SPEC 9).
 * Wrong links are counted per IP in the database; 10 in 15 minutes blocks that
 * address for an hour.
 */
export const dynamic = 'force-dynamic'

const BAD_LINKS_WINDOW = 15 * 60
const BAD_LINKS_LIMIT = 10
const BLOCK_SECONDS = 60 * 60

function problemPage(status: 404 | 429): NextResponse {
  const line =
    status === 429
      ? 'Too many tries from this connection. Wait an hour, or ask at the front desk.'
      : "This link doesn't work. Ask at the front desk for a new vendor card."
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Vendor page</title></head><body style="margin:0;font:17px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F7F0E8;color:#2C2416;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;text-align:center"><div style="max-width:420px"><p style="font-size:20px;font-weight:600;margin:0 0 8px">Marietta Antique Mall</p><p style="margin:0">${line}</p></div></body></html>`
  return withPrivateHeaders(new NextResponse(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }))
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const db = getDb()
  const ipKey = counterKey('vendor-link-ip', clientIp(req))

  if (await isBlocked(db, ipKey)) return problemPage(429)

  const result = await openVendorLink(db, token, req.cookies.get(VENDOR_COOKIE)?.value)
  if (!result.ok) {
    // A paused or removed vendor's real link is not a guessing attempt.
    if (result.reason !== 'inactive') {
      const hit = await recordHit(db, ipKey, { windowSeconds: BAD_LINKS_WINDOW, blockAt: BAD_LINKS_LIMIT, blockSeconds: BLOCK_SECONDS })
      if (hit.blocked) return problemPage(429)
    }
    return problemPage(404)
  }

  const res = NextResponse.redirect(new URL('/vendor', req.url), 303)
  if (result.newCookie) {
    res.cookies.set(VENDOR_COOKIE, result.newCookie, {
      httpOnly: true,
      secure: cookieIsSecure(req),
      sameSite: 'lax',
      path: '/',
      maxAge: VENDOR_COOKIE_MAX_AGE,
    })
  }
  return withPrivateHeaders(res)
}
