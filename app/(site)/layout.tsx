import SiteShell from '@/components/layout/SiteShell'

/**
 * Layout for every public page. The route group (site) does not change any URL.
 * Booth map vendor and admin routes live outside this group so they never load
 * the trackers (docs/booth-map/SPEC.md section 9).
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>
}
