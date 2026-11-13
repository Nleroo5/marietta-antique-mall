'use client'

import { useState } from 'react'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { BUSINESS_NAME } from '@/lib/constants'

const galleryImages = [
  { src: '/images/vendors/marietta-antique-mall-vintage-store-interior-01.jpg', alt: 'Marietta Antique Mall vintage store interior' },
  { src: '/images/vendors/atlanta-vintage-finds-antique-mall-marietta-02.jpg', alt: 'Atlanta vintage finds at Marietta antique mall' },
  { src: '/images/vendors/marietta-antiques-vintage-collectibles-store-03.jpg', alt: 'Marietta antiques and vintage collectibles' },
  { src: '/images/vendors/antique-store-marietta-georgia-vintage-mall-04.jpg', alt: 'Antique store in Marietta Georgia' },
  { src: '/images/vendors/marietta-antique-mall-vintage-furniture-display-05.jpg', alt: 'Vintage furniture display at Marietta Antique Mall' },
  { src: '/images/vendors/atlanta-antique-store-marietta-vintage-treasures-06.jpg', alt: 'Atlanta antique store vintage treasures' },
  { src: '/images/vendors/vintage-finds-marietta-antique-mall-interior-07.jpg', alt: 'Vintage finds at Marietta antique mall' },
  { src: '/images/vendors/marietta-vintage-store-antique-collectibles-08.jpg', alt: 'Marietta vintage store collectibles' },
  { src: '/images/vendors/antique-mall-marietta-atlanta-vintage-store-09.jpg', alt: 'Antique mall Marietta Atlanta vintage store' },
  { src: '/images/vendors/marietta-antiques-vintage-furniture-showcase-10.jpg', alt: 'Marietta antiques vintage furniture showcase' },
  { src: '/images/vendors/atlanta-vintage-mall-marietta-antique-store-11.jpg', alt: 'Atlanta vintage mall Marietta antique store' },
  { src: '/images/vendors/marietta-antique-store-vintage-decor-display-12.jpg', alt: 'Marietta antique store vintage decor display' },
  { src: '/images/vendors/vintage-antique-mall-marietta-georgia-finds-13.jpg', alt: 'Vintage antique mall Marietta Georgia finds' },
  { src: '/images/vendors/marietta-vintage-finds-antique-store-atlanta-14.jpg', alt: 'Marietta vintage finds antique store Atlanta' },
  { src: '/images/vendors/antique-store-marietta-vintage-collectibles-mall-15.jpg', alt: 'Antique store Marietta vintage collectibles' },
  { src: '/images/vendors/marietta-antique-mall-vintage-home-decor-16.jpg', alt: 'Marietta antique mall vintage home decor' },
  { src: '/images/vendors/atlanta-marietta-antiques-vintage-store-interior-17.jpg', alt: 'Atlanta Marietta antiques vintage store interior' },
  { src: '/images/vendors/vintage-mall-marietta-antique-finds-atlanta-18.jpg', alt: 'Vintage mall Marietta antique finds Atlanta' },
  { src: '/images/vendors/marietta-antique-store-vintage-treasures-display-19.jpg', alt: 'Marietta antique store vintage treasures display' },
  { src: '/images/vendors/marietta-vintage-antiques-store-atlanta-mall-21.jpg', alt: 'Marietta vintage antiques store Atlanta mall' },
  { src: '/images/vendors/marietta-antiques-vintage-collectibles-display-23.jpg', alt: 'Marietta antiques vintage collectibles display' },
  { src: '/images/vendors/vintage-finds-antique-store-marietta-atlanta-24.jpg', alt: 'Vintage finds antique store Marietta Atlanta' },
  { src: '/images/vendors/marietta-antique-mall-vintage-decor-treasures-25.jpg', alt: 'Marietta antique mall vintage decor treasures' },
  { src: '/images/vendors/atlanta-vintage-store-marietta-antique-mall-26.jpg', alt: 'Atlanta vintage store Marietta antique mall' },
  { src: '/images/vendors/marietta-antique-store-vintage-finds-interior-27.jpg', alt: 'Marietta antique store vintage finds interior' },
  { src: '/images/vendors/antique-mall-marietta-vintage-collectibles-atlanta-28.jpg', alt: 'Antique mall Marietta vintage collectibles Atlanta' },
  { src: '/images/vendors/marietta-vintage-antiques-store-showcase-29.jpg', alt: 'Marietta vintage antiques store showcase' },
  { src: '/images/vendors/atlanta-marietta-antique-mall-vintage-finds-30.jpg', alt: 'Atlanta Marietta antique mall vintage finds' },
  { src: '/images/vendors/marietta-antique-store-vintage-furniture-mall-31.jpg', alt: 'Marietta antique store vintage furniture mall' },
  { src: '/images/vendors/vintage-antique-mall-marietta-atlanta-store-32.jpg', alt: 'Vintage antique mall Marietta Atlanta store' },
  { src: '/images/vendors/marietta-antiques-vintage-store-display-atlanta-33.jpg', alt: 'Marietta antiques vintage store display Atlanta' },
  { src: '/images/vendors/antique-store-marietta-vintage-mall-treasures-34.jpg', alt: 'Antique store Marietta vintage mall treasures' },
  { src: '/images/vendors/marietta-vintage-finds-antique-store-interior-35.jpg', alt: 'Marietta vintage finds antique store interior' },
  { src: '/images/vendors/atlanta-antique-mall-marietta-vintage-decor-36.jpg', alt: 'Atlanta antique mall Marietta vintage decor' },
  { src: '/images/vendors/marietta-antique-store-vintage-collectibles-finds-37.jpg', alt: 'Marietta antique store vintage collectibles finds' },
  { src: '/images/vendors/vintage-mall-marietta-antiques-atlanta-store-38.jpg', alt: 'Vintage mall Marietta antiques Atlanta store' },
]

export default function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  const openLightbox = (index: number) => {
    setSelectedImage(index)
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  const goToPrevious = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === 0 ? galleryImages.length - 1 : selectedImage - 1)
    }
  }

  const goToNext = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === galleryImages.length - 1 ? 0 : selectedImage + 1)
    }
  }

  const handleShopNowClick = () => {
    // Track Google Analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'click', {
        event_category: 'Facebook Marketplace',
        event_label: 'Gallery Page CTA',
        value: 1,
      })
    }

    // Track Meta Pixel conversion event
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_name: 'Shop Facebook Marketplace CTA',
        content_category: 'Gallery Page',
        value: 0,
        currency: 'USD'
      })
    }

    window.location.href = '/shop'
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-light/50 to-white py-16 md:py-24">
        <style jsx global>{`
          @keyframes shimmer {
            0% {
              background-position: -200% center;
            }
            100% {
              background-position: 200% center;
            }
          }
          .shimmer-text {
            background: linear-gradient(
              90deg,
              rgba(0, 0, 0, 1) 0%,
              rgba(0, 0, 0, 1) 40%,
              rgba(239, 195, 147, 1) 50%,
              rgba(0, 0, 0, 1) 60%,
              rgba(0, 0, 0, 1) 100%
            );
            background-size: 200% auto;
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shimmer 4s linear infinite;
          }
        `}</style>
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="shimmer-text font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Gallery
            </h1>
            <p className="text-xl text-black">
              Explore our treasure trove of antiques, vintage finds, and collectibles
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg cursor-pointer group border-2 border-slate hover:border-mauve transition-all duration-300 hover:shadow-xl p-2"
                onClick={() => openLightbox(index)}
              >
                <div className="relative w-full h-full rounded-md overflow-hidden">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    priority={index < 4}
                    quality={75}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-black italic">
              Items pictured may no longer be available.
            </p>
          </div>
        </div>
      </section>

      {/* Shop Online CTA */}
      <section className="section-padding bg-gradient-to-b from-white to-slate-light/50">
        <div className="container-custom">
          <Card className="!border-2 !border-mauve max-w-3xl mx-auto text-center !p-8 md:!p-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-black mb-4">
              Want to Buy Something You See?
            </h2>
            <p className="text-lg text-black mb-8 max-w-2xl mx-auto">
              Many of our vendors sell items online through our Facebook Marketplace Group. Browse hundreds of available items with photos, prices, and descriptions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                size="lg"
                onClick={handleShopNowClick}
                className="w-full sm:w-auto sm:min-w-[300px]"
              >
                Shop Our Facebook Marketplace
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Lightbox */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-white hover:text-accent transition-colors z-50"
            onClick={closeLightbox}
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous Button */}
          <button
            className="absolute left-4 text-white hover:text-accent transition-colors z-50"
            onClick={(e) => {
              e.stopPropagation()
              goToPrevious()
            }}
            aria-label="Previous"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Image */}
          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={galleryImages[selectedImage].src}
              alt={galleryImages[selectedImage].alt}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Next Button */}
          <button
            className="absolute right-4 text-white hover:text-accent transition-colors z-50"
            onClick={(e) => {
              e.stopPropagation()
              goToNext()
            }}
            aria-label="Next"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
            {selectedImage + 1} / {galleryImages.length}
          </div>
        </div>
      )}
    </main>
  )
}
