import Header from '@/components/layout/Header'
import AwardVoteBar from '@/components/layout/AwardVoteBar'
import HolidayOpenHouseBar from '@/components/layout/HolidayOpenHouseBar'
import Footer from '@/components/layout/Footer'
import SiteTrackers from '@/components/layout/SiteTrackers'

/**
 * Everything the public site wraps around a page: trackers, promo bars, header,
 * footer. Used by app/(site)/layout.tsx and app/not-found.tsx. Moved out of
 * app/layout.tsx unchanged so booth map vendor and admin pages get none of it.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteTrackers />
      <AwardVoteBar />
      <HolidayOpenHouseBar />
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  )
}
