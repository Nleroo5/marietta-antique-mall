/** The store map (SPEC build step 6): floor plan data, walking directions, booth search and the lit booths query. */
import { PGlite } from '@electric-sql/pglite'
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import WhereToFind from '@/components/booth-map/map/WhereToFind'
import * as schema from '@/lib/booth-map/schema'
import { getMapBooths, normalizeBoothNumber } from '@/lib/booth-map/feed'
import { FLOOR, ISLANDS, LANDMARKS, SPACES, getStreet, spaceCenter, spaceTitle, type StreetId } from '@/lib/booth-map/floor-plan'
import { directionsFor, findSpace, findStreet, spacesOnStreet } from '@/lib/booth-map/directions'
import { generateToken, hashToken } from '@/lib/booth-map/tokens'
import type { AnyDb } from '@/lib/booth-map/types'

const AISLE: Record<string, StreetId> = {
  '1': 'roswell',
  '2': 'cherokee',
  '3': 'atlanta',
  '4': 'church',
  '5': 'lawrence',
  '6': 'polk',
  '7': 'marietta',
  '8': 'kennesaw',
  '9': 'whitlock',
}

/** The street the printed plan's numbering says a space faces. */
function streetFromNumber(id: string): StreetId {
  if (/^10\d\d/.test(id) || /^10-[A-G]$/.test(id)) return 'fairground'
  if (/^20\d\d/.test(id)) return 'powder-springs'
  if (/^K[1-6]$/.test(id)) return 'cherokee'
  if (/^[A-T]$/.test(id)) return 'roswell'
  const endCap = id.match(/^([2-9])-[A-F]$/)
  if (endCap) return AISLE[endCap[1]]
  return AISLE[id[0]]
}

describe('floor plan', () => {
  it('has every space from the printed plan', () => {
    expect(SPACES).toHaveLength(239)
    const count = (k: string) => SPACES.filter((s) => s.kind === k).length
    expect([count('booth'), count('endcap'), count('case')]).toEqual([162, 49, 28])
  })

  it('uses each number once, in the form the booths table stores', () => {
    expect(new Set(SPACES.map((s) => s.id)).size).toBe(SPACES.length)
    for (const s of SPACES) expect(normalizeBoothNumber(s.id), s.id).toBe(s.id)
  })

  it('keeps every space and room inside the building, with no two overlapping', () => {
    const all = [...SPACES, ...LANDMARKS]
    for (const r of all) {
      expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= FLOOR.width && r.y + r.h <= FLOOR.height, JSON.stringify(r)).toBe(true)
    }
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i]
        const b = all[j]
        const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
        const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
        expect(ix > 0.5 && iy > 0.5, `${JSON.stringify(a)} overlaps ${JSON.stringify(b)}`).toBe(false)
      }
    }
  })

  it('puts each space on the street its number names', () => {
    for (const s of SPACES) expect(s.street, s.id).toBe(streetFromNumber(s.id))
  })

  it('has even numbers on the left and odd on the right walking in, along the islands', () => {
    for (const s of SPACES) {
      const street = getStreet(s.street)
      const c = spaceCenter(s)
      if (s.kind !== 'booth' || street.axis !== 'ns' || !/^\d{3}$/.test(s.id)) continue
      if (c.y < ISLANDS.backY || c.y > ISLANDS.frontY) continue
      expect(Number(s.id) % 2 === 0, s.id).toBe(c.x < street.at)
    }
  })

  it('names end caps A and B at the front, E and F at the back, A C E on the left', () => {
    for (const s of SPACES.filter((x) => /^[2-9]-[A-F]$/.test(x.id))) {
      const letter = s.id.slice(-1)
      const c = spaceCenter(s)
      expect('ACE'.includes(letter), s.id).toBe(c.x < getStreet(s.street).at)
    }
    const y = (id: string) => spaceCenter(SPACES.find((s) => s.id === id)!).y
    expect(y('6-A')).toBeGreaterThan(y('6-C'))
    expect(y('6-C')).toBeGreaterThan(y('6-E'))
  })

  it('lists a street front to back', () => {
    const marietta = spacesOnStreet('marietta').map((s) => s.id)
    expect(marietta.slice(0, 2)).toEqual(['700', '701'])
    expect(marietta.slice(-2)).toEqual(['710', '711'])
    expect(marietta).toHaveLength(18)
  })
})

describe('walking directions', () => {
  it.each([
    ['705', 'Walk straight in. Marietta Street is right in front of you. Booth 705 is on your right, about halfway up.'],
    ['402', 'Turn right on Roswell Street. Pass Polk and Lawrence Streets, then turn left up Church Street. Booth 402 is on your left, near the front.'],
    ['6-D', 'Turn right on Roswell Street, then left up Polk Street. End cap 6-D is on your right at the middle cross wall.'],
    ['K3', 'Turn right on Roswell Street and go all the way to Cherokee Street, then turn left. Case K3 is in the middle of the aisle, about halfway up.'],
    ['810', 'Turn left on Roswell Street, then right up Kennesaw Street. Booth 810 is on your left, toward the back.'],
    ['1002', 'Walk straight up Marietta Street to Fairground Street and turn right. Booth 1002 is the first booth on your left.'],
    ['1012', 'Turn right on Roswell Street. Pass Polk and Lawrence Streets, then turn left up Church Street to Fairground Street, and turn left. Booth 1012 is the first booth on your right.'],
    ['2014', 'Turn right on Roswell Street and go all the way to Cherokee Street, then turn left. Walk to the far end and turn left on Powder Springs Street. Booth 2014 is the second booth on your left.'],
    ['109', 'Turn right on Roswell Street. Booth 109 is on your right, between Polk and Lawrence Streets.'],
    ['101', 'Turn left on Roswell Street. Booth 101 is on your left, in the corner.'],
    ['C', 'Case C is at the cashier counter, just to your left as you walk in.'],
  ])('to %s', (id, expected) => {
    expect(directionsFor(id)).toBe(expected)
  })

  it('gives every space a complete sentence that names it', () => {
    for (const s of SPACES) {
      const d = directionsFor(s.id)!
      expect(d, s.id).toContain(spaceTitle(s))
      expect(d, s.id).toMatch(/\.$/)
      expect(d, s.id).not.toMatch(/undefined|null|NaN|  /)
    }
  })

  it('has nothing for a number that is not on the plan', () => {
    expect(directionsFor('9001')).toBeNull()
  })

  it('shows the street, the directions and a map link on booth and item pages', () => {
    const html = renderToStaticMarkup(createElement(WhereToFind, { booth: '705' }))
    expect(html).toContain('Booth 705 · Marietta Street')
    expect(html).toContain('Booth 705 is on your right, about halfway up.')
    expect(html).toContain('href="/new-arrivals/map?booth=705"')
    expect(renderToStaticMarkup(createElement(WhereToFind, { booth: '9001' }))).toBe('')
  })
})

describe('booth search', () => {
  it.each([
    ['705', '705'],
    ['booth 705', '705'],
    ['#705', '705'],
    ['  705 ', '705'],
    ['2000a', '2000-A'],
    ['2000 A', '2000-A'],
    ['9b', '9-B'],
    ['10-c', '10-C'],
    ['k 3', 'K3'],
    ['K-3', 'K3'],
    ['case n', 'N'],
    ['end cap 6-d', '6-D'],
    ['1004', '1004-1006'],
    ['1006', '1004-1006'],
  ])('finds %j', (q, id) => {
    expect(findSpace(q)?.id).toBe(id)
  })

  it.each(['9001', '', '   ', '7050', 'booth'])('finds nothing for %j', (q) => {
    expect(findSpace(q)).toBeNull()
  })

  it('finds streets by name', () => {
    expect(findStreet('marietta')?.id).toBe('marietta')
    expect(findStreet('Marietta St')?.id).toBe('marietta')
    expect(findStreet('cherokee street')?.id).toBe('cherokee')
    expect(findStreet('Whitlock Ave.')?.id).toBe('whitlock')
    expect(findStreet('powder')?.id).toBe('powder-springs')
    expect(findStreet('ma')).toBeNull()
    expect(findStreet('main street')).toBeNull()
  })
})

describe('booths the map lights up', () => {
  let db: PgliteDatabase<typeof schema>
  const any = () => db as unknown as AnyDb
  let n = 0

  async function vendorWithBooth(number: string, opts: { isTest?: boolean; status?: 'active' | 'paused' | 'removed' } = {}) {
    n += 1
    const [v] = await db
      .insert(schema.vendors)
      .values({ name: `M${n}`, displayName: `M${n}`, tokenHash: hashToken(generateToken()), isTest: opts.isTest ?? false, status: opts.status ?? 'active' })
      .returning()
    await db.insert(schema.booths).values({ number, vendorId: v.id })
  }

  beforeAll(async () => {
    db = drizzle(new PGlite(), { schema })
    await migrate(db, { migrationsFolder: './drizzle/booth-map' })
    await vendorWithBooth('705')
    await vendorWithBooth('402')
    await vendorWithBooth('706', { status: 'paused' })
    await vendorWithBooth('707', { status: 'removed' })
    await vendorWithBooth('9001', { isTest: true })
    await db.insert(schema.booths).values({ number: '709' }) // no vendor
  })

  it('shows booths of active vendors, never paused, removed or unassigned ones', async () => {
    expect(await getMapBooths(any(), { includeTest: false })).toEqual(['402', '705'])
  })

  it('shows test vendors only where the feed does (previews and local)', async () => {
    expect(await getMapBooths(any(), { includeTest: true })).toEqual(['402', '705', '9001'])
  })
})
