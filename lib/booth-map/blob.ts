/**
 * Photo storage rules (SPEC sections 2 and 9). Photos go from the vendor's browser
 * straight to Vercel Blob; no photo passes through a server function. The server
 * only issues upload tokens and checks the result.
 */
export const PHOTO_CONTENT_TYPE = 'image/jpeg'
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const MAX_PHOTO_EDGE = 1600
export const MAX_ITEMS_PER_POST = 10

const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com'
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

export function vendorPhotoPrefix(vendorId: string): string {
  return `booth-map/${vendorId}/`
}

/** The pathname a vendor's browser may ask to upload to: booth-map/<vendorId>/<uuid>.jpg */
export function isAllowedUploadPathname(pathname: string, vendorId: string): boolean {
  return new RegExp(`^booth-map/${vendorId}/${UUID}\\.jpg$`).test(pathname)
}

/**
 * True when `url` is a public Blob URL inside this vendor's folder. Blob adds a
 * random suffix, so the stored name is <uuid>-<suffix>.jpg. The store itself is
 * confirmed separately with head(), which only finds blobs in our own store.
 */
export function isVendorBlobUrl(url: string, vendorId: string): boolean {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return false
  }
  if (u.protocol !== 'https:' || !u.hostname.endsWith(BLOB_HOST_SUFFIX) || u.search || u.hash || u.username || u.password) {
    return false
  }
  return new RegExp(`^/booth-map/${vendorId}/${UUID}(-[A-Za-z0-9]+)?\\.jpg$`).test(u.pathname)
}
