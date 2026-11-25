/**
 * The Marietta Antique Mall floor plan (store map, SPEC build step 6). Browser-safe: no database imports.
 *
 * Traced from the mall's printed floor plan dated March 2023 (photo in docs/booth-map/floor-plan/).
 * Units are roughly the printed plan's: the building is 1280 wide and 960 deep, with the
 * main entrance on the bottom edge. The drawing is a schematic, not to scale.
 *
 * Every space number is an address: the hundreds digit names the street the space faces
 * (7xx Marietta Street, 4xx Church Street, 10xx Fairground Street, 20xx Powder Springs Street),
 * even numbers are on the left walking in from Roswell Street and odd on the right, and the
 * last two digits count from the front. End caps are the aisle plus a letter: A and B on the
 * front cross wall, C and D in the middle, E and F at the back, A/C/E on the left.
 *
 * Editing: one line per space. `confirm: true` marks small strips that could not be sized from
 * the photo; check them on the walk-through with the front desk (docs/booth-map/floor-plan/README.md).
 */

export type SpaceKind = 'booth' | 'endcap' | 'case'

export type StreetId =
  | 'roswell'
  | 'whitlock'
  | 'kennesaw'
  | 'marietta'
  | 'polk'
  | 'lawrence'
  | 'church'
  | 'atlanta'
  | 'cherokee'
  | 'fairground'
  | 'powder-springs'

export interface Space {
  /** The number on the plan, as stored in booths.number: uppercase letters, digits and dashes. */
  id: string
  kind: SpaceKind
  /** The street (aisle) the space faces. */
  street: StreetId
  x: number
  y: number
  w: number
  h: number
  /** Shorter text drawn on the map when the number doesn't fit (2000-A is drawn as A). */
  label?: string
  /** A small strip that could not be sized from the photo; confirm on the walk-through. */
  confirm?: true
}

export interface Street {
  id: StreetId
  name: string
  /** Front-to-back aisles run north from Roswell Street; side-to-side ones run east-west. */
  axis: 'ns' | 'ew'
  /** Center line: x for front-to-back aisles, y for side-to-side ones. */
  at: number
  /** Where the street name is drawn. */
  labelX: number
  labelY: number
}

export const FLOOR = { width: 1280, height: 960 } as const

/** The main entrance, on Roswell Street at the bottom edge. Walking in, Marietta Street is straight ahead. */
export const ENTRANCE = { x: 340, y: 950, w: 110, h: 10, centerX: 395 } as const

/** The seven islands: the front row of booths starts at FRONT_Y, the back row ends at BACK_Y. */
export const ISLANDS = { frontY: 745, backY: 355 } as const

/** K1 to K6 stand in the middle of Cherokee Street, between these x values. */
export const CHEROKEE_MIDDLE = { from: 1098, to: 1128 } as const

/** The short west end of Powder Springs Street, between the 2001 and 2000 spaces. */
export const POWDER_SPRINGS_WEST = { from: 241, to: 512, at: 173 } as const

/** Walking order, west to east, for front-to-back streets; then the side-to-side streets. */
export const STREETS: readonly Street[] = [
  { id: 'whitlock', name: 'Whitlock Avenue', axis: 'ns', at: 100, labelX: 97, labelY: 615 },
  { id: 'kennesaw', name: 'Kennesaw Street', axis: 'ns', at: 244, labelX: 247, labelY: 615 },
  { id: 'marietta', name: 'Marietta Street', axis: 'ns', at: 392, labelX: 395, labelY: 615 },
  { id: 'polk', name: 'Polk Street', axis: 'ns', at: 537.5, labelX: 541, labelY: 615 },
  { id: 'lawrence', name: 'Lawrence Street', axis: 'ns', at: 678, labelX: 681, labelY: 615 },
  { id: 'church', name: 'Church Street', axis: 'ns', at: 818.5, labelX: 822, labelY: 615 },
  { id: 'atlanta', name: 'Atlanta Street', axis: 'ns', at: 957.5, labelX: 961, labelY: 615 },
  { id: 'cherokee', name: 'Cherokee Street', axis: 'ns', at: 1113, labelX: 1147, labelY: 560 },
  { id: 'roswell', name: 'Roswell Street', axis: 'ew', at: 795, labelX: 630, labelY: 798 },
  { id: 'fairground', name: 'Fairground Street', axis: 'ew', at: 324, labelX: 650, labelY: 327 },
  { id: 'powder-springs', name: 'Powder Springs Street', axis: 'ew', at: 110, labelX: 800, labelY: 120 },
]

export interface Landmark {
  name: string
  x: number
  y: number
  w: number
  h: number
  staff?: true
}

export const LANDMARKS: readonly Landmark[] = [
  { name: 'Women’s restroom', x: 0, y: 0, w: 182, h: 154 },
  { name: 'Men’s restroom', x: 0, y: 196, w: 138, h: 100 },
  { name: 'Vending', x: 182, y: 10, w: 34, h: 124 },
  { name: 'Event room', x: 216, y: 10, w: 76, h: 124 },
  { name: 'Cashier', x: 226, y: 846, w: 96, h: 58 },
  { name: 'Loading', x: 855, y: 850, w: 55, h: 110, staff: true },
  { name: 'Office', x: 1050, y: 846, w: 230, h: 114, staff: true },
]

export const SPACES: readonly Space[] = [
  { id: '911', kind: 'booth', street: 'whitlock', x: 120, y: 355, w: 52, h: 65 },
  { id: '810', kind: 'booth', street: 'kennesaw', x: 172, y: 355, w: 52, h: 65 },
  { id: '909', kind: 'booth', street: 'whitlock', x: 120, y: 420, w: 52, h: 65 },
  { id: '808', kind: 'booth', street: 'kennesaw', x: 172, y: 420, w: 52, h: 65 },
  { id: '907', kind: 'booth', street: 'whitlock', x: 120, y: 485, w: 52, h: 65 },
  { id: '806', kind: 'booth', street: 'kennesaw', x: 172, y: 485, w: 52, h: 65 },
  { id: '905', kind: 'booth', street: 'whitlock', x: 120, y: 550, w: 52, h: 65 },
  { id: '804', kind: 'booth', street: 'kennesaw', x: 172, y: 550, w: 52, h: 65 },
  { id: '903', kind: 'booth', street: 'whitlock', x: 120, y: 615, w: 52, h: 65 },
  { id: '802', kind: 'booth', street: 'kennesaw', x: 172, y: 615, w: 52, h: 65 },
  { id: '901', kind: 'booth', street: 'whitlock', x: 120, y: 680, w: 52, h: 65 },
  { id: '800', kind: 'booth', street: 'kennesaw', x: 172, y: 680, w: 52, h: 65 },
  { id: '9-F', kind: 'endcap', street: 'whitlock', x: 109, y: 408, w: 11, h: 24 },
  { id: '8-E', kind: 'endcap', street: 'kennesaw', x: 224, y: 408, w: 11, h: 24 },
  { id: '9-D', kind: 'endcap', street: 'whitlock', x: 109, y: 538, w: 11, h: 24 },
  { id: '8-C', kind: 'endcap', street: 'kennesaw', x: 224, y: 538, w: 11, h: 24 },
  { id: '9-B', kind: 'endcap', street: 'whitlock', x: 109, y: 668, w: 11, h: 24 },
  { id: '8-A', kind: 'endcap', street: 'kennesaw', x: 224, y: 668, w: 11, h: 24 },
  { id: '10-A', kind: 'endcap', street: 'fairground', x: 148, y: 342, w: 48, h: 13 },
  { id: 'N', kind: 'case', street: 'roswell', x: 157, y: 748, w: 30, h: 24 },
  { id: '811', kind: 'booth', street: 'kennesaw', x: 264, y: 355, w: 52, h: 65 },
  { id: '710', kind: 'booth', street: 'marietta', x: 316, y: 355, w: 52, h: 65 },
  { id: '809', kind: 'booth', street: 'kennesaw', x: 264, y: 420, w: 52, h: 65 },
  { id: '708', kind: 'booth', street: 'marietta', x: 316, y: 420, w: 52, h: 65 },
  { id: '807', kind: 'booth', street: 'kennesaw', x: 264, y: 485, w: 52, h: 65 },
  { id: '706', kind: 'booth', street: 'marietta', x: 316, y: 485, w: 52, h: 65 },
  { id: '805', kind: 'booth', street: 'kennesaw', x: 264, y: 550, w: 52, h: 65 },
  { id: '704', kind: 'booth', street: 'marietta', x: 316, y: 550, w: 52, h: 65 },
  { id: '803', kind: 'booth', street: 'kennesaw', x: 264, y: 615, w: 52, h: 65 },
  { id: '702', kind: 'booth', street: 'marietta', x: 316, y: 615, w: 52, h: 65 },
  { id: '801', kind: 'booth', street: 'kennesaw', x: 264, y: 680, w: 52, h: 65 },
  { id: '700', kind: 'booth', street: 'marietta', x: 316, y: 680, w: 52, h: 65 },
  { id: '8-F', kind: 'endcap', street: 'kennesaw', x: 253, y: 408, w: 11, h: 24 },
  { id: '7-E', kind: 'endcap', street: 'marietta', x: 368, y: 408, w: 11, h: 24 },
  { id: '8-D', kind: 'endcap', street: 'kennesaw', x: 253, y: 538, w: 11, h: 24 },
  { id: '7-C', kind: 'endcap', street: 'marietta', x: 368, y: 538, w: 11, h: 24 },
  { id: '8-B', kind: 'endcap', street: 'kennesaw', x: 253, y: 668, w: 11, h: 24 },
  { id: '7-A', kind: 'endcap', street: 'marietta', x: 368, y: 668, w: 11, h: 24 },
  { id: '10-B', kind: 'endcap', street: 'fairground', x: 292, y: 342, w: 48, h: 13 },
  { id: 'O', kind: 'case', street: 'roswell', x: 301, y: 748, w: 30, h: 24 },
  { id: '711', kind: 'booth', street: 'marietta', x: 416, y: 355, w: 52, h: 65 },
  { id: '610', kind: 'booth', street: 'polk', x: 468, y: 355, w: 52, h: 65 },
  { id: '709', kind: 'booth', street: 'marietta', x: 416, y: 420, w: 52, h: 65 },
  { id: '608', kind: 'booth', street: 'polk', x: 468, y: 420, w: 52, h: 65 },
  { id: '707', kind: 'booth', street: 'marietta', x: 416, y: 485, w: 52, h: 65 },
  { id: '606', kind: 'booth', street: 'polk', x: 468, y: 485, w: 52, h: 65 },
  { id: '705', kind: 'booth', street: 'marietta', x: 416, y: 550, w: 52, h: 65 },
  { id: '604', kind: 'booth', street: 'polk', x: 468, y: 550, w: 52, h: 65 },
  { id: '703', kind: 'booth', street: 'marietta', x: 416, y: 615, w: 52, h: 65 },
  { id: '602', kind: 'booth', street: 'polk', x: 468, y: 615, w: 52, h: 65 },
  { id: '701', kind: 'booth', street: 'marietta', x: 416, y: 680, w: 52, h: 65 },
  { id: '600', kind: 'booth', street: 'polk', x: 468, y: 680, w: 52, h: 65 },
  { id: '7-F', kind: 'endcap', street: 'marietta', x: 405, y: 408, w: 11, h: 24 },
  { id: '6-E', kind: 'endcap', street: 'polk', x: 520, y: 408, w: 11, h: 24 },
  { id: '7-D', kind: 'endcap', street: 'marietta', x: 405, y: 538, w: 11, h: 24 },
  { id: '6-C', kind: 'endcap', street: 'polk', x: 520, y: 538, w: 11, h: 24 },
  { id: '7-B', kind: 'endcap', street: 'marietta', x: 405, y: 668, w: 11, h: 24 },
  { id: '6-A', kind: 'endcap', street: 'polk', x: 520, y: 668, w: 11, h: 24 },
  { id: '10-C', kind: 'endcap', street: 'fairground', x: 444, y: 342, w: 48, h: 13 },
  { id: 'P', kind: 'case', street: 'roswell', x: 453, y: 748, w: 30, h: 24 },
  { id: '611', kind: 'booth', street: 'polk', x: 555, y: 355, w: 52, h: 65 },
  { id: '510', kind: 'booth', street: 'lawrence', x: 607, y: 355, w: 52, h: 65 },
  { id: '609', kind: 'booth', street: 'polk', x: 555, y: 420, w: 52, h: 65 },
  { id: '508', kind: 'booth', street: 'lawrence', x: 607, y: 420, w: 52, h: 65 },
  { id: '607', kind: 'booth', street: 'polk', x: 555, y: 485, w: 52, h: 65 },
  { id: '506', kind: 'booth', street: 'lawrence', x: 607, y: 485, w: 52, h: 65 },
  { id: '605', kind: 'booth', street: 'polk', x: 555, y: 550, w: 52, h: 65 },
  { id: '504', kind: 'booth', street: 'lawrence', x: 607, y: 550, w: 52, h: 65 },
  { id: '603', kind: 'booth', street: 'polk', x: 555, y: 615, w: 52, h: 65 },
  { id: '502', kind: 'booth', street: 'lawrence', x: 607, y: 615, w: 52, h: 65 },
  { id: '601', kind: 'booth', street: 'polk', x: 555, y: 680, w: 52, h: 65 },
  { id: '500', kind: 'booth', street: 'lawrence', x: 607, y: 680, w: 52, h: 65 },
  { id: '6-F', kind: 'endcap', street: 'polk', x: 544, y: 408, w: 11, h: 24 },
  { id: '5-E', kind: 'endcap', street: 'lawrence', x: 659, y: 408, w: 11, h: 24 },
  { id: '6-D', kind: 'endcap', street: 'polk', x: 544, y: 538, w: 11, h: 24 },
  { id: '5-C', kind: 'endcap', street: 'lawrence', x: 659, y: 538, w: 11, h: 24 },
  { id: '6-B', kind: 'endcap', street: 'polk', x: 544, y: 668, w: 11, h: 24 },
  { id: '5-A', kind: 'endcap', street: 'lawrence', x: 659, y: 668, w: 11, h: 24 },
  { id: '10-D', kind: 'endcap', street: 'fairground', x: 583, y: 342, w: 48, h: 13 },
  { id: 'Q', kind: 'case', street: 'roswell', x: 592, y: 748, w: 30, h: 24 },
  { id: '511', kind: 'booth', street: 'lawrence', x: 697, y: 355, w: 52, h: 65 },
  { id: '410', kind: 'booth', street: 'church', x: 749, y: 355, w: 52, h: 65 },
  { id: '509', kind: 'booth', street: 'lawrence', x: 697, y: 420, w: 52, h: 65 },
  { id: '408', kind: 'booth', street: 'church', x: 749, y: 420, w: 52, h: 65 },
  { id: '507', kind: 'booth', street: 'lawrence', x: 697, y: 485, w: 52, h: 65 },
  { id: '406', kind: 'booth', street: 'church', x: 749, y: 485, w: 52, h: 65 },
  { id: '505', kind: 'booth', street: 'lawrence', x: 697, y: 550, w: 52, h: 65 },
  { id: '404', kind: 'booth', street: 'church', x: 749, y: 550, w: 52, h: 65 },
  { id: '503', kind: 'booth', street: 'lawrence', x: 697, y: 615, w: 52, h: 65 },
  { id: '402', kind: 'booth', street: 'church', x: 749, y: 615, w: 52, h: 65 },
  { id: '501', kind: 'booth', street: 'lawrence', x: 697, y: 680, w: 52, h: 65 },
  { id: '400', kind: 'booth', street: 'church', x: 749, y: 680, w: 52, h: 65 },
  { id: '5-F', kind: 'endcap', street: 'lawrence', x: 686, y: 408, w: 11, h: 24 },
  { id: '4-E', kind: 'endcap', street: 'church', x: 801, y: 408, w: 11, h: 24 },
  { id: '5-D', kind: 'endcap', street: 'lawrence', x: 686, y: 538, w: 11, h: 24 },
  { id: '4-C', kind: 'endcap', street: 'church', x: 801, y: 538, w: 11, h: 24 },
  { id: '5-B', kind: 'endcap', street: 'lawrence', x: 686, y: 668, w: 11, h: 24 },
  { id: '4-A', kind: 'endcap', street: 'church', x: 801, y: 668, w: 11, h: 24 },
  { id: '10-E', kind: 'endcap', street: 'fairground', x: 725, y: 342, w: 48, h: 13 },
  { id: '104', kind: 'booth', street: 'roswell', x: 725, y: 748, w: 48, h: 24 },
  { id: '411', kind: 'booth', street: 'church', x: 836, y: 355, w: 52, h: 65 },
  { id: '310', kind: 'booth', street: 'atlanta', x: 888, y: 355, w: 52, h: 65 },
  { id: '409', kind: 'booth', street: 'church', x: 836, y: 420, w: 52, h: 65 },
  { id: '308', kind: 'booth', street: 'atlanta', x: 888, y: 420, w: 52, h: 65 },
  { id: '407', kind: 'booth', street: 'church', x: 836, y: 485, w: 52, h: 65 },
  { id: '306', kind: 'booth', street: 'atlanta', x: 888, y: 485, w: 52, h: 65 },
  { id: '405', kind: 'booth', street: 'church', x: 836, y: 550, w: 52, h: 65 },
  { id: '304', kind: 'booth', street: 'atlanta', x: 888, y: 550, w: 52, h: 65 },
  { id: '403', kind: 'booth', street: 'church', x: 836, y: 615, w: 52, h: 65 },
  { id: '302', kind: 'booth', street: 'atlanta', x: 888, y: 615, w: 52, h: 65 },
  { id: '401', kind: 'booth', street: 'church', x: 836, y: 680, w: 52, h: 65 },
  { id: '300', kind: 'booth', street: 'atlanta', x: 888, y: 680, w: 52, h: 65 },
  { id: '4-F', kind: 'endcap', street: 'church', x: 825, y: 408, w: 11, h: 24 },
  { id: '3-E', kind: 'endcap', street: 'atlanta', x: 940, y: 408, w: 11, h: 24 },
  { id: '4-D', kind: 'endcap', street: 'church', x: 825, y: 538, w: 11, h: 24 },
  { id: '3-C', kind: 'endcap', street: 'atlanta', x: 940, y: 538, w: 11, h: 24 },
  { id: '4-B', kind: 'endcap', street: 'church', x: 825, y: 668, w: 11, h: 24 },
  { id: '3-A', kind: 'endcap', street: 'atlanta', x: 940, y: 668, w: 11, h: 24 },
  { id: '10-F', kind: 'endcap', street: 'fairground', x: 864, y: 342, w: 48, h: 13 },
  { id: '106', kind: 'booth', street: 'roswell', x: 864, y: 748, w: 48, h: 24 },
  { id: '311', kind: 'booth', street: 'atlanta', x: 975, y: 355, w: 52, h: 65 },
  { id: '210', kind: 'booth', street: 'cherokee', x: 1027, y: 355, w: 52, h: 65 },
  { id: '309', kind: 'booth', street: 'atlanta', x: 975, y: 420, w: 52, h: 65 },
  { id: '208', kind: 'booth', street: 'cherokee', x: 1027, y: 420, w: 52, h: 65 },
  { id: '307', kind: 'booth', street: 'atlanta', x: 975, y: 485, w: 52, h: 65 },
  { id: '206', kind: 'booth', street: 'cherokee', x: 1027, y: 485, w: 52, h: 65 },
  { id: '305', kind: 'booth', street: 'atlanta', x: 975, y: 550, w: 52, h: 65 },
  { id: '204', kind: 'booth', street: 'cherokee', x: 1027, y: 550, w: 52, h: 65 },
  { id: '303', kind: 'booth', street: 'atlanta', x: 975, y: 615, w: 52, h: 65 },
  { id: '202', kind: 'booth', street: 'cherokee', x: 1027, y: 615, w: 52, h: 65 },
  { id: '301', kind: 'booth', street: 'atlanta', x: 975, y: 680, w: 52, h: 65 },
  { id: '200', kind: 'booth', street: 'cherokee', x: 1027, y: 680, w: 52, h: 65 },
  { id: '3-F', kind: 'endcap', street: 'atlanta', x: 964, y: 408, w: 11, h: 24 },
  { id: '2-E', kind: 'endcap', street: 'cherokee', x: 1079, y: 408, w: 11, h: 24 },
  { id: '3-D', kind: 'endcap', street: 'atlanta', x: 964, y: 538, w: 11, h: 24 },
  { id: '2-C', kind: 'endcap', street: 'cherokee', x: 1079, y: 538, w: 11, h: 24 },
  { id: '3-B', kind: 'endcap', street: 'atlanta', x: 964, y: 668, w: 11, h: 24 },
  { id: '2-A', kind: 'endcap', street: 'cherokee', x: 1079, y: 668, w: 11, h: 24 },
  { id: '10-G', kind: 'endcap', street: 'fairground', x: 1003, y: 342, w: 48, h: 13 },
  { id: '108', kind: 'booth', street: 'roswell', x: 1003, y: 748, w: 48, h: 24 },
  { id: '912', kind: 'booth', street: 'whitlock', x: 0, y: 296, w: 80, h: 71 },
  { id: '910', kind: 'booth', street: 'whitlock', x: 0, y: 367, w: 80, h: 83 },
  { id: '908', kind: 'booth', street: 'whitlock', x: 0, y: 450, w: 80, h: 82 },
  { id: '906', kind: 'booth', street: 'whitlock', x: 0, y: 532, w: 80, h: 80 },
  { id: '904', kind: 'booth', street: 'whitlock', x: 0, y: 612, w: 80, h: 80 },
  { id: '902', kind: 'booth', street: 'whitlock', x: 0, y: 692, w: 80, h: 78 },
  { id: '900', kind: 'booth', street: 'whitlock', x: 0, y: 770, w: 80, h: 75 },
  { id: '921', kind: 'booth', street: 'whitlock', x: 6, y: 156, w: 156, h: 17, confirm: true },
  { id: '920', kind: 'booth', street: 'whitlock', x: 6, y: 173, w: 156, h: 17, confirm: true },
  { id: '916', kind: 'booth', street: 'whitlock', x: 139, y: 228, w: 39, h: 68 },
  { id: '918', kind: 'booth', street: 'whitlock', x: 179, y: 192, w: 12, h: 44, confirm: true },
  { id: '922-A', kind: 'booth', street: 'whitlock', x: 220, y: 210, w: 20, h: 27, confirm: true },
  { id: '922-B', kind: 'booth', street: 'whitlock', x: 220, y: 237, w: 20, h: 27, confirm: true },
  { id: '922-C', kind: 'booth', street: 'whitlock', x: 220, y: 264, w: 20, h: 27, confirm: true },
  { id: '1000-B', kind: 'booth', street: 'fairground', x: 242, y: 208, w: 83, h: 98 },
  { id: '1000', kind: 'booth', street: 'fairground', x: 325, y: 208, w: 85, h: 98 },
  { id: '1002', kind: 'booth', street: 'fairground', x: 410, y: 208, w: 90, h: 98 },
  { id: '1004-1006', kind: 'booth', street: 'fairground', x: 500, y: 208, w: 110, h: 98 },
  { id: '1008', kind: 'booth', street: 'fairground', x: 610, y: 208, w: 70, h: 98 },
  { id: '1010', kind: 'booth', street: 'fairground', x: 680, y: 208, w: 60, h: 98 },
  { id: '1012', kind: 'booth', street: 'fairground', x: 740, y: 208, w: 80, h: 98 },
  { id: '1014', kind: 'booth', street: 'fairground', x: 820, y: 208, w: 75, h: 98 },
  { id: '1016', kind: 'booth', street: 'fairground', x: 895, y: 208, w: 75, h: 98 },
  { id: '1018', kind: 'booth', street: 'fairground', x: 970, y: 208, w: 80, h: 98 },
  { id: '216', kind: 'booth', street: 'cherokee', x: 1050, y: 208, w: 15, h: 98, confirm: true },
  { id: '2004', kind: 'booth', street: 'powder-springs', x: 545, y: 136, w: 65, h: 72 },
  { id: '2006', kind: 'booth', street: 'powder-springs', x: 610, y: 136, w: 68, h: 72 },
  { id: '2008', kind: 'booth', street: 'powder-springs', x: 678, y: 136, w: 62, h: 72 },
  { id: '2010', kind: 'booth', street: 'powder-springs', x: 740, y: 136, w: 80, h: 72 },
  { id: '2012', kind: 'booth', street: 'powder-springs', x: 820, y: 136, w: 75, h: 72 },
  { id: '2014', kind: 'booth', street: 'powder-springs', x: 895, y: 136, w: 75, h: 72 },
  { id: '2016', kind: 'booth', street: 'powder-springs', x: 970, y: 136, w: 80, h: 72 },
  { id: '218', kind: 'booth', street: 'cherokee', x: 1050, y: 136, w: 15, h: 72, confirm: true },
  { id: '2002', kind: 'booth', street: 'powder-springs', x: 516, y: 136, w: 22, h: 72, confirm: true },
  { id: '2000-A', kind: 'booth', street: 'powder-springs', x: 245, y: 186, w: 25, h: 22, label: 'A' },
  { id: '2000-B', kind: 'booth', street: 'powder-springs', x: 270, y: 186, w: 25, h: 22, label: 'B' },
  { id: '2000-C', kind: 'booth', street: 'powder-springs', x: 295, y: 186, w: 25, h: 22, label: 'C' },
  { id: '2000-D', kind: 'booth', street: 'powder-springs', x: 320, y: 186, w: 25, h: 22, label: 'D' },
  { id: '2000-E', kind: 'booth', street: 'powder-springs', x: 345, y: 186, w: 25, h: 22, label: 'E' },
  { id: '2000-F', kind: 'booth', street: 'powder-springs', x: 370, y: 186, w: 72, h: 22 },
  { id: '2000-G', kind: 'booth', street: 'powder-springs', x: 442, y: 186, w: 70, h: 22 },
  { id: '2001-A', kind: 'booth', street: 'powder-springs', x: 241, y: 142, w: 57, h: 18 },
  { id: '2001-B', kind: 'booth', street: 'powder-springs', x: 298, y: 142, w: 57, h: 18 },
  { id: '2001-C', kind: 'booth', street: 'powder-springs', x: 355, y: 142, w: 56, h: 18 },
  { id: '2003', kind: 'booth', street: 'powder-springs', x: 292, y: 10, w: 143, h: 100 },
  { id: '2007', kind: 'booth', street: 'powder-springs', x: 478, y: 10, w: 67, h: 74 },
  { id: '2009', kind: 'booth', street: 'powder-springs', x: 545, y: 10, w: 55, h: 74 },
  { id: '2011', kind: 'booth', street: 'powder-springs', x: 600, y: 10, w: 58, h: 74 },
  { id: '2013', kind: 'booth', street: 'powder-springs', x: 658, y: 10, w: 57, h: 74 },
  { id: '2015', kind: 'booth', street: 'powder-springs', x: 715, y: 10, w: 13, h: 74, confirm: true },
  { id: '2017', kind: 'booth', street: 'powder-springs', x: 728, y: 10, w: 13, h: 74, confirm: true },
  { id: '2019', kind: 'booth', street: 'powder-springs', x: 741, y: 10, w: 69, h: 74 },
  { id: '2021', kind: 'booth', street: 'powder-springs', x: 810, y: 10, w: 55, h: 74 },
  { id: '2023', kind: 'booth', street: 'powder-springs', x: 865, y: 10, w: 55, h: 74 },
  { id: '2025', kind: 'booth', street: 'powder-springs', x: 920, y: 10, w: 55, h: 74 },
  { id: '2027-A', kind: 'booth', street: 'powder-springs', x: 975, y: 72, w: 127, h: 16, confirm: true },
  { id: '2027-B', kind: 'booth', street: 'powder-springs', x: 1102, y: 72, w: 133, h: 16, confirm: true },
  { id: 'K6', kind: 'case', street: 'cherokee', x: 1098, y: 340, w: 30, h: 55 },
  { id: 'K5', kind: 'case', street: 'cherokee', x: 1098, y: 410, w: 30, h: 55 },
  { id: 'K4', kind: 'case', street: 'cherokee', x: 1098, y: 480, w: 30, h: 58 },
  { id: 'K3', kind: 'case', street: 'cherokee', x: 1098, y: 552, w: 30, h: 58 },
  { id: 'K2', kind: 'case', street: 'cherokee', x: 1098, y: 625, w: 30, h: 58 },
  { id: 'K1', kind: 'case', street: 'cherokee', x: 1098, y: 696, w: 30, h: 58 },
  { id: '217', kind: 'booth', street: 'cherokee', x: 1155, y: 135, w: 125, h: 40 },
  { id: '215', kind: 'booth', street: 'cherokee', x: 1155, y: 175, w: 125, h: 55 },
  { id: '213', kind: 'booth', street: 'cherokee', x: 1155, y: 230, w: 125, h: 80 },
  { id: '211', kind: 'booth', street: 'cherokee', x: 1155, y: 310, w: 125, h: 70 },
  { id: '209', kind: 'booth', street: 'cherokee', x: 1155, y: 380, w: 125, h: 90 },
  { id: '207', kind: 'booth', street: 'cherokee', x: 1155, y: 470, w: 125, h: 90 },
  { id: '205', kind: 'booth', street: 'cherokee', x: 1155, y: 560, w: 125, h: 85 },
  { id: '203', kind: 'booth', street: 'cherokee', x: 1155, y: 645, w: 125, h: 105 },
  { id: '201', kind: 'booth', street: 'cherokee', x: 1155, y: 750, w: 125, h: 85 },
  { id: '101', kind: 'booth', street: 'roswell', x: 0, y: 845, w: 140, h: 115 },
  { id: '101-A', kind: 'case', street: 'roswell', x: 145, y: 814, w: 20, h: 20 },
  { id: 'M', kind: 'case', street: 'roswell', x: 150, y: 836, w: 18, h: 30 },
  { id: 'L', kind: 'case', street: 'roswell', x: 150, y: 866, w: 18, h: 30 },
  { id: 'K', kind: 'case', street: 'roswell', x: 150, y: 896, w: 18, h: 30 },
  { id: 'J', kind: 'case', street: 'roswell', x: 155, y: 930, w: 20, h: 26 },
  { id: 'I', kind: 'case', street: 'roswell', x: 175, y: 930, w: 20, h: 26 },
  { id: '105-A', kind: 'booth', street: 'roswell', x: 214, y: 910, w: 48, h: 50, confirm: true },
  { id: '105-B', kind: 'booth', street: 'roswell', x: 272, y: 910, w: 60, h: 50, confirm: true },
  { id: '107', kind: 'booth', street: 'roswell', x: 450, y: 850, w: 60, h: 110 },
  { id: '109', kind: 'booth', street: 'roswell', x: 510, y: 850, w: 180, h: 110 },
  { id: '111', kind: 'booth', street: 'roswell', x: 690, y: 850, w: 85, h: 110 },
  { id: '113', kind: 'booth', street: 'roswell', x: 775, y: 850, w: 80, h: 110 },
  { id: '115', kind: 'booth', street: 'roswell', x: 910, y: 850, w: 140, h: 110 },
  { id: '107-A', kind: 'case', street: 'roswell', x: 500, y: 814, w: 22, h: 20 },
  { id: 'R', kind: 'case', street: 'roswell', x: 680, y: 810, w: 20, h: 20 },
  { id: 'S', kind: 'case', street: 'roswell', x: 770, y: 810, w: 20, h: 20 },
  { id: 'T', kind: 'case', street: 'roswell', x: 850, y: 810, w: 20, h: 20 },
  { id: '117', kind: 'booth', street: 'roswell', x: 1065, y: 828, w: 88, h: 16, confirm: true },
  { id: 'A', kind: 'case', street: 'roswell', x: 210, y: 872, w: 16, h: 16 },
  { id: 'B', kind: 'case', street: 'roswell', x: 210, y: 848, w: 16, h: 16 },
  { id: 'C', kind: 'case', street: 'roswell', x: 218, y: 830, w: 16, h: 16 },
  { id: 'D', kind: 'case', street: 'roswell', x: 247, y: 830, w: 16, h: 16 },
  { id: 'E', kind: 'case', street: 'roswell', x: 276, y: 830, w: 16, h: 16 },
  { id: 'F', kind: 'case', street: 'roswell', x: 305, y: 830, w: 16, h: 16 },
  { id: 'G', kind: 'case', street: 'roswell', x: 322, y: 848, w: 16, h: 16 },
  { id: 'H', kind: 'case', street: 'roswell', x: 322, y: 872, w: 16, h: 16 },
]

const BY_ID = new Map(SPACES.map((s) => [s.id, s]))
const STREET_BY_ID = new Map(STREETS.map((s) => [s.id, s]))

export function getSpace(id: string): Space | undefined {
  return BY_ID.get(id)
}

export function getStreet(id: StreetId): Street {
  return STREET_BY_ID.get(id)!
}

export function spaceCenter(s: Space): { x: number; y: number } {
  return { x: s.x + s.w / 2, y: s.y + s.h / 2 }
}

const KIND_WORD: Record<SpaceKind, string> = { booth: 'Booth', endcap: 'End cap', case: 'Case' }

/** "Booth 705", "End cap 6-D", "Case K3". */
export function spaceTitle(s: Space): string {
  return `${KIND_WORD[s.kind]} ${s.id}`
}
