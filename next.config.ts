import type { NextConfig } from 'next'

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
      {
        // Booth map vendor photos (Vercel Blob public store)
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  // Enable React strict mode
  reactStrictMode: true,
}

export default nextConfig
