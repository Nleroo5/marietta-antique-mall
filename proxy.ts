import { NextResponse } from 'next/server'
import { PRIVATE_HEADERS } from '@/lib/booth-map/http'

/**
 * Next.js 16 proxy (formerly middleware). Runs only on booth map vendor and admin
 * routes and adds the SPEC section 9 headers: never index, never send a Referer,
 * never cache. The public site is untouched (see `config.matcher`).
 */
export function proxy() {
  const res = NextResponse.next()
  for (const [k, v] of Object.entries(PRIVATE_HEADERS)) res.headers.set(k, v)
  return res
}

export const config = {
  matcher: ['/v/:path*', '/vendor', '/vendor/:path*', '/admin', '/admin/:path*', '/api/booth-map/:path*'],
}
