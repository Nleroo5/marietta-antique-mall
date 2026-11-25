import { unstable_cache } from 'next/cache'
import { getDb } from './db'
import { FEED_TAG } from './cache'
import { getBoothFeed, getFeed, getMapBooths, getVisibleItem, includeTestVendors } from './feed'
import { boothSalesEnabled } from './sales'

/**
 * Cached reads for the shopper pages (SPEC 2: shoppers don't wait on the database).
 *
 * - Cached under FEED_TAG and refreshed at least every 5 minutes, so sold stamps
 *   and 30-day expiry roll off on time.
 * - The items API expires FEED_TAG when a vendor posts (expire: 0), so the next
 *   visitor gets a fresh page that includes the new item. Trade-off, chosen on
 *   purpose: that one visitor waits for a fresh render instead of getting the old
 *   page, and if the database fails right then they see an error rather than a stale
 *   page. The database was awake moments earlier for the post itself, so the wait
 *   is short. Every other visitor gets the cached page.
 * - The cache key includes whether test vendors and booth sales are shown, so a
 *   preview's feed can never be served on the live site even if the two share a cache.
 * - A booth sale that reaches its end drops off at the next refresh (within 5 minutes).
 * - The feed page is also built during deploys. If the database can't be reached
 *   then, the build uses an empty feed instead of failing, so a Neon outage can't
 *   block deploying the rest of the site. The fallback sits outside the cache, so
 *   the empty result is never stored as data.
 */
const REVALIDATE = 300

export function cacheKeyParts(kind: 'feed' | 'booth' | 'item' | 'map', withTest = includeTestVendors(), withSales = boothSalesEnabled()): string[] {
  return ['booth-map', kind, withTest ? 'with-test-vendors' : 'live-vendors-only', withSales ? 'sales-on' : 'sales-off']
}

const feedOptions = () => ({ includeTest: includeTestVendors(), includeSales: boothSalesEnabled() })

async function orEmptyDuringBuild<T>(read: () => Promise<T>, empty: T): Promise<T> {
  try {
    return await read()
  } catch (err) {
    if (process.env.NEXT_PHASE !== 'phase-production-build') throw err
    console.warn('booth-map: database unreachable during build, using an empty feed', err)
    return empty
  }
}

const feedFromCache = unstable_cache(
  async () => getFeed(getDb(), feedOptions()),
  cacheKeyParts('feed'),
  { tags: [FEED_TAG], revalidate: REVALIDATE }
)

export const cachedFeed = () => orEmptyDuringBuild(feedFromCache, [])

export const cachedBoothFeed = unstable_cache(
  async (boothNumber: string) => getBoothFeed(getDb(), boothNumber, feedOptions()),
  cacheKeyParts('booth'),
  { tags: [FEED_TAG], revalidate: REVALIDATE }
)

export const cachedItem = unstable_cache(
  async (id: string) => getVisibleItem(getDb(), id, feedOptions()),
  cacheKeyParts('item'),
  { tags: [FEED_TAG], revalidate: REVALIDATE }
)

const mapBoothsFromCache = unstable_cache(
  async () => getMapBooths(getDb(), feedOptions()),
  cacheKeyParts('map'),
  { tags: [FEED_TAG], revalidate: REVALIDATE }
)

/** Booth numbers the store map lights up. Empty during a build if the database can't be reached. */
export const cachedMapBooths = () => orEmptyDuringBuild(mapBoothsFromCache, [] as string[])
