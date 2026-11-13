import type { NextConfig } from 'next'

const blobStoreId = process.env.BLOB_READ_WRITE_TOKEN?.split('_')[3]

const nextConfig: NextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'scontent.facebook.com',
      },
      {
        protocol: 'https',
        hostname: 'scontent.xx.fbcdn.net',
      },
      // Booth map vendor photos: only this site's own Vercel Blob store, never any
      // other store (the host comes from the store id in BLOB_READ_WRITE_TOKEN).
      ...(blobStoreId
        ? [{ protocol: 'https' as const, hostname: `${blobStoreId.toLowerCase()}.public.blob.vercel-storage.com` }]
        : []),
    ],
  },
  // Enable React strict mode
  reactStrictMode: true,
}

export default nextConfig
