import type { NextRequest } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getDb } from '@/lib/booth-map/db'
import { resolveSession, VENDOR_COOKIE } from '@/lib/booth-map/access'
import { isAllowedUploadPathname, MAX_PHOTO_BYTES, PHOTO_CONTENT_TYPE } from '@/lib/booth-map/blob'
import { counterKey, recordHit } from '@/lib/booth-map/rate-limit'
import { isSameOrigin, json } from '@/lib/booth-map/http'

/**
 * Issues a short-lived Blob upload token. The photo itself goes from the vendor's
 * browser straight to Blob and never passes through this function (SPEC rule 1).
 * Tokens are only for: a signed-in vendor, their own folder, JPEG, 5 MB or less.
 * No random suffix and no overwrite, so one token can create exactly one file and
 * the hourly cap counts real uploads.
 */
export const dynamic = 'force-dynamic'

const UPLOADS_PER_HOUR = 120
const NOT_ALLOWED = 'That upload is not allowed.'
const TOO_MANY = 'Too many photos this hour. Try again later.'

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return json({ error: 'This request came from somewhere else.' }, 403)
  if (!process.env.BLOB_READ_WRITE_TOKEN) return json({ error: 'Photo uploads are not set up yet.' }, 503)

  const db = getDb()
  const session = await resolveSession(db, req.cookies.get(VENDOR_COOKIE)?.value)
  if (!session) return json({ error: 'Your vendor link has expired. Scan your card again.' }, 401)

  let body: HandleUploadBody
  try {
    body = (await req.json()) as HandleUploadBody
  } catch {
    return json({ error: 'Bad request.' }, 400)
  }
  // Only token requests. Upload-completed callbacks are not used: the browser
  // reports finished uploads itself (/api/booth-map/uploads).
  if (body?.type !== 'blob.generate-client-token') return json({ error: 'Bad request.' }, 400)

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, _clientPayload, multipart) => {
        if (multipart || !isAllowedUploadPathname(pathname, session.vendorId)) throw new Error(NOT_ALLOWED)
        const { count } = await recordHit(db, counterKey('uploads', session.vendorId), { windowSeconds: 3600 })
        if (count > UPLOADS_PER_HOUR) throw new Error(TOO_MANY)
        return {
          allowedContentTypes: [PHOTO_CONTENT_TYPE],
          maximumSizeInBytes: MAX_PHOTO_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
          validUntil: Date.now() + 2 * 60 * 1000,
        }
      },
    })
    return json(result)
  } catch (err) {
    // Only our own messages reach the browser; anything else is logged, not shown.
    const message = err instanceof Error && (err.message === NOT_ALLOWED || err.message === TOO_MANY) ? err.message : null
    if (!message) console.error('booth-map upload token failed', err)
    return json({ error: message ?? 'Upload failed. Try again.' }, message === TOO_MANY ? 429 : 400)
  }
}
