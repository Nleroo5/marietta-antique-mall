import HeroBanner from '@/components/homepage/HeroBanner'
import FacebookMarketplace from '@/components/homepage/FacebookMarketplace'
import AboutSection from '@/components/homepage/AboutSection'
import NewsletterSignup from '@/components/homepage/NewsletterSignup'
import BestOfCobbVoting from '@/components/homepage/BestOfCobbVoting'
import VisitUsSection from '@/components/homepage/VisitUsSection'
import HolidayOpenHouse from '@/components/homepage/HolidayOpenHouse'
import { getHolidayOpenHouseState } from '@/lib/holiday-open-house'

// Regenerate hourly so date-limited sections such as the Holiday Open House
// drop out of the served HTML soon after they expire, not at the next deploy.
export const revalidate = 3600

export default function HomePage() {
  const showHolidayOpenHouse = getHolidayOpenHouseState().visible

  return (
    <div className="bg-gradient-to-b from-slate-light/20 to-white">
      <HeroBanner />
      {showHolidayOpenHouse && <HolidayOpenHouse />}
      <AboutSection />
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <FacebookMarketplace />
            <NewsletterSignup />
          </div>
        </div>
      </section>
      <BestOfCobbVoting />
      <VisitUsSection />
    </div>
  )
}
