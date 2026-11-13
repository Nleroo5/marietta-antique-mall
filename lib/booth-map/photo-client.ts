/**
 * Browser-only photo preparation (SPEC section 3): HEIC to JPEG, resize so the
 * longest side is at most 1600 px, JPEG quality 0.82. Re-encoding through a canvas
 * also drops EXIF data, including GPS location.
 *
 * iPhone Safari already hands the page a JPEG because the file input only accepts
 * JPEG, PNG and WebP. The browser's own decoder is always tried first (Safari 17+
 * reads HEIC natively). The HEIC decoder (about 3 MB) loads only when that fails
 * for a file that looks like HEIC, mostly from desktop drag and drop.
 */
import { MAX_PHOTO_EDGE } from './blob'

export interface PreparedPhoto {
  blob: Blob
  width: number
  height: number
}

const JPEG_QUALITY = 0.82
const UNREADABLE = 'This photo could not be read. Try another one.'

function looksLikeHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name) || file.type === ''
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('decode failed'))
    }
    // Current browsers apply the photo's EXIF rotation to <img> and to canvas drawing.
    img.src = url
  })
}

async function decode(file: File): Promise<HTMLImageElement> {
  try {
    return await loadImage(file)
  } catch {
    if (!looksLikeHeic(file)) throw new Error(UNREADABLE)
  }
  try {
    const { heicTo } = await import('heic-to/next')
    return await loadImage(await heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 }))
  } catch {
    throw new Error(UNREADABLE)
  }
}

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  if (file.type && !file.type.startsWith('image/')) throw new Error(UNREADABLE)
  const img = await decode(file)

  const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This phone could not process the photo.')
  ctx.fillStyle = '#ffffff' // JPEG has no transparency; PNGs would otherwise turn black
  ctx.fillRect(0, 0, width, height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
  canvas.width = canvas.height = 0 // release memory on phones
  if (!blob) throw new Error('This phone could not process the photo.')
  return { blob, width, height }
}

/** crypto.randomUUID only exists on https; this works on plain-http local testing too. */
export function uuid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
