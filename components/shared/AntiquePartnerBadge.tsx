'use client'

const LISTING_URL = 'https://antiquepartner.com/directory/marietta-antique-mall'

interface AntiquePartnerBadgeProps {
  /** Where the badge sits, e.g. "footer". Used for utm_content and GA4 reporting. */
  placement: string
  className?: string
}

export default function AntiquePartnerBadge({
  placement,
  className = '',
}: AntiquePartnerBadgeProps) {
  const href =
    `${LISTING_URL}?utm_source=mariettaantiquemall&utm_medium=badge` +
    `&utm_campaign=partner&utm_content=${encodeURIComponent(placement)}`

  const handleClick = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'partner_badge_click', {
        event_category: 'Antique Partner',
        event_label: placement,
      })
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      title="Marietta Antique Mall is featured on Antique Partner"
      className={`inline-block transition-opacity hover:opacity-80 ${className}`}
    >
      <img
        src="/badges/antique-partner-featured.svg"
        alt="Featured on Antique Partner"
        width={232}
        height={102}
        loading="lazy"
        decoding="async"
      />
    </a>
  )
}
