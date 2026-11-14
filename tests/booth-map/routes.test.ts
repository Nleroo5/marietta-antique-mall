/**
 * Route handlers end to end, with the real migration on PGlite in place of Neon
 * and @vercel/blob's head() stubbed. The upload route runs the real handleUpload,
 * which signs client tokens locally (no network).
 */
import { PGlite } from '@electric-sql/pglite'
import { eq } from 'drizzle-orm'
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { NextRequest } from 'next/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import * as schema from '@/lib/booth-map/schema'
import { generateToken, hashToken } from '@/lib/booth-map/tokens'

const h = vi.hoisted(() => ({ db: null as unknown, head: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('@/lib/booth-map/db', () => ({ getDb: () => h.db }))
vi.mock('@vercel/blob', () => ({ head: h.head }))
vi.mock('next/cache', () => ({ revalidateTag: h.revalidateTag }))

import { GET as openLink, HEAD as headLink } from '@/app/(booth)/v/[token]/route'
import { POST as postItems } from '@/app/api/booth-map/items/route'
import { POST as uploadToken } from '@/app/api/booth-map/upload/route'
import { GET as sessionCheck } from '@/app/api/booth-map/session/route'
import { getPayloadFromClientToken } from '@vercel/blob/client'

const SITE = 'https://booths.test'
const STORE = 'abc123.public.blob.vercel-storage.com'
let db: PgliteDatabase<typeof schema>
let n = 0

function req(path: string, init: { method?: string; cookie?: string; origin?: string | null; body?: unknown; ip?: string } = {}) {
  const headers: Record<string, string> = { host: 'booths.test', 'x-forwarded-for': init.ip ?? '198.51.100.7' }
  if (init.origin !== null) headers.origin = init.origin ?? SITE
  if (init.cookie) headers.cookie = `mam_vendor=${init.cookie}`
  if (init.body !== undefined) headers['content-type'] = 'application/json'
  return new NextRequest(`${SITE}${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
}

async function vendorWithLink(booths = [`R${++n}`]) {
  const token = generateToken()
  const [v] = await db.insert(schema.vendors).values({ name: `R${n}`, displayName: `Route ${n}`, tokenHash: hashToken(token) }).returning()
  await db.insert(schema.booths).values(booths.map((number) => ({ number, vendorId: v.id })))
  return { vendor: v, token }
}

async function signIn(token: string, ip?: string) {
  const res = await openLink(req(`/v/${token}`, { ip }), { params: Promise.resolve({ token }) })
  const cookie = res.cookies.get('mam_vendor')?.value
  return { res, cookie }
}

beforeAll(async () => {
  process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_abc123_testsecretvalue'
  db = drizzle(new PGlite(), { schema })
  await migrate(db, { migrationsFolder: './drizzle/booth-map' })
  h.db = db
})

beforeEach(() => {
  h.head.mockReset()
  h.revalidateTag.mockReset()
  h.head.mockImplementation(async (url: string) => ({ url, size: 200_000, contentType: 'image/jpeg' }))
})

describe('GET /v/[token]', () => {
  it('redirects to /vendor with a long-lived, HttpOnly, Secure, Lax cookie and private headers', async () => {
    const { token } = await vendorWithLink()
    const { res, cookie } = await signIn(token)
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(`${SITE}/vendor`)
    expect(cookie).toMatch(/^[A-Za-z0-9_-]{43}$/)
    const set = res.headers.get('set-cookie') ?? ''
    expect(set).toMatch(/HttpOnly/i)
    expect(set).toMatch(/Secure/i)
    expect(set).toMatch(/SameSite=lax/i)
    expect(set).toMatch(/Max-Age=31536000/)
    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(res.headers.get('referrer-policy')).toBe('no-referrer')
    expect(res.headers.get('cache-control')).toMatch(/no-store/)
    expect(set).not.toContain(token)
  })

  it('a HEAD request signs nothing in', async () => {
    const { vendor } = await vendorWithLink()
    const res = headLink()
    expect(res.status).toBe(200)
    expect(res.headers.get('set-cookie')).toBeNull()
    expect(await db.select().from(schema.vendorDevices).where(eq(schema.vendorDevices.vendorId, vendor.id))).toHaveLength(0)
  })

  it('wrong links get 404, then 429 after 10 from one IP, while a valid card from that IP still works', async () => {
    const ip = '203.0.113.50'
    for (let i = 1; i <= 9; i++) {
      const bad = generateToken()
      const res = await openLink(req(`/v/${bad}`, { ip }), { params: Promise.resolve({ token: bad }) })
      expect(res.status).toBe(404)
    }
    const tenth = generateToken()
    expect((await openLink(req(`/v/${tenth}`, { ip }), { params: Promise.resolve({ token: tenth }) })).status).toBe(429)
    const another = generateToken()
    expect((await openLink(req(`/v/${another}`, { ip }), { params: Promise.resolve({ token: another }) })).status).toBe(429)
    const { token } = await vendorWithLink()
    expect((await signIn(token, ip)).res.status).toBe(303)
  })
})

describe('session check', () => {
  it('is 200 with a valid cookie and 401 without', async () => {
    const { token } = await vendorWithLink()
    const { cookie } = await signIn(token)
    expect((await sessionCheck(req('/api/booth-map/session', { cookie }))).status).toBe(200)
    expect((await sessionCheck(req('/api/booth-map/session'))).status).toBe(401)
  })
})

describe('POST /api/booth-map/upload', () => {
  const tokenBody = (pathname: unknown, extra: Record<string, unknown> = {}) => ({
    type: 'blob.generate-client-token',
    payload: { pathname, clientPayload: null, multipart: false, ...extra },
  })

  it('needs the same origin and a signed-in vendor', async () => {
    const { token, vendor } = await vendorWithLink()
    const { cookie } = await signIn(token)
    const body = tokenBody(`booth-map/${vendor.id}/${crypto.randomUUID()}.jpg`)
    expect((await uploadToken(req('/api/booth-map/upload', { method: 'POST', body, cookie, origin: 'https://evil.test' }))).status).toBe(403)
    expect((await uploadToken(req('/api/booth-map/upload', { method: 'POST', body, cookie, origin: null }))).status).toBe(403)
    expect((await uploadToken(req('/api/booth-map/upload', { method: 'POST', body }))).status).toBe(401)
  })

  it('issues a one-file token for the vendor’s own folder: JPEG only, 5 MB, no suffix, no overwrite, 2 minutes', async () => {
    const { token, vendor } = await vendorWithLink()
    const { cookie } = await signIn(token)
    const pathname = `booth-map/${vendor.id}/${crypto.randomUUID()}.jpg`
    const res = await uploadToken(req('/api/booth-map/upload', { method: 'POST', body: tokenBody(pathname), cookie }))
    expect(res.status).toBe(200)
    const { clientToken } = await res.json()
    const p = getPayloadFromClientToken(clientToken)
    expect(p).toMatchObject({ pathname, allowedContentTypes: ['image/jpeg'], maximumSizeInBytes: 5 * 1024 * 1024, addRandomSuffix: false })
    expect(p.allowOverwrite ?? false).toBe(false)
    expect(p.validUntil - Date.now()).toBeLessThanOrEqual(2 * 60 * 1000)
  })

  it('refuses other folders, other file types, multipart and other request types', async () => {
    const { token, vendor } = await vendorWithLink()
    const { cookie } = await signIn(token)
    const send = (body: unknown) => uploadToken(req('/api/booth-map/upload', { method: 'POST', body, cookie }))
    expect((await send(tokenBody(`booth-map/${crypto.randomUUID()}/${crypto.randomUUID()}.jpg`))).status).toBe(400)
    expect((await send(tokenBody(`booth-map/${vendor.id}/${crypto.randomUUID()}.png`))).status).toBe(400)
    expect((await send(tokenBody([`booth-map/${vendor.id}/${crypto.randomUUID()}.jpg`]))).status).toBe(400)
    expect((await send(tokenBody(`booth-map/${vendor.id}/${crypto.randomUUID()}.jpg`, { multipart: true }))).status).toBe(400)
    expect((await send({ type: 'blob.upload-completed', payload: {} })).status).toBe(400)
    const bad = await send(tokenBody('../../etc/passwd'))
    expect((await bad.json()).error).toBe('That upload is not allowed.') // fixed message, no internals
  })
})

describe('POST /api/booth-map/items', () => {
  const url = (vendorId: string) => `https://${STORE}/booth-map/${vendorId}/${crypto.randomUUID()}.jpg`
  const card = (vendorId: string, over: Record<string, unknown> = {}) => ({
    url: url(vendorId),
    width: 1600,
    height: 1200,
    title: 'Brass lamp',
    price: '45',
    askInStore: false,
    ...over,
  })

  it('posts live items, and a repeat of the same post is a 409, not duplicates', async () => {
    const { token, vendor } = await vendorWithLink()
    const { cookie } = await signIn(token)
    const body = { consent: true, items: [card(vendor.id), card(vendor.id, { askInStore: true, price: null })] }
    const res = await postItems(req('/api/booth-map/items', { method: 'POST', body, cookie }))
    expect(res.status).toBe(200)
    expect((await res.json()).itemIds).toHaveLength(2)
    // The feed cache is expired right away, so the next shopper sees the new items.
    expect(h.revalidateTag).toHaveBeenCalledTimes(1)
    expect(h.revalidateTag).toHaveBeenCalledWith('booth-map-feed', { expire: 0 })
    const again = await postItems(req('/api/booth-map/items', { method: 'POST', body, cookie }))
    expect(again.status).toBe(409)
    expect(h.revalidateTag).toHaveBeenCalledTimes(1) // a rejected post doesn't touch the cache
    expect(await again.json()).toMatchObject({ code: 'ALREADY_POSTED', indexes: [0, 1] })
  })

  it('first post without consent is a 422 with a code the page acts on', async () => {
    const { token, vendor } = await vendorWithLink()
    const { cookie } = await signIn(token)
    const res = await postItems(req('/api/booth-map/items', { method: 'POST', body: { items: [card(vendor.id)] }, cookie }))
    expect(res.status).toBe(422)
    expect((await res.json()).code).toBe('CONSENT_REQUIRED')
  })

  it('rejects photos from another store or another vendor, and photos that are not what Blob reports', async () => {
    const a = await vendorWithLink()
    const b = await vendorWithLink()
    const { cookie } = await signIn(a.token)
    const post = (items: unknown[]) => postItems(req('/api/booth-map/items', { method: 'POST', body: { consent: true, items }, cookie }))
    expect((await post([card(a.vendor.id, { url: url(a.vendor.id).replace('abc123', 'otherstore') })])).status).toBe(422)
    expect((await post([card(a.vendor.id, { url: url(b.vendor.id) })])).status).toBe(422)
    h.head.mockImplementationOnce(async () => ({ url: 'https://elsewhere.test/x.jpg', size: 1, contentType: 'image/jpeg' }))
    expect((await post([card(a.vendor.id)])).status).toBe(422)
    h.head.mockImplementationOnce(async () => {
      throw new Error('BlobNotFoundError')
    })
    expect((await post([card(a.vendor.id)])).status).toBe(422)
  })

  it('needs the same origin and a signed-in vendor', async () => {
    const { token, vendor } = await vendorWithLink()
    const { cookie } = await signIn(token)
    const body = { consent: true, items: [card(vendor.id)] }
    expect((await postItems(req('/api/booth-map/items', { method: 'POST', body, cookie, origin: 'https://evil.test' }))).status).toBe(403)
    expect((await postItems(req('/api/booth-map/items', { method: 'POST', body }))).status).toBe(401)
  })
})
