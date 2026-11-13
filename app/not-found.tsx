import SiteShell from '@/components/layout/SiteShell'
import NotFoundContent from '@/components/layout/NotFoundContent'

/**
 * 404 for any unmatched URL. It renders inside the bare root layout, so it adds the
 * site's header, footer and trackers itself and looks the same as before.
 */
export default function NotFound() {
  return (
    <SiteShell>
      <NotFoundContent />
    </SiteShell>
  )
}
