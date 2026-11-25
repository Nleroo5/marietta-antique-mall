# Store map floor plan

Source: the mall's printed floor plan, dated March 2023 (`printed-floor-plan-2023-03.jpg`, photographed Nov 24, 2026, turned upright). Traced into `lib/booth-map/floor-plan.ts`: 239 spaces (162 booths, 49 end caps, 28 cases).

## How the numbers work

The number is the address. The hundreds digit names the street the space faces:

| Numbers | Street |
| --- | --- |
| 100s, cases A to T | Roswell Street, the front aisle by the entrance and cashier |
| 900s | Whitlock Avenue, west wall |
| 800s | Kennesaw Street |
| 700s | Marietta Street, straight ahead from the entrance |
| 600s | Polk Street |
| 500s | Lawrence Street |
| 400s | Church Street |
| 300s | Atlanta Street |
| 200s, K1 to K6 | Cherokee Street, east wall, K cases down the middle |
| 1000s, 10-A to 10-G | Fairground Street, across the back of the islands |
| 2000s | Powder Springs Street, back wall |

Walking in from Roswell Street, even numbers are on the left and odd on the right; the last two digits count from the front. End caps are the aisle plus a letter: A and B on the front cross wall, C and D in the middle, E and F at the back, A/C/E on the left. Tests in `tests/booth-map/store-map.test.ts` check every space against these rules.

## Editing

One line per space in `lib/booth-map/floor-plan.ts`. Change a number, street or position there and the map, the directions and the space sheet follow. Run `npm test` after any change (it checks numbering, overlaps and directions), then `npx tsx scripts/booth-map/space-sheet.ts` to refresh `space-sheet.csv`.

## Still to confirm with the front desk (walk-through, about 30 minutes)

- Is the March 2023 plan still right? Merged, split or renumbered booths since? (1004-1006 is already a combined booth; there is no 2005.)
- End caps (9-B, 8-A, 10-C...): rented to vendors?
- Lettered boxes A to T, 101-A, 107-A: glass cases? K1 to K6: cases or kiosks?
- Small strips (`confirm: true` in the file): 918, 920, 921, 922-A to C, 2002, 2015, 2017, 2027-A and B, 216, 218, 117, 105-A and B.
- Does Cherokee Street connect to Powder Springs Street at the back? Directions to the 2000s go that way.
- Are the street names on signs in the store?
- Which vendor rents which space: `space-sheet.csv`, Vendor column.

The red dots on the printed plan are left off the map (Nicolas, Nov 24, 2026).
