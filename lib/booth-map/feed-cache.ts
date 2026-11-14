import { unstable_cache } from 'next/cache'
import { getDb } from './db'
import { FEED_TAG } from './cache'
import { getBoothFeed, getFeed, getVisibleItem, includeTestVendors } from './feed'

/**
 * Cached reads for the shopper pages. Shoppers never wait on the database (SPEC 2):
 * results are cached under FEED_TAG, which the items API expires the moment a
 * vendor posts, and refreshed at least every 5 minutes so sold stamps and 30-day
 * expiry roll off on time.
 *
 * The feed page is also built during deploys. If the database can't be reached
 * then, the build uses an empty feed instead of failing, so a Neon outage can
 * never block deploying the rest of the site. At runtime an error is thrown as
 * usual, and Next keeps serving the last good page.
 */
const REVALIDATE = 300

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
  async () => getFeed(getDb(), { includeTest: includeTestVendors() }),
  ['booth-map', 'feed'],
  { tags: [FEED_TAG], revalidate: REVALIDATE }
)

/** The fallback sits outside the cache, so an empty build-time feed is never stored. */
export const cachedFeed = () => orEmptyDuringBuild(feedFromCache, [])

export const cachedBoothFeed = unstable_cache(
  async (boothNumber: string) => getBoothFeed(getDb(), boothNumber, { includeTest: includeTestVendors() }),
  ['booth-map', 'booth'],
  { tags: [FEED_TAG], revalidate: REVALIDATE }
)

export const cachedItem = unstable_cache(
  async (id: string) => getVisibleItem(getDb(), id, { includeTest: includeTestVendors() }),
  ['booth-map', 'item'],
  { tags: [FEED_TAG], revalidate: REVALIDATE }
)
