'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import Link from 'next/link'
import { Maximize2, Minus, Plus, X } from 'lucide-react'
import {
  ENTRANCE,
  FLOOR,
  LANDMARKS,
  SPACES,
  STREETS,
  getSpace,
  getStreet,
  spaceCenter,
  spaceTitle,
  type Space,
  type StreetId,
} from '@/lib/booth-map/floor-plan'
import { directionsFor, findSpace, findStreet, spacesOnStreet } from '@/lib/booth-map/directions'

/**
 * The store map (SPEC 8, build step 6): the whole floor drawn from lib/booth-map/floor-plan.ts on
 * the charcoal map surface, with the main entrance at the bottom so it matches the store as you walk in.
 *
 * - Every space is drawn. Only booths with a vendor shoppers can see ("lit") are tappable; any
 *   space can still be found by typing its number.
 * - Drag to move, pinch or + and - to zoom (trackpad pinch too). Plain mouse-wheel scrolling
 *   scrolls the page, never the map.
 * - ?booth=705 opens the map on that space; selecting a space keeps the address in step
 *   (replaceState, so the back button still leaves the page).
 * - A list by street is the alternative to the drawing, for anyone who prefers a list and for
 *   screen readers.
 */

type View = { x: number; y: number; w: number; h: number }

const PAD = 24
const MIN_W = 200
const FOCUS_W = 520

const C = {
  floor: '#323232',
  wall: '#6B6B6B',
  line: '#5A5A5A',
  dim: '#A3A3A3',
  case: '#3B3B3B',
  lit: '#F7F0E8',
  litFill: '#3A3733',
  selected: '#EFC393',
  landmark: '#3A4249',
  landmarkText: '#C8D5E0',
  staff: '#373737',
  staffText: '#8F8F8F',
  street: '#E8DDD0',
  entrance: '#C2DFC9',
} as const

const STREET_ORDER: StreetId[] = ['roswell', 'whitlock', 'kennesaw', 'marietta', 'polk', 'lawrence', 'church', 'atlanta', 'cherokee', 'fairground', 'powder-springs']

/** Each street's spaces, front to back, worked out once. */
const ON_STREET = Object.fromEntries(STREET_ORDER.map((id) => [id, spacesOnStreet(id)])) as Record<StreetId, Space[]>

function fullView(aspect: number): View {
  const fw = FLOOR.width + PAD * 2
  const fh = FLOOR.height + PAD * 2
  let w = fw
  let h = fw * aspect
  if (h < fh) {
    h = fh
    w = fh / aspect
  }
  return { x: (FLOOR.width - w) / 2, y: (FLOOR.height - h) / 2, w, h }
}

function clampView(v: View, aspect: number): View {
  const full = fullView(aspect)
  const w = Math.min(Math.max(v.w, MIN_W), full.w)
  const h = w * aspect
  const clampAxis = (pos: number, size: number, floor: number) =>
    size >= floor + PAD * 2 ? (floor - size) / 2 : Math.min(Math.max(pos, -PAD), floor + PAD - size)
  return { x: clampAxis(v.x, w, FLOOR.width), y: clampAxis(v.y, h, FLOOR.height), w, h }
}

function viewOn(s: Space, aspect: number): View {
  const c = spaceCenter(s)
  const w = Math.min(FOCUS_W, fullView(aspect).w)
  const h = w * aspect
  return clampView({ x: c.x - w / 2, y: c.y - h / 2, w, h }, aspect)
}

function viewOnStreet(id: StreetId, aspect: number): View {
  const spaces = ON_STREET[id]
  const x0 = Math.min(...spaces.map((s) => s.x)) - 40
  const x1 = Math.max(...spaces.map((s) => s.x + s.w)) + 40
  const y0 = Math.min(...spaces.map((s) => s.y)) - 40
  const y1 = Math.max(...spaces.map((s) => s.y + s.h)) + 40
  const w = Math.max(x1 - x0, (y1 - y0) / aspect)
  const h = w * aspect
  return clampView({ x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h }, aspect)
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** One space on the drawing. */
function SpaceShape({ s, lit, selected }: { s: Space; lit: boolean; selected: boolean }) {
  const label = s.label ?? s.id
  const tall = s.w < 24 && s.h > s.w
  // Fit the number inside its space: by kind, by the space's thickness, and by the label's length.
  const base = s.kind === 'endcap' ? 8 : s.w < 26 ? 9 : s.w < 45 ? 11 : 14
  const across = tall || (s.kind === 'endcap' && s.h > s.w) ? s.h : s.w
  const thick = tall || (s.kind === 'endcap' && s.h > s.w) ? s.w : s.h
  const size = Math.max(6, Math.min(base, thick * 0.62, across / (label.length * 0.7)))
  const cx = s.x + s.w / 2
  const cy = s.y + s.h / 2
  const fill = selected ? C.selected : lit ? C.litFill : s.kind === 'case' ? C.case : 'none'
  const stroke = selected ? C.lit : lit ? C.lit : C.line
  const text = selected ? '#000000' : lit ? C.lit : C.dim
  return (
    <>
      <rect
        x={s.x + 1}
        y={s.y + 1}
        width={Math.max(s.w - 2, 1)}
        height={Math.max(s.h - 2, 1)}
        rx={s.kind === 'endcap' ? 1.5 : 3}
        fill={fill}
        stroke={stroke}
        strokeWidth={selected ? 3.5 : lit ? 1.8 : 1}
      />
      {s.kind !== 'endcap' || s.h > 18 ? (
        <text
          x={cx}
          y={cy + size * 0.36}
          textAnchor="middle"
          fontSize={size}
          fontWeight={700}
          fill={text}
          transform={tall || (s.kind === 'endcap' && s.h > s.w) ? `rotate(-90 ${cx} ${cy})` : undefined}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {label}
        </text>
      ) : null}
    </>
  )
}

/** The whole drawing. Memoized so dragging the map (a new viewBox) never re-renders the 239 spaces. */
const Floor = memo(function Floor({
  lit,
  selected,
  onKeySelect,
  onFocusSpace,
}: {
  lit: ReadonlySet<string>
  selected: string | null
  onKeySelect: (id: string) => void
  onFocusSpace: (id: string) => void
}) {
  return (
    <g fontFamily="Inter, system-ui, sans-serif">
      <rect x={0} y={0} width={FLOOR.width} height={FLOOR.height} rx={4} fill={C.floor} stroke={C.wall} strokeWidth={3} />
      {LANDMARKS.map((l) => {
        const narrow = l.w < 60
        const cx = l.x + l.w / 2
        const cy = l.y + l.h / 2
        return (
          <g key={l.name} aria-hidden="true">
            <rect x={l.x} y={l.y} width={l.w} height={l.h} fill={l.staff ? C.staff : C.landmark} />
            <text
              x={cx}
              y={cy + 4.5}
              textAnchor="middle"
              fontSize={13}
              fontWeight={600}
              fill={l.staff ? C.staffText : C.landmarkText}
              transform={narrow ? `rotate(-90 ${cx} ${cy})` : undefined}
            >
              {l.name}
            </text>
          </g>
        )
      })}
      {SPACES.map((s) => {
        const isLit = lit.has(s.id)
        const isSelected = selected === s.id
        if (!isLit) {
          return (
            <g key={s.id} aria-hidden="true">
              <SpaceShape s={s} lit={false} selected={isSelected} />
            </g>
          )
        }
        return (
          <g
            key={s.id}
            data-space={s.id}
            role="button"
            tabIndex={0}
            aria-label={`${spaceTitle(s)}, ${getStreet(s.street).name}`}
            aria-pressed={isSelected}
            className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-[#C2DFC9] [&:focus-visible>rect]:[stroke-width:4]"
            onKeyDown={(e: KeyboardEvent<SVGGElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onKeySelect(s.id)
              }
            }}
            // Screen readers (VoiceOver, NVDA, JAWS) activate with a synthetic click (detail 0).
            // Mouse and touch taps are handled by the map's pointer events instead.
            onClick={(e: MouseEvent<SVGGElement>) => {
              if (e.detail === 0) onKeySelect(s.id)
            }}
            onFocus={() => onFocusSpace(s.id)}
          >
            <SpaceShape s={s} lit selected={isSelected} />
          </g>
        )
      })}
      <g aria-hidden="true" fontSize={13} fontWeight={700} letterSpacing={2} fill={C.street} fillOpacity={0.82}>
        {STREETS.map((st) => (
          <text
            key={st.id}
            x={st.labelX}
            y={st.labelY}
            textAnchor="middle"
            transform={st.axis === 'ns' ? `rotate(-90 ${st.labelX} ${st.labelY})` : undefined}
          >
            {st.name.toUpperCase()}
          </text>
        ))}
        <text x={375} y={177} textAnchor="middle" fontSize={11}>
          POWDER SPRINGS ST
        </text>
      </g>
      <g aria-hidden="true">
        <rect x={ENTRANCE.x} y={ENTRANCE.y} width={ENTRANCE.w} height={ENTRANCE.h} fill={C.entrance} />
        <path d={`M${ENTRANCE.centerX} 946 V928 M${ENTRANCE.centerX - 7} 935 L${ENTRANCE.centerX} 928 L${ENTRANCE.centerX + 7} 935`} stroke={C.entrance} strokeWidth={3} fill="none" />
        <text x={ENTRANCE.centerX} y={906} textAnchor="middle" fontSize={12} fontWeight={700} letterSpacing={1.5} fill={C.entrance}>
          MAIN
        </text>
        <text x={ENTRANCE.centerX} y={921} textAnchor="middle" fontSize={12} fontWeight={700} letterSpacing={1.5} fill={C.entrance}>
          ENTRANCE
        </text>
      </g>
    </g>
  )
})

export default function StoreMap({ lit: litList }: { lit: string[] }) {
  const lit = useMemo(() => new Set(litList), [litList])
  const boxRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [aspect, setAspect] = useState(0.75)
  const [view, setView] = useState<View>(() => fullView(0.75))
  const viewRef = useRef(view)
  const aspectRef = useRef(aspect)
  const animRef = useRef<number | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [street, setStreet] = useState<StreetId | null>(null)
  const [mode, setMode] = useState<'map' | 'list'>('map')
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')

  const applyView = useCallback((v: View) => {
    viewRef.current = v
    setView(v)
  }, [])

  const animateTo = useCallback(
    (target: View) => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      const from = viewRef.current
      if (prefersReducedMotion()) return applyView(target)
      const start = performance.now()
      const step = (now: number) => {
        const t = Math.min((now - start) / 280, 1)
        const e = 1 - Math.pow(1 - t, 3)
        applyView({
          x: from.x + (target.x - from.x) * e,
          y: from.y + (target.y - from.y) * e,
          w: from.w + (target.w - from.w) * e,
          h: from.h + (target.h - from.h) * e,
        })
        animRef.current = t < 1 ? requestAnimationFrame(step) : null
      }
      animRef.current = requestAnimationFrame(step)
    },
    [applyView]
  )

  const setAddress = useCallback((id: string | null) => {
    const url = new URL(window.location.href)
    if (id) url.searchParams.set('booth', id)
    else url.searchParams.delete('booth')
    // null state, as the Next.js docs show, so the router adopts the new address instead of restoring the old one.
    window.history.replaceState(null, '', url)
  }, [])

  const panelRef = useRef<HTMLDivElement>(null)

  /** On phones the panel sits under the map: scroll just enough to show the directions. */
  const revealPanel = useCallback(() => {
    if (!window.matchMedia('(max-width: 1023px)').matches) return
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' }))
  }, [])

  const select = useCallback(
    (id: string, how: 'animate' | 'jump' = 'animate') => {
      const s = getSpace(id)
      if (!s) return
      setSelected(id)
      setStreet(null)
      setMessage('')
      setAddress(id)
      const target = viewOn(s, aspectRef.current)
      if (how === 'jump') applyView(target)
      else {
        animateTo(target)
        revealPanel()
      }
    },
    [animateTo, applyView, revealPanel, setAddress]
  )

  /** Tabbing to a booth that's off screen moves the map to it, at the current zoom. */
  const focusSpace = useCallback(
    (id: string) => {
      const s = getSpace(id)
      if (!s) return
      const v = viewRef.current
      const c = spaceCenter(s)
      const m = 30
      if (c.x > v.x + m && c.x < v.x + v.w - m && c.y > v.y + m && c.y < v.y + v.h - m) return
      animateTo(clampView({ ...v, x: c.x - v.w / 2, y: c.y - v.h / 2 }, aspectRef.current))
    },
    [animateTo]
  )

  const showStreet = useCallback(
    (id: StreetId) => {
      setStreet(id)
      setSelected(null)
      setMessage('')
      setAddress(null)
      animateTo(viewOnStreet(id, aspectRef.current))
      revealPanel()
    },
    [animateTo, revealPanel, setAddress]
  )

  const showAll = useCallback(() => {
    setSelected(null)
    setStreet(null)
    setAddress(null)
    animateTo(fullView(aspectRef.current))
  }, [animateTo, setAddress])

  // Keep the drawing's shape in step with the box (square on phones, 4:3 from small tablets up).
  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const ro = new ResizeObserver(() => {
      const r = box.getBoundingClientRect()
      if (!r.width || !r.height) return
      const a = r.height / r.width
      if (Math.abs(a - aspectRef.current) < 0.001) return
      const v = viewRef.current
      const wasFull = v.w >= fullView(aspectRef.current).w - 1
      aspectRef.current = a
      setAspect(a)
      applyView(wasFull ? fullView(a) : clampView({ ...v, y: v.y + v.h / 2 - (v.w * a) / 2, h: v.w * a }, a))
    })
    ro.observe(box)
    return () => ro.disconnect()
  }, [applyView])

  // Open on ?booth=705.
  const opened = useRef(false)
  useEffect(() => {
    if (opened.current) return
    opened.current = true
    const raw = new URLSearchParams(window.location.search).get('booth')
    if (!raw) return
    const s = findSpace(raw)
    if (s) {
      // Wait a frame so the box has its final size before zooming in.
      requestAnimationFrame(() => select(s.id, 'jump'))
    }
    // Runs once on load; later selections update the address themselves.
  }, [select])

  // Trackpad pinch arrives as ctrl + wheel. Ordinary wheel scrolling is left to the page.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      if (animRef.current) cancelAnimationFrame(animRef.current)
      const r = svg.getBoundingClientRect()
      const v = viewRef.current
      const factor = Math.exp(e.deltaY * 0.01)
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      const w = v.w * factor
      const h = w * aspectRef.current
      applyView(clampView({ x: v.x + px * (v.w - w), y: v.y + py * (v.h - h), w, h }, aspectRef.current))
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    // Safari on a Mac sends trackpad pinch as gesture events, not ctrl + wheel. Touch screens
    // are left to the pointer events, so a phone pinch is never handled twice.
    type Gesture = Event & { scale: number }
    let start: View | null = null
    const onGestureStart = (e: Event) => {
      e.preventDefault()
      if (animRef.current) cancelAnimationFrame(animRef.current)
      start = viewRef.current
    }
    const onGestureChange = (e: Event) => {
      e.preventDefault()
      if (!start) return
      const w = start.w / ((e as Gesture).scale || 1)
      const h = w * aspectRef.current
      applyView(clampView({ x: start.x + (start.w - w) / 2, y: start.y + (start.h - h) / 2, w, h }, aspectRef.current))
    }
    const trackpad = navigator.maxTouchPoints === 0
    if (trackpad) {
      svg.addEventListener('gesturestart', onGestureStart)
      svg.addEventListener('gesturechange', onGestureChange)
    }
    return () => {
      svg.removeEventListener('wheel', onWheel)
      if (trackpad) {
        svg.removeEventListener('gesturestart', onGestureStart)
        svg.removeEventListener('gesturechange', onGestureChange)
      }
    }
  }, [applyView])

  const zoomBy = (factor: number) => {
    const v = viewRef.current
    const w = v.w * factor
    const h = w * aspectRef.current
    animateTo(clampView({ x: v.x + (v.w - w) / 2, y: v.y + (v.h - h) / 2, w, h }, aspectRef.current))
  }

  // Drag to move, two fingers to zoom, and a tap (no movement) selects a lit booth.
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{
    moved: boolean
    target: string | null
    startX: number
    startY: number
    startView: View
    pinch?: { dist: number; mid: { x: number; y: number }; svgMid: { x: number; y: number } }
  } | null>(null)

  const beginGesture = (target: string | null, moved: boolean) => {
    const [p1, p2] = [...pointers.current.values()]
    const r = svgRef.current!.getBoundingClientRect()
    const v = viewRef.current
    const g: NonNullable<typeof gesture.current> = { moved, target, startX: p1.x, startY: p1.y, startView: v }
    if (p2) {
      const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
      g.pinch = {
        dist: Math.hypot(p1.x - p2.x, p1.y - p2.y) || 1,
        mid,
        svgMid: { x: v.x + ((mid.x - r.left) / r.width) * v.w, y: v.y + ((mid.y - r.top) / r.height) * v.h },
      }
      g.moved = true
    }
    gesture.current = g
  }

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (animRef.current) cancelAnimationFrame(animRef.current)
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const target = (e.target as Element).closest('[data-space]')?.getAttribute('data-space') ?? null
    beginGesture(pointers.current.size === 1 ? target : null, pointers.current.size > 1)
  }

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (!g) return
    const r = e.currentTarget.getBoundingClientRect()
    const a = aspectRef.current
    if (g.pinch && pointers.current.size >= 2) {
      const [p1, p2] = [...pointers.current.values()]
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y) || 1
      const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
      const w = g.startView.w * (g.pinch.dist / dist)
      const h = w * a
      const x = g.pinch.svgMid.x - ((mid.x - r.left) / r.width) * w
      const y = g.pinch.svgMid.y - ((mid.y - r.top) / r.height) * h
      applyView(clampView({ x, y, w, h }, a))
      return
    }
    const dx = e.clientX - g.startX
    const dy = e.clientY - g.startY
    if (!g.moved && Math.hypot(dx, dy) < 6) return
    g.moved = true
    const scale = g.startView.w / r.width
    applyView(clampView({ ...g.startView, x: g.startView.x - dx * scale, y: g.startView.y - dy * scale }, a))
  }

  const endPointer = (e: ReactPointerEvent<SVGSVGElement>, cancelled: boolean) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.delete(e.pointerId)
    const g = gesture.current
    if (pointers.current.size === 0) {
      if (!cancelled && g && !g.moved && g.target && lit.has(g.target)) select(g.target)
      gesture.current = null
    } else {
      // One finger left after a pinch: carry on dragging from where it is, without selecting.
      beginGesture(null, true)
    }
  }

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    const s = findSpace(q)
    if (s) {
      setMode('map')
      select(s.id)
      return
    }
    const st = findStreet(q)
    if (st) {
      setMode('map')
      showStreet(st.id)
      return
    }
    setMessage(`There’s no space “${q}” on the floor plan. Check the number on the booth sign, or ask at the cashier.`)
  }

  const pickFromList = useCallback(
    (id: string) => {
      setMode('map')
      select(id)
      requestAnimationFrame(() => boxRef.current?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' }))
    },
    [select]
  )

  const space = selected ? getSpace(selected) ?? null : null
  const zoomed = view.w < fullView(aspect).w - 1

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={onSearch} className="flex w-full max-w-md gap-2" role="search">
          <label htmlFor="booth-search" className="sr-only">
            Find a booth by number or street
          </label>
          <input
            id="booth-search"
            type="text"
            inputMode="text"
            autoComplete="off"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Booth number, like 705"
            className="min-h-[48px] w-full min-w-0 rounded-lg border-2 border-champagne-dark bg-white px-3 text-base text-[#2C2416] placeholder:text-charcoal-lighter focus:border-charcoal focus:outline-none"
          />
          <button type="submit" className="min-h-[48px] shrink-0 rounded-lg border-2 border-mauve bg-mauve px-5 font-semibold text-black transition-colors hover:border-mauve-dark hover:bg-mauve-dark">
            Find
          </button>
        </form>
        <div className="flex gap-2" role="group" aria-label="How to show the booths">
          {(['map', 'list'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`min-h-[44px] rounded-full border-2 px-4 text-sm font-semibold transition-colors ${
                mode === m ? 'border-charcoal bg-charcoal text-white' : 'border-champagne-dark bg-white text-[#2C2416] hover:border-charcoal'
              }`}
            >
              {m === 'map' ? 'Map' : 'List by street'}
            </button>
          ))}
        </div>
      </div>
      <p className="-my-2 text-sm text-[#9B2C2C]" aria-live="polite">
        {message}
      </p>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className={mode === 'map' ? 'flex min-w-0 flex-col gap-2' : 'hidden'}>
          <div ref={boxRef} className="relative aspect-square max-h-[600px] w-full overflow-hidden rounded-xl bg-charcoal md:aspect-[4/3]">
            <svg
              ref={svgRef}
              viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
              // Zoomed out, a one-finger swipe scrolls the page (a phone held sideways can be shorter than the map);
              // zoomed in, the map takes every swipe so it can be dragged. Pinch works either way.
              className={`block h-full w-full select-none ${zoomed ? 'touch-none' : 'touch-pan-y'}`}
              role="group"
              aria-label="Store map. Main entrance at the bottom."
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={(e) => endPointer(e, false)}
              onPointerCancel={(e) => endPointer(e, true)}
            >
              <Floor lit={lit} selected={selected} onKeySelect={select} onFocusSpace={focusSpace} />
            </svg>
            <div className="absolute right-2 top-2 flex flex-col gap-2">
              <MapButton label="Zoom in" onClick={() => zoomBy(1 / 1.6)}>
                <Plus size={20} aria-hidden="true" />
              </MapButton>
              <MapButton label="Zoom out" onClick={() => zoomBy(1.6)}>
                <Minus size={20} aria-hidden="true" />
              </MapButton>
              {zoomed && (
                <MapButton label="Show the whole store" onClick={showAll}>
                  <Maximize2 size={18} aria-hidden="true" />
                </MapButton>
              )}
            </div>
          </div>
          <p className="text-sm text-charcoal-light">Drag to move. Pinch, or use + and −, to zoom.</p>
        </div>

        {mode === 'list' && (
          <div className="min-w-0">
            <StreetList lit={lit} selected={selected} onPick={pickFromList} />
          </div>
        )}

        <div ref={panelRef} aria-live="polite" className="min-w-0 scroll-mb-4">
          <Panel space={space} street={street} lit={lit} onPick={select} onClose={showAll} />
        </div>
      </div>
    </div>
  )
}

function MapButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#5A5A5A] bg-charcoal/90 text-champagne transition-colors hover:bg-charcoal-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-mint"
    >
      {children}
    </button>
  )
}

function Panel({
  space,
  street,
  lit,
  onPick,
  onClose,
}: {
  space: Space | null
  street: StreetId | null
  lit: ReadonlySet<string>
  onPick: (id: string) => void
  onClose: () => void
}) {
  if (space) {
    const isLit = lit.has(space.id)
    return (
      <section className="relative flex flex-col gap-3 rounded-xl border border-champagne-dark bg-white p-4" aria-label={spaceTitle(space)}>
        <button type="button" onClick={onClose} aria-label="Close and show the whole store" className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-charcoal-light hover:bg-champagne">
          <X size={20} aria-hidden="true" />
        </button>
        <div className="pr-10">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-charcoal-light">{getStreet(space.street).name}</p>
          <h2 className="font-display text-3xl text-[#2C2416]">{spaceTitle(space)}</h2>
        </div>
        <p className="rounded-lg bg-champagne px-3 py-2.5 text-[15px] leading-relaxed text-[#2C2416]">{directionsFor(space.id)}</p>
        {isLit ? (
          <Link
            href={`/new-arrivals/booth/${encodeURIComponent(space.id)}`}
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg border-2 border-mauve bg-mauve px-4 text-center font-semibold text-black transition-colors hover:border-mauve-dark hover:bg-mauve-dark"
          >
            See this booth’s finds
          </Link>
        ) : (
          <p className="text-sm text-charcoal-light">
            {space.kind === 'booth' ? 'This booth hasn’t posted finds on the site yet. Stop by and see it in person.' : 'Stop by to see what’s in it.'}
          </p>
        )}
      </section>
    )
  }
  if (street) {
    const spaces = ON_STREET[street]
    return (
      <section className="relative flex flex-col gap-3 rounded-xl border border-champagne-dark bg-white p-4" aria-label={getStreet(street).name}>
        <button type="button" onClick={onClose} aria-label="Close and show the whole store" className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-charcoal-light hover:bg-champagne">
          <X size={20} aria-hidden="true" />
        </button>
        <h2 className="pr-10 font-display text-3xl text-[#2C2416]">{getStreet(street).name}</h2>
        <p className="text-sm text-charcoal-light">{spaces.length} spaces, from the front of the store to the back. Pick one for directions.</p>
        <SpaceButtons spaces={spaces} lit={lit} selected={null} onPick={onPick} />
      </section>
    )
  }
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-champagne-dark bg-white p-4">
      <h2 className="font-display text-2xl text-[#2C2416]">Find a booth</h2>
      <p className="text-[15px] text-charcoal-light">Type a booth number, or tap a booth outlined in white to see its finds. Every space gets walking directions from the front door.</p>
      <ul className="flex flex-col gap-2 text-sm text-[#2C2416]">
        <li className="flex items-center gap-3">
          <Swatch className="border-2 border-[#F7F0E8] bg-[#3A3733]" />
          Posts its finds on the site
        </li>
        <li className="flex items-center gap-3">
          <Swatch className="border border-[#5A5A5A] bg-[#323232]" />
          Other booths, end caps and cases
        </li>
        <li className="flex items-center gap-3">
          <Swatch className="border-2 border-[#F7F0E8] bg-mauve" />
          The booth you picked
        </li>
      </ul>
      <p className="text-sm text-charcoal-light">The 100s are on Roswell Street by the entrance, the 700s on Marietta Street, and so on: the number tells you the street.</p>
    </section>
  )
}

/** A legend sample, drawn on a scrap of the charcoal map so light outlines show on the white panel. */
function Swatch({ className }: { className: string }) {
  return (
    <span className="inline-flex h-8 w-11 shrink-0 items-center justify-center rounded-md bg-charcoal" aria-hidden="true">
      <span className={`block h-5 w-7 rounded ${className}`} />
    </span>
  )
}

function SpaceButtons({ spaces, lit, selected, onPick }: { spaces: Space[]; lit: ReadonlySet<string>; selected: string | null; onPick: (id: string) => void }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {spaces.map((s) => {
        const isLit = lit.has(s.id)
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onPick(s.id)}
              aria-pressed={selected === s.id}
              aria-label={`${spaceTitle(s)}${isLit ? ', posts its finds on the site' : ''}`}
              className={`min-h-[44px] min-w-[52px] rounded-lg border-2 px-2.5 text-sm font-semibold tabular-nums transition-colors ${
                selected === s.id
                  ? 'border-charcoal bg-mauve text-black'
                  : isLit
                    ? 'border-charcoal bg-charcoal text-champagne hover:bg-charcoal-light'
                    : 'border-champagne-dark bg-white text-[#2C2416] hover:border-charcoal'
              }`}
            >
              {s.id}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function StreetList({ lit, selected, onPick }: { lit: ReadonlySet<string>; selected: string | null; onPick: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-champagne-dark bg-white p-4">
      <p className="text-sm text-charcoal-light">Every space on the floor plan, street by street, from the front of the store to the back. Dark buttons post their finds on the site.</p>
      {STREET_ORDER.map((id) => (
        <section key={id} aria-labelledby={`street-${id}`}>
          <h3 id={`street-${id}`} className="mb-2 font-display text-xl text-[#2C2416]">
            {getStreet(id).name}
          </h3>
          <SpaceButtons spaces={ON_STREET[id]} lit={lit} selected={selected} onPick={onPick} />
        </section>
      ))}
    </div>
  )
}
