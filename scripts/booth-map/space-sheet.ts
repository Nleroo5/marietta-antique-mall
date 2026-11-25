/**
 * Writes the space sheet for the front desk: every space on the floor plan, street by street,
 * with its directions and an empty Vendor column to fill in. Run: npx tsx scripts/booth-map/space-sheet.ts
 * Output: docs/booth-map/floor-plan/space-sheet.csv (opens in Excel, Numbers and Google Sheets).
 */
import { writeFileSync } from 'node:fs'
import { getStreet, spaceTitle, type StreetId } from '../../lib/booth-map/floor-plan'
import { directionsFor, spacesOnStreet } from '../../lib/booth-map/directions'

const ORDER: StreetId[] = ['roswell', 'whitlock', 'kennesaw', 'marietta', 'polk', 'lawrence', 'church', 'atlanta', 'cherokee', 'fairground', 'powder-springs']
const TYPE = { booth: 'Booth', endcap: 'End cap', case: 'Case' } as const

const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
const rows = [['Space', 'Type', 'Street', 'Directions from the main entrance', 'Vendor (please fill in)', 'Notes']]
for (const id of ORDER) {
  for (const s of spacesOnStreet(id)) {
    rows.push([
      s.id,
      TYPE[s.kind],
      getStreet(s.street).name,
      directionsFor(s.id) ?? '',
      '',
      s.confirm ? `Small strip on the plan: is ${spaceTitle(s)} a booth, a shelf or wall space?` : '',
    ])
  }
}
const out = 'docs/booth-map/floor-plan/space-sheet.csv'
// A byte-order mark so Excel reads the curly apostrophes correctly.
writeFileSync(out, '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n')
console.log(`${rows.length - 1} spaces written to ${out}`)
