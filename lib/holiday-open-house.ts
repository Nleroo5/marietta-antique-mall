import { easternDate } from '@/lib/utils'

/**
 * Holiday Open House, Saturday 14 November 2026.
 *
 * Promoted by a sitewide bar (HolidayOpenHouseBar) and a homepage section
 * (HolidayOpenHouse). Both stay up through the end of the event day in Atlanta
 * and come down on their own from 15 November, so nothing has to be removed
 * by hand after the event.
 */

export const HOLIDAY_OPEN_HOUSE_DATE = '2026-11-14'

// Store hours on the day: the regular Saturday hours. The flyer does not list
// any, so change these here if the mall opens or closes differently.
export const HOLIDAY_OPEN_HOUSE_HOURS = '10 AM–7 PM'
// Eastern Standard Time: daylight saving ends on 1 November 2026.
export const HOLIDAY_OPEN_HOUSE_START = '2026-11-14T10:00:00-05:00'
export const HOLIDAY_OPEN_HOUSE_END = '2026-11-14T19:00:00-05:00'

export const HOLIDAY_OPEN_HOUSE_ANCHOR = 'holiday-open-house'
export const HOLIDAY_OPEN_HOUSE_IMAGE = '/images/events/holiday-open-house-2026.webp'
export const HOLIDAY_OPEN_HOUSE_ICS = '/events/holiday-open-house-2026.ics'

const MS_PER_DAY = 86_400_000

/**
 * Visible through 14 November in Atlanta, hidden from 00:00 ET on 15 November.
 * daysLeft is 0 on the day itself and negative afterwards.
 */
export function getHolidayOpenHouseState(etDate: string = easternDate()): {
  visible: boolean
  daysLeft: number
} {
  return {
    visible: etDate <= HOLIDAY_OPEN_HOUSE_DATE,
    daysLeft: Math.round((Date.parse(HOLIDAY_OPEN_HOUSE_DATE) - Date.parse(etDate)) / MS_PER_DAY),
  }
}

export function holidayOpenHouseCountdown(daysLeft: number): string {
  if (daysLeft <= 0) return 'Happening today'
  if (daysLeft === 1) return 'Tomorrow'
  return `${daysLeft} days away`
}

/**
 * One dedicated GA4 event, labelled by where the click came from, rather than
 * the generic `click` event that already carries thousands of unrelated hits.
 */
export function trackHolidayOpenHouseClick(label: 'Sitewide bar' | 'Add to calendar' | 'Get directions') {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', 'holiday_open_house_click', {
      event_category: 'Holiday Open House 2026',
      event_label: label,
    })
  }
}
