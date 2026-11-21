'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { CONTACT_INFO } from '@/lib/constants'
import { formatPhoneLink } from '@/lib/utils'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Shop Online', href: '/shop' },
  { label: 'Vendors', href: '/vendors' },
  { label: 'Sell or Donate', href: '/sell' },
  { label: 'Visit', href: '/visit' },
  { label: 'Contact', href: '/contact' },
]

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname()

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        onClose()
      }
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-50 lg:hidden shadow-2xl animate-slide-down" data-analytics-location="mobile_menu">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="font-display text-xl font-bold text-black">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 text-black hover:text-black focus-ring rounded-lg"
              aria-label="Close menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-6">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className={cn(
                        'block px-4 py-3 rounded-lg text-base font-medium transition-colors',
                        'hover:bg-primary/10 hover:text-black',
                        isActive ? 'bg-primary/10 text-black' : 'text-black'
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Contact Info */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="font-semibold text-black mb-4">Contact Us</h3>
              <div className="space-y-3">
                <a
                  href={`tel:${formatPhoneLink(CONTACT_INFO.phone)}`}
                  className="flex items-center gap-3 text-black hover:text-green-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {CONTACT_INFO.phone}
                </a>
                <a
                  href={CONTACT_INFO.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-black hover:text-black transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Follow us on Facebook
                </a>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}
