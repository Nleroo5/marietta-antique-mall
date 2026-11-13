import { ipAddress } from '@vercel/functions'
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

/** The client's IP. On Vercel the platform sets this header and clients can't spoof it. */
export function clientIp(req: Request): string {
  return ipAddress(req) || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

/**
 * Write requests must come from this site. The cookie is SameSite=Lax, which already
 * stops cross-site POSTs from carrying it; this is a second check. Compares with the
 * Host header so it also works when testing from a phone on the local network.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')
  if (!origin || !host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

/** Secure cookies everywhere except plain-http local development. */
export function cookieIsSecure(req: NextRequest): boolean {
  return process.env.NODE_ENV !== 'development' || req.nextUrl.protocol === 'https:'
}
