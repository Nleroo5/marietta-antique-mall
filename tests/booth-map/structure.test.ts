/**
 * The tracker isolation is structural (SPEC 9): vendor and admin pages live in
 * app/(booth), which never imports the site shell, and catch-all routes send every
 * unknown /v, /vendor and /admin address to the booth 404 instead of the public
 * 404 (which is built ahead of time with the Meta Pixel inside).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const BOOTH = 'app/(booth)'

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? filesUnder(p) : [p]
  })
}

describe('booth route group', () => {
  it('has a page or catch-all for every private prefix, so no private URL reaches the public 404', () => {
    for (const f of [
      'v/page.tsx',
      'v/[token]/route.ts',
      'v/[token]/[...rest]/page.tsx',
      'vendor/page.tsx',
      'vendor/[...rest]/page.tsx',
      'admin/[[...rest]]/page.tsx',
      'not-found.tsx',
      'error.tsx',
      'layout.tsx',
    ]) {
      expect(existsSync(join(BOOTH, f)), f).toBe(true)
    }
  })

  it('never imports the site shell, trackers, header, footer or promo bars', () => {
    const banned = /SiteShell|SiteTrackers|components\/layout\/(Header|Footer|AwardVoteBar|HolidayOpenHouseBar)|next\/script|fbq|gtag|clarity/
    const sources = [...filesUnder(BOOTH), 'components/booth-map/VendorApp.tsx']
    for (const f of sources) expect(readFileSync(f, 'utf8'), f).not.toMatch(banned)
  })

  it('the root layout itself loads no trackers; only the site shell does', () => {
    const root = readFileSync('app/layout.tsx', 'utf8')
    expect(root).not.toMatch(/fbq\(|googletagmanager|clarity\.ms|next\/script|import[^\n]*(SiteShell|SiteTrackers)/)
    expect(readFileSync('app/(site)/layout.tsx', 'utf8')).toMatch(/SiteShell/)
  })
})

describe('New Arrivals stays hidden until launch (owner decision)', () => {
  it('is marked noindex', () => {
    expect(readFileSync('app/(site)/new-arrivals/layout.tsx', 'utf8')).toMatch(/index: false/)
  })

  it('is not in the sitemap and not linked from the menu, header, footer or any existing page', () => {
    const existing = [
      'app/sitemap.ts',
      'lib/constants.ts',
      ...filesUnder('components/layout'),
      ...filesUnder('app/(site)').filter((f) => !f.includes('new-arrivals')),
    ]
    for (const f of existing) expect(readFileSync(f, 'utf8'), f).not.toMatch(/new-arrivals/)
  })
})
