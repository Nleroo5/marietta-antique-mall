/**
 * Photo storage rules (SPEC sections 2 and 9). Photos go from the vendor's browser
 * straight to Vercel Blob; no photo passes through a server function. The server
 * only issues upload tokens and checks the result.
 */
export const PHOTO_CONTENT_TYPE = 'image/jpeg'
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const MAX_PHOTO_EDGE = 1600
export const MAX_ITEMS_PER_POST = 10

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

/**
 * The public host of this site's own Blob store, from the read-write token
 * (vercel_blob_rw_<storeId>_<secret>), the same way @vercel/blob builds URLs.
 * Only this exact host is accepted: a URL in any other Blob store is rejected.
 */
export function blobStoreHost(token: string | undefined = process.env.BLOB_READ_WRITE_TOKEN): string | null {
  const storeId = token?.split('_')[3]
  return storeId ? `${storeId.toLowerCase()}.public.blob.vercel-storage.com` : null
}

export function vendorPhotoPrefix(vendorId: string): string {
  return `booth-map/${vendorId}/`
}

/**
 * The only pathname a vendor's browser may upload to: booth-map/<vendorId>/<uuid>.jpg.
 * Uploads use no random suffix and can't overwrite, so one token creates one file.
 */
export function isAllowedUploadPathname(pathname: unknown, vendorId: string): boolean {
  return typeof pathname === 'string' && new RegExp(`^booth-map/${vendorId}/${UUID}\\.jpg$`).test(pathname)
}

/** True when `url` is exactly https://<our store>/booth-map/<vendorId>/<uuid>.jpg. */
export function isVendorBlobUrl(url: string, vendorId: string, storeHost: string | null = blobStoreHost()): boolean {
  if (!storeHost) return false
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return false
  }
  if (u.protocol !== 'https:' || u.hostname !== storeHost || u.port || u.search || u.hash || u.username || u.password) {
    return false
  }
  return new RegExp(`^/booth-map/${vendorId}/${UUID}\\.jpg$`).test(u.pathname)
}
