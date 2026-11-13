/**
 * Browser-only photo preparation (SPEC section 3): HEIC to JPEG, resize so the
 * longest side is at most 1600 px, JPEG quality 0.82. Re-encoding through a canvas
 * also drops EXIF data, including GPS location.
 *
 * iPhone Safari already hands the page a JPEG because the file input only accepts
 * JPEG, PNG and WebP. The HEIC decoder (about 3 MB) loads only if a HEIC file still
 * arrives, mostly from desktop drag and drop.
 */
import { MAX_PHOTO_EDGE } from './blob'

export interface PreparedPhoto {
  blob: Blob
  width: number
  height: number
}

const JPEG_QUALITY = 0.82

function looksLikeHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
}

async function heicToJpeg(file: Blob): Promise<Blob> {
  const { heicTo } = await import('heic-to/next')
  return heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 })
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
    // Modern browsers apply the photo's EXIF rotation to <img> and to canvas drawing.
    img.src = url
  })
}

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  let source: Blob = file
  if (looksLikeHeic(file)) source = await heicToJpeg(file)

  let img: HTMLImageElement
  try {
    img = await loadImage(source)
  } catch {
    // Some files arrive as HEIC with a missing or wrong type.
    if (source !== file) throw new Error('This photo could not be read. Try another one.')
    try {
      img = await loadImage(await heicToJpeg(file))
    } catch {
      throw new Error('This photo could not be read. Try another one.')
    }
  }

  const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This phone could not process the photo.')
  ctx.drawImage(img, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
  canvas.width = canvas.height = 0 // release memory on phones
  if (!blob) throw new Error('This phone could not process the photo.')
  return { blob, width, height }
}
