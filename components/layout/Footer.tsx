'use client'

import Link from 'next/link'
import AntiquePartnerBadge from '@/components/shared/AntiquePartnerBadge'
import Image from 'next/image'
import {
  BUSINESS_NAME,
  LOCATION,
  CONTACT_INFO,
  BUSINESS_HOURS,
  CATEGORIES,
} from '@/lib/constants'
import { formatPhoneLink, getGoogleMapsUrl } from '@/lib/utils'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const mapUrl = getGoogleMapsUrl(LOCATION.address, LOCATION.city, LOCATION.state, LOCATION.zip)

  return (
    <footer className="bg-secondary text-black">
      {/* Main Footer Content */}
      <div className="container-custom py-12">
        {/* Mobile: Logo & Social - Full Width */}
        <div className="text-center mb-8 pb-6 border-b border-black/10 lg:hidden">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Image
              src="/images/new-logo.png"
              alt={BUSINESS_NAME}
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <h3 className="font-display text-base font-bold text-black">
              {BUSINESS_NAME}
            </h3>
          </div>
          <div className="flex gap-3 justify-center">
            <a
              href={CONTACT_INFO.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:text-[#1877F2] hover:scale-110 transition-all"
              aria-label="Facebook"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            {CONTACT_INFO.instagram && (
              <a
                href={CONTACT_INFO.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:text-[#E4405F] hover:scale-110 transition-all"
                aria-label="Instagram"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Desktop: 4 Column Grid / Mobile: 3 Column Compact */}
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
          {/* Column 1: Hours - Desktop: About Section */}
          <div>
            {/* Desktop Only: Logo & About */}
            <div className="hidden lg:block">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/images/new-logo.png"
                  alt={BUSINESS_NAME}
                  width={50}
                  height={50}
                  className="w-12 h-12"
                />
                <h3 className="font-display text-lg md:text-xl font-bold text-black">
                  {BUSINESS_NAME}
                </h3>
              </div>
              <p className="text-black mb-4">
                Discover 30,000 sq ft of unique antiques, vintage treasures, and collectibles from
                100+ vendors in the heart of Marietta, GA.
              </p>
              <div className="flex gap-3">
                <a
                  href={CONTACT_INFO.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:text-[#1877F2] hover:scale-110 transition-all"
                  aria-label="Facebook"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                {CONTACT_INFO.instagram && (
                  <a
                    href={CONTACT_INFO.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:text-[#E4405F] hover:scale-110 transition-all"
                    aria-label="Instagram"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* Mobile: Hours */}
            <div className="lg:hidden">
              <h4 className="font-display text-xs font-bold mb-2 text-black">Hours</h4>
              <div className="space-y-1 text-xs leading-tight text-black">
                <p className="font-semibold">M-Th</p>
                <p>10-6</p>
                <p className="font-semibold mt-1">Fri-Sat</p>
                <p>10-7</p>
                <p className="font-semibold mt-1">Sun</p>
                <p>12-6</p>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links - Desktop: Hours Section */}
          <div>
            {/* Desktop: Hours */}
            <div className="hidden lg:block">
              <h4 className="font-display text-lg font-bold mb-4 text-black">Hours</h4>
              <ul className="space-y-2 text-black">
                {BUSINESS_HOURS.map((hours) => (
                  <li key={hours.day} className="flex justify-between text-sm">
                    <span className="font-medium">{hours.day}:</span>
                    <span>
                      {hours.open} - {hours.close}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mobile: Links */}
            <div className="lg:hidden">
              <h4 className="font-display text-xs font-bold mb-2 text-black">Links</h4>
              <ul className="space-y-1 text-xs text-black">
                <li>
                  <Link href="/shop" className="hover:text-[#cd7f32] hover:underline transition-colors">
                    Shop
                  </Link>
                </li>
                <li>
                  <Link href="/vendors" className="hover:text-[#cd7f32] hover:underline transition-colors">
                    Vendors
                  </Link>
                </li>
                <li>
                  <Link href="/sell" className="hover:text-[#cd7f32] hover:underline transition-colors">
                    Sell or Donate
                  </Link>
                </li>
                <li>
                  <Link href="/visit" className="hover:text-[#cd7f32] hover:underline transition-colors">
                    Visit
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#cd7f32] hover:underline transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-[#cd7f32] hover:underline transition-colors">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 3: Info - Desktop: Quick Links */}
          <div>
            {/* Desktop: Quick Links */}
            <div className="hidden lg:block">
              <h4 className="font-display text-lg font-bold mb-4 text-black">Quick Links</h4>
              <ul className="space-y-2 text-black">
                <li>
                  <Link href="/" className="hover:text-[#cd7f32] transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/shop" className="hover:text-[#cd7f32] transition-colors">
                    Shop Online
                  </Link>
                </li>
                <li>
                  <Link href="/vendors" className="hover:text-[#cd7f32] transition-colors">
                    Our Vendors
                  </Link>
                </li>
                <li>
                  <Link href="/sell" className="hover:text-[#cd7f32] transition-colors">
                    Sell or Donate
                  </Link>
                </li>
                <li>
                  <Link href="/visit" className="hover:text-[#cd7f32] transition-colors">
                    Plan Your Visit
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#cd7f32] transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Mobile: Info */}
            <div className="lg:hidden">
              <h4 className="font-display text-xs font-bold mb-2 text-black">Info</h4>
              <ul className="space-y-1 text-xs text-black">
                <li>
                  <Link href="/terms" className="hover:text-[#cd7f32] hover:underline transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <a href="#facebook-marketplace" className="hover:text-[#1877F2] hover:underline transition-colors">
                    Facebook
                  </a>
                </li>
                <li>
                  <a href={`tel:${formatPhoneLink(CONTACT_INFO.phone)}`} className="hover:text-green-600 hover:underline transition-colors">
                    Call
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 4: Contact Info (Desktop Only) */}
          <div className="hidden lg:block">
            <h4 className="font-display text-lg font-bold mb-4 text-black">Visit Us</h4>
            <ul className="space-y-3 text-black">
              <li>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#cd7f32] transition-colors flex items-start gap-2"
                >
                  <svg
                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-sm">
                    {LOCATION.address}
                    <br />
                    {LOCATION.city}, {LOCATION.state} {LOCATION.zip}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${formatPhoneLink(CONTACT_INFO.phone)}`}
                  className="hover:text-green-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="text-sm">{CONTACT_INFO.phone}</span>
                </a>
              </li>
              {CONTACT_INFO.email && (
                <li>
                  <a
                    href={`mailto:${CONTACT_INFO.email}`}
                    className="hover:text-[#cd7f32] transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm">{CONTACT_INFO.email}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Mobile: Contact Info - Full Width */}
        <div className="text-center mt-6 pt-6 border-t border-black/10 lg:hidden text-xs text-black">
          <p className="mb-1">{LOCATION.address}, {LOCATION.city}, {LOCATION.state} {LOCATION.zip}</p>
          <p className="font-semibold">{CONTACT_INFO.phone}</p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-black">
            <div className="flex flex-col items-center md:items-start gap-2">
              <p className="text-xs lg:text-sm">
                &copy; {currentYear} {BUSINESS_NAME}. All rights reserved.
              </p>
              <p className="text-xs text-black/70">
                Website by{' '}
                <a
                  href="https://www.driveleadmedia.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:text-[#cd7f32] transition-colors"
                  title="Drive Lead Media - Professional Web Design & Digital Marketing Agency"
                >
                  Drive Lead Media
                </a>
              </p>
            </div>
            <AntiquePartnerBadge placement="footer" className="order-first md:order-none" />

            <div className="hidden md:flex gap-4">
              <Link href="/privacy" className="hover:text-[#cd7f32] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-[#cd7f32] transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
