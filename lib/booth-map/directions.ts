/**
 * Walking directions from the main entrance to any space on the floor plan, and booth search.
 * Browser-safe. Worked out from the floor plan, so a change to a space's position or street
 * updates its directions too.
 *
 * Every route starts at the main entrance, which opens onto Roswell Street with Marietta Street
 * straight ahead. Sides ("on your left") are given for someone walking away from the entrance:
 * north up the front-to-back streets, east or west along the side-to-side ones.
 */
import {
  CHEROKEE_MIDDLE,
  ENTRANCE,
  ISLANDS,
  LANDMARKS,
  POWDER_SPRINGS_WEST,
  SPACES,
  STREETS,
  getSpace,
  getStreet,
  spaceCenter,
  spaceTitle,
  type Space,
  type Street,
  type StreetId,
} from './floor-plan'

type Side = 'left' | 'right'

const NS = STREETS.filter((s) => s.axis === 'ns')

/** The front-to-back street straight ahead of the entrance (Marietta Street). */
const AHEAD = NS.reduce((best, s) => (Math.abs(s.at - ENTRANCE.centerX) < Math.abs(best.at - ENTRANCE.centerX) ? s : best))

/** Spaces closer than this to the entrance's center line count as "right by the entrance". */
const BY_ENTRANCE = 60

const ORDINALS = ['first', 'second', 'third']

/** "Polk and Lawrence Streets", "Polk, Lawrence and Church Streets", "Whitlock Avenue and Kennesaw Street". */
function joinStreets(streets: readonly Street[]): string {
  const names = streets.map((s) => s.name)
  if (names.every((n) => n.endsWith(' Street'))) {
    const short = names.map((n) => n.slice(0, -' Street'.length))
    const list = short.length === 1 ? short[0] : `${short.slice(0, -1).join(', ')} and ${short[short.length - 1]}`
    return `${list} ${short.length === 1 ? 'Street' : 'Streets'}`
  }
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/**
 * From the entrance to the bottom of a front-to-back street, facing up it. With `then`, the
 * route carries on up that street to a side-to-side street and turns onto it.
 */
function approach(street: Street, then?: { to: string; turn: Side }): string {
  const dir: Side = street.at > ENTRANCE.centerX ? 'right' : 'left'
  const up: Side = dir === 'right' ? 'left' : 'right'
  const onward = then ? ` to ${then.to}, and turn ${then.turn}` : ''
  if (street.id === AHEAD.id) {
    return then
      ? `Walk straight up ${street.name} to ${then.to} and turn ${then.turn}.`
      : `Walk straight in. ${street.name} is right in front of you.`
  }
  const onTheWay = NS.filter((s) => (dir === 'right' ? s.at > AHEAD.at && s.at < street.at : s.at < AHEAD.at && s.at > street.at))
  const farthest = dir === 'right' ? NS[NS.length - 1] : NS[0]
  if (street.id === farthest.id && onTheWay.length >= 2) {
    return then
      ? `Turn ${dir} on Roswell Street and go all the way to ${street.name}. Turn ${up}, walk up to ${then.to} and turn ${then.turn}.`
      : `Turn ${dir} on Roswell Street and go all the way to ${street.name}, then turn ${up}.`
  }
  if (onTheWay.length === 0) return `Turn ${dir} on Roswell Street, then ${up} up ${street.name}${onward}.`
  return `Turn ${dir} on Roswell Street. Pass ${joinStreets(onTheWay)}, then turn ${up} up ${street.name}${onward}.`
}

/** How far up a front-to-back street, as words. */
function depthWords(s: Space): string {
  const t = (ISLANDS.frontY - spaceCenter(s).y) / (ISLANDS.frontY - ISLANDS.backY)
  if (s.kind === 'endcap') return t < 1 / 3 ? 'at the front cross wall' : t < 2 / 3 ? 'at the middle cross wall' : 'at the back cross wall'
  if (t <= 0) return 'at the front, by Roswell Street'
  if (t < 1 / 3) return 'near the front'
  if (t < 2 / 3) return 'about halfway up'
  if (t < 1) return 'toward the back'
  return 'at the far end of the aisle'
}

function onFrontToBack(s: Space, street: Street): string {
  const c = spaceCenter(s)
  const title = spaceTitle(s)
  const where = depthWords(s)
  const middle = street.id === 'cherokee' && c.x >= CHEROKEE_MIDDLE.from && c.x <= CHEROKEE_MIDDLE.to
  const joiner = s.kind === 'endcap' ? ' ' : ', '
  if (middle) return `${title} is in the middle of the aisle${joiner}${where}.`
  // Beyond the men's restroom, which closes off the end of Whitlock Avenue.
  const mensRoom = LANDMARKS.find((l) => l.name.startsWith('Men'))!
  if (street.id === 'whitlock' && c.y < mensRoom.y) return `${title} is past the far end of the aisle, between the restrooms.`
  const side: Side = c.x < street.at ? 'left' : 'right'
  return `${title} is on your ${side}${joiner}${where}.`
}

/** The front-to-back streets either side of an x position, for "between Church and Atlanta Streets". */
function between(x: number): string {
  const west = [...NS].reverse().find((s) => s.at <= x)
  const east = NS.find((s) => s.at > x)
  if (west && east) return `between ${joinStreets([west, east])}`
  return 'at the far end'
}

function onRoswell(s: Space): string {
  const c = spaceCenter(s)
  const title = spaceTitle(s)
  const roswell = getStreet('roswell')
  const cashier = c.x > 205 && c.x < 345 && c.y > 820
  if (cashier) return `${title} is ${s.kind === 'case' ? 'at' : 'by'} the cashier counter, just to your left as you walk in.`
  if (Math.abs(c.x - ENTRANCE.centerX) < BY_ENTRANCE) return `${title} is right by the entrance.`
  const dir: Side = c.x > ENTRANCE.centerX ? 'right' : 'left'
  const north = c.y < roswell.at
  // Walking east, the north side is on your left; walking west, it's on your right.
  const side: Side = (dir === 'right') === north ? 'left' : 'right'
  const corner = c.x < NS[0].at || c.x > NS[NS.length - 1].at
  const where = corner ? 'in the corner' : between(c.x)
  return `Turn ${dir} on Roswell Street. ${title} is on your ${side}, ${where}.`
}

/** Spaces on the same street and side, from the turn toward the target: "the second booth on your left". */
function countAlong(s: Space, fromX: number, sameSide: (o: Space) => boolean): number {
  const c = spaceCenter(s)
  const toward = Math.sign(c.x - fromX) || 1
  const ahead = SPACES.filter((o) => o.street === s.street && o.kind === s.kind && sameSide(o)).filter((o) => {
    const ox = spaceCenter(o).x
    return (ox - fromX) * toward >= 0 && (c.x - ox) * toward >= 0
  })
  return ahead.length
}

function alongWords(s: Space, n: number): string {
  if (s.kind !== 'booth') return ''
  return n <= ORDINALS.length ? `the ${ORDINALS[n - 1]} booth` : `about ${n} booths along`
}

function onFairground(s: Space): string {
  const c = spaceCenter(s)
  const fair = getStreet('fairground')
  const feeder = NS.reduce((best, st) => (Math.abs(st.at - c.x) < Math.abs(best.at - c.x) ? st : best))
  const turn: Side = c.x >= feeder.at ? 'right' : 'left'
  const north = c.y < fair.at
  const side: Side = (turn === 'right') === north ? 'left' : 'right'
  const route = approach(feeder, { to: fair.name, turn })
  const along = alongWords(s, countAlong(s, feeder.at, (o) => spaceCenter(o).y < fair.at === north))
  const title = spaceTitle(s)
  return `${route} ${along ? `${title} is ${along} on your ${side}.` : `${title} is on your ${side}.`}`
}

function onPowderSprings(s: Space): string {
  const c = spaceCenter(s)
  const ps = getStreet('powder-springs')
  const cherokee = getStreet('cherokee')
  const westEnd = c.x >= POWDER_SPRINGS_WEST.from && c.x <= POWDER_SPRINGS_WEST.to
  const lineY = westEnd ? POWDER_SPRINGS_WEST.at : ps.at
  const north = c.y < lineY
  const turn: Side = c.x > cherokee.at ? 'right' : 'left'
  const side: Side = (turn === 'right') === north ? 'left' : 'right'
  const route = `${approach(cherokee)} Walk to the far end and turn ${turn} on ${ps.name}.`
  const title = spaceTitle(s)
  const sameSide = (o: Space) => {
    const oc = spaceCenter(o)
    const oWest = oc.x >= POWDER_SPRINGS_WEST.from && oc.x <= POWDER_SPRINGS_WEST.to
    return oc.y < (oWest ? POWDER_SPRINGS_WEST.at : ps.at) === north
  }
  const n = countAlong(s, cherokee.at, sameSide)
  if (s.kind === 'booth' && n <= ORDINALS.length) return `${route} ${title} is ${alongWords(s, n)} on your ${side}.`
  const share = Math.abs(cherokee.at - c.x) / (cherokee.at - POWDER_SPRINGS_WEST.from)
  const where = share < 0.45 ? 'partway along' : share < 0.8 ? 'about halfway along' : 'near the far end, by the event room'
  return `${route} ${title} is on your ${side}, ${where}.`
}

/** Walking directions from the main entrance, or null for a number that isn't on the floor plan. */
export function directionsFor(id: string): string | null {
  const s = getSpace(id)
  if (!s) return null
  const street = getStreet(s.street)
  if (street.id === 'roswell') return onRoswell(s)
  if (street.id === 'fairground') return onFairground(s)
  if (street.id === 'powder-springs') return onPowderSprings(s)
  return `${approach(street)} ${onFrontToBack(s, street)}`
}

/** "Booth 705 · Marietta Street" */
export function spaceSubtitle(s: Space): string {
  return getStreet(s.street).name
}

/**
 * Finds a space from what a shopper types: "705", "booth 705", "#705", "2000a", "9b", "k 3".
 * One booth of a combined pair ("1004") finds the pair ("1004-1006").
 */
export function findSpace(query: string): Space | null {
  const q = query
    .toUpperCase()
    .replace(/^\s*(BOOTH|CASE|END\s*CAP|ENDCAP|SPACE|NO\.?|#)\s*/, '')
    .replace(/[\s#]/g, '')
  if (!q) return null
  const direct = getSpace(q)
  if (direct) return direct
  const dashed = q.replace(/^(\d+)-?([A-Z])$/, '$1-$2')
  if (getSpace(dashed)) return getSpace(dashed)!
  const k = q.replace(/^K-?(\d)$/, 'K$1')
  if (getSpace(k)) return getSpace(k)!
  return SPACES.find((s) => s.id.includes('-') && /^\d+-\d+$/.test(s.id) && s.id.split('-').includes(q)) ?? null
}

/** A street from what a shopper types: "marietta", "Marietta St", "cherokee street". */
export function findStreet(query: string): Street | null {
  const q = query.toLowerCase().replace(/\b(street|st|avenue|ave)\b\.?/g, '').replace(/\s+/g, ' ').trim()
  if (q.length < 3) return null
  return STREETS.find((s) => s.name.toLowerCase().startsWith(q)) ?? null
}

/** A street's spaces from the front (Roswell Street) to the back, or west to east for side-to-side streets. */
export function spacesOnStreet(id: StreetId): Space[] {
  const street = getStreet(id)
  return SPACES.filter((s) => s.street === id).sort((a, b) =>
    street.axis === 'ns' ? spaceCenter(b).y - spaceCenter(a).y || spaceCenter(a).x - spaceCenter(b).x : spaceCenter(a).x - spaceCenter(b).x || spaceCenter(a).y - spaceCenter(b).y
  )
}
