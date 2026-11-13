import { NextResponse, type NextRequest } from 'next/server'

/** Headers for every vendor and admin response (SPEC section 9). */
export const PRIVATE_HEADERS: Record<string, string> = {
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store, max-age=0',
}

export function withPrivateHeaders<T extends Response>(res: T): T {
  for (const [k, v] of Object.entries(PRIVATE_HEADERS)) res.headers.set(k, v)
  return res
}

export function json(body: unknown, status = 200): NextResponse {
  return withPrivateHeaders(NextResponse.json(body, { status }))
}

/** Best-effort client IP. Vercel sets x-forwarded-for; the first entry is the client. */
export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
}

/**
 * Write requests must come from this site. The cookie is SameSite=Lax, which already
 * stops cross-site POSTs from carrying it; this is a second check.
 */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).host === req.nextUrl.host
  } catch {
    return false
  }
}

/** Secure cookies everywhere except plain-http localhost during development. */
export function cookieIsSecure(req: NextRequest): boolean {
  return req.nextUrl.protocol === 'https:'
}
