'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'
import { preparePhoto, uuid } from '@/lib/booth-map/photo-client'
import { parsePriceInput } from '@/lib/booth-map/pricing'
import { MAX_ITEMS_PER_POST } from '@/lib/booth-map/blob'

/**
 * Vendor upload page (SPEC section 5). Built for one thumb, standing in a booth:
 * one big button, uploads start the moment a photo is picked, Post stays off until
 * every photo has a title and a price (or "ask in store"), and typed text survives
 * a dropped connection or a reload.
 */

type Screen = 'home' | 'add' | 'done'

interface Draft {
  key: string
  /** 'missing': restored after a reload before its photo finished uploading. */
  state: 'preparing' | 'uploading' | 'uploaded' | 'failed' | 'missing'
  progress: number
  preview: string
  blobUrl?: string
  width?: number
  height?: number
  title: string
  price: string
  askInStore: boolean
  booth: string
  error?: string
  /** Kept in memory so a failed upload can be retried without picking the photo again. */
  file?: File
}

interface Props {
  vendorId: string
  displayName: string
  booths: string[]
  liveCount: number
  needsConsent: boolean
}

const EXPIRED = 'Your vendor link has expired. Tap the link the mall texted you again. Your text is saved on this phone.'
const storageKey = (vendorId: string) => `mam-booth-map-drafts:${vendorId}`

/** Saves every card's text, and the photo too once it has uploaded. */
function saveDrafts(vendorId: string, drafts: Draft[]) {
  try {
    const keep = drafts.map(({ key, blobUrl, width, height, title, price, askInStore, booth, state }) => ({
      key,
      blobUrl: state === 'uploaded' ? blobUrl : undefined,
      width,
      height,
      title,
      price,
      askInStore,
      booth,
    }))
    if (keep.length) localStorage.setItem(storageKey(vendorId), JSON.stringify(keep))
    else localStorage.removeItem(storageKey(vendorId))
  } catch {
    /* storage unavailable (private mode); drafts just won't survive a reload */
  }
}

function loadDrafts(vendorId: string, booths: string[]): Draft[] {
  try {
    const raw = localStorage.getItem(storageKey(vendorId))
    if (!raw) return []
    const list = JSON.parse(raw) as Array<Partial<Draft>>
    if (!Array.isArray(list)) return []
    return list
      .filter((d) => typeof d.key === 'string')
      .slice(0, MAX_ITEMS_PER_POST)
      .map((d) => {
        const uploaded = typeof d.blobUrl === 'string'
        // A booth that is no longer this vendor's is cleared, so the picker shows.
        const booth = booths.length === 1 ? booths[0] : booths.includes(d.booth ?? '') ? d.booth! : ''
        return {
          key: d.key!,
          state: uploaded ? ('uploaded' as const) : ('missing' as const),
          progress: uploaded ? 100 : 0,
          preview: uploaded ? d.blobUrl! : '',
          blobUrl: uploaded ? d.blobUrl : undefined,
          width: d.width,
          height: d.height,
          title: typeof d.title === 'string' ? d.title : '',
          price: typeof d.price === 'string' ? d.price : '',
          askInStore: d.askInStore === true,
          booth,
          error: uploaded ? undefined : 'Add this photo again. Your text is still here.',
        }
      })
  } catch {
    return []
  }
}

function revokePreview(d: Pick<Draft, 'preview'>) {
  if (d.preview.startsWith('blob:')) URL.revokeObjectURL(d.preview)
}

function boothLabel(booths: string[]) {
  if (booths.length === 0) return 'No booth assigned'
  return booths.length === 1 ? `Booth ${booths[0]}` : `Booths ${booths.join(', ')}`
}

export default function VendorApp({ vendorId, displayName, booths, liveCount, needsConsent }: Props) {
  const [screen, setScreen] = useState<Screen>('home')
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [consentNeeded, setConsentNeeded] = useState(needsConsent)
  const [consent, setConsent] = useState(false)
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({})
  const [posted, setPosted] = useState(0)
  const [postedIds, setPostedIds] = useState<string[]>([])
  const [live, setLive] = useState(liveCount)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const replaceTarget = useRef<string | null>(null)
  const queue = useRef<Promise<void>>(Promise.resolve())
  const postingRef = useRef(false)
  const dragDepth = useRef(0)
  const restored = useRef(false)
  const draftsRef = useRef<Draft[]>([])
  draftsRef.current = drafts

  // Restore saved cards after a reload or dropped connection.
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const saved = loadDrafts(vendorId, booths)
    if (saved.length) {
      setDrafts(saved)
      setScreen('add')
    }
  }, [vendorId, booths])

  useEffect(() => {
    if (restored.current) saveDrafts(vendorId, drafts)
  }, [vendorId, drafts])

  // Release preview images when the page goes away.
  useEffect(() => () => draftsRef.current.forEach(revokePreview), [])

  const patch = useCallback((key: string, change: Partial<Draft>) => {
    setDrafts((list) =>
      list.map((d) => {
        if (d.key !== key) return d
        if (change.preview !== undefined && change.preview !== d.preview) revokePreview(d)
        return { ...d, ...change }
      })
    )
  }, [])

  const uploadOne = useCallback(
    async (key: string, file: File) => {
      if (!draftsRef.current.some((d) => d.key === key)) return // removed while waiting in the queue
      try {
        patch(key, { state: 'preparing', progress: 0, error: undefined })
        const photo = await preparePhoto(file)
        patch(key, { state: 'uploading', preview: URL.createObjectURL(photo.blob), width: photo.width, height: photo.height })
        const result = await upload(`booth-map/${vendorId}/${uuid()}.jpg`, photo.blob, {
          access: 'public',
          handleUploadUrl: '/api/booth-map/upload',
          contentType: 'image/jpeg',
          onUploadProgress: ({ percentage }) => patch(key, { progress: Math.round(percentage) }),
        })
        patch(key, { state: 'uploaded', progress: 100, blobUrl: result.url, file: undefined })
        // Best effort: lets the cleanup job find photos that are never posted.
        fetch('/api/booth-map/uploads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: result.url }),
        }).catch(() => {})
      } catch (err) {
        let message = err instanceof Error && /read|process/.test(err.message) ? err.message : 'Upload failed. Check the connection and tap Retry.'
        // Tell a reset link apart from a network problem.
        const check = await fetch('/api/booth-map/session', { cache: 'no-store' }).catch(() => null)
        if (check?.status === 401) {
          message = EXPIRED
          setPostError(EXPIRED)
        }
        patch(key, { state: 'failed', error: message, file })
      }
    },
    [patch, vendorId]
  )

  const enqueue = useCallback((key: string, file: File) => {
    queue.current = queue.current.then(() => uploadOne(key, file))
  }, [uploadOne])

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      setPostError(null)
      const list = Array.from(files)

      // Re-picking the photo for one card that lost it.
      const target = replaceTarget.current
      replaceTarget.current = null
      if (target && list[0]) {
        patch(target, { state: 'preparing', error: undefined, file: list[0] })
        enqueue(target, list[0])
        return
      }

      const room = MAX_ITEMS_PER_POST - draftsRef.current.length
      const picked = list.slice(0, Math.max(0, room))
      if (list.length > picked.length) setPostError(`You can post up to ${MAX_ITEMS_PER_POST} photos at a time.`)
      const fresh: Draft[] = picked.map((file) => ({
        key: uuid(),
        state: 'preparing',
        progress: 0,
        preview: '',
        title: '',
        price: '',
        askInStore: false,
        booth: booths.length === 1 ? booths[0] : '',
        file,
      }))
      draftsRef.current = [...draftsRef.current, ...fresh] // so a second quick pick sees the true count
      setDrafts((l) => [...l, ...fresh])
      // One photo at a time keeps memory low on older phones.
      for (const d of fresh) enqueue(d.key, d.file!)
    },
    [booths, enqueue, patch]
  )

  const retry = (d: Draft) => {
    if (!d.file) return
    patch(d.key, { state: 'preparing', error: undefined }) // hides Retry so it can't be queued twice
    enqueue(d.key, d.file)
  }

  const pickFor = (key: string) => {
    replaceTarget.current = key
    fileInput.current?.click()
  }

  const remove = (key: string) => {
    setDrafts((list) => {
      list.filter((d) => d.key === key).forEach(revokePreview)
      return list.filter((d) => d.key !== key)
    })
    setCardErrors((e) => {
      const next = { ...e }
      delete next[key]
      return next
    })
  }

  const problems = useMemo(
    () =>
      drafts.map((d) => {
        if (d.state !== 'uploaded') return d.state === 'failed' || d.state === 'missing' ? 'failed' : 'uploading'
        if (!d.title.trim()) return 'title'
        if (!d.askInStore && !parsePriceInput(d.price).ok) return 'price'
        if (!d.booth) return 'booth'
        return null
      }),
    [drafts]
  )
  const ready = drafts.length > 0 && problems.every((p) => p === null) && (!consentNeeded || consent)

  let postLabel = `Post ${drafts.length} ${drafts.length === 1 ? 'item' : 'items'}`
  if (posting) postLabel = 'Posting…'
  else if (problems.includes('uploading')) postLabel = 'Uploading photos…'
  else if (problems.includes('failed')) postLabel = 'Fix or remove the photo marked in red'
  else if (problems.includes('booth')) postLabel = 'Pick a booth for each photo'
  else if (problems.some((p) => p === 'title' || p === 'price')) postLabel = 'Add a title and price to each photo'
  else if (consentNeeded && !consent) postLabel = 'Tick the box above to post'

  function finishPosted(sent: Set<string>, count: number, ids: string[] = []) {
    setPostedIds(ids)
    setDrafts((list) => {
      list.filter((d) => sent.has(d.key)).forEach(revokePreview)
      return list.filter((d) => !sent.has(d.key))
    })
    setPosted(count)
    setLive((n) => n + count)
    setConsentNeeded(false)
    setScreen('done')
    window.scrollTo(0, 0)
  }

  async function post() {
    if (!ready || postingRef.current) return
    postingRef.current = true
    setPosting(true)
    setPostError(null)
    setCardErrors({})
    const sentDrafts = drafts
    const sent = new Set(sentDrafts.map((d) => d.key))
    try {
      const res = await fetch('/api/booth-map/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent,
          items: sentDrafts.map((d) => ({
            url: d.blobUrl,
            width: d.width,
            height: d.height,
            title: d.title,
            price: d.askInStore ? null : d.price,
            askInStore: d.askInStore,
            booth: d.booth,
          })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) return finishPosted(sent, sentDrafts.length, Array.isArray(data.itemIds) ? data.itemIds : [])

      if (res.status === 401) return setPostError(EXPIRED)
      if (data.code === 'CONSENT_REQUIRED') {
        setConsentNeeded(true)
        setConsent(false)
        return setPostError(data.error)
      }
      if (data.code === 'ALREADY_POSTED' && Array.isArray(data.indexes)) {
        // An earlier tap went through but its reply was lost.
        const done = new Set((data.indexes as number[]).map((i) => sentDrafts[i]?.key).filter(Boolean) as string[])
        if (done.size === sentDrafts.length) return finishPosted(done, done.size)
        setDrafts((list) => list.filter((d) => !done.has(d.key)))
        return setPostError(`${done.size} of these ${done.size === 1 ? 'was' : 'were'} already posted. Tap Post again for the rest.`)
      }
      if (Array.isArray(data.errors)) {
        const map: Record<string, string> = {}
        for (const e of data.errors as Array<{ index: number; message: string }>) {
          const key = sentDrafts[e.index]?.key
          if (key && !map[key]) map[key] = e.message
        }
        setCardErrors(map)
      }
      setPostError(data.error || 'Posting failed. Check the connection and try again.')
    } catch {
      setPostError('No connection. Your photos and text are saved here. Try again when you have signal.')
    } finally {
      postingRef.current = false
      setPosting(false)
    }
  }

  const header = (
    <header className="bg-slate">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-charcoal">Marietta Antique Mall · {displayName}</p>
          <p className="font-display text-2xl text-black">{boothLabel(booths)}</p>
        </div>
        {screen !== 'home' && (
          <button type="button" onClick={() => setScreen('home')} disabled={posting} className="min-h-[44px] px-1 font-semibold text-black">
            ‹ Back
          </button>
        )}
      </div>
    </header>
  )

  if (screen === 'done') {
    return (
      <>
        {header}
        <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pb-10 pt-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5 9-10" />
            </svg>
          </div>
          <h1 className="font-display text-2xl">
            {posted} {posted === 1 ? 'item' : 'items'} posted
          </h1>
          <p className="text-base">{posted === 1 ? "It's" : "They're"} saved and tagged to your booth.</p>
          {drafts.length > 0 && (
            <p className="text-sm text-charcoal-light">
              {drafts.length} more {drafts.length === 1 ? 'photo is' : 'photos are'} still waiting on the Add items screen.
            </p>
          )}
          {/* A full page load with no Referer, so the public page's trackers never see this private page. */}
          <a
            href={postedIds.length === 1 ? `/new-arrivals/item/${postedIds[0]}` : '/new-arrivals'}
            rel="noreferrer"
            className="inline-flex min-h-[52px] items-center justify-center rounded-lg border-2 border-mauve text-lg font-semibold text-black"
          >
            {postedIds.length === 1 ? 'See it on New Arrivals' : 'See New Arrivals'}
          </a>
          <button type="button" onClick={() => setScreen('add')} className="min-h-[52px] rounded-lg border-2 border-mauve bg-mauve text-lg font-semibold text-black">
            {drafts.length ? 'Back to my photos' : 'Add more'}
          </button>
          <button type="button" onClick={() => setScreen('home')} className="min-h-[52px] rounded-lg border-2 border-mauve text-lg font-semibold text-black">
            Done
          </button>
        </main>
      </>
    )
  }

  if (screen === 'home') {
    return (
      <>
        {header}
        <main className="mx-auto flex max-w-md flex-col gap-3 px-4 pb-10 pt-5">
          {booths.length === 0 ? (
            <p className="rounded-xl border border-champagne-dark bg-white p-4 text-base">
              No booth is linked to your page yet. Ask at the front desk to set it up.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setScreen('add')}
              className="min-h-[76px] w-full rounded-xl bg-mauve text-xl font-bold text-black active:bg-mauve-dark"
            >
              + Add new items
            </button>
          )}
          <div className="flex min-h-[60px] items-center justify-between rounded-xl border border-champagne-dark bg-white px-4 text-lg font-semibold">
            <span>My items</span>
            <span className="text-base font-medium">{live} live</span>
          </div>
          <p className="text-sm leading-relaxed text-charcoal-light">
            This is your private page. Treat your link like a key. If you lose it, ask the front desk for a new link and the old one stops working.
          </p>
        </main>
      </>
    )
  }

  return (
    <>
      {header}
      <main
        className="mx-auto flex max-w-md flex-col gap-3 px-4 pb-6 pt-5"
        onDragEnter={(e) => {
          e.preventDefault()
          dragDepth.current += 1
          setDragging(true)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => {
          dragDepth.current = Math.max(0, dragDepth.current - 1)
          if (dragDepth.current === 0) setDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          dragDepth.current = 0
          setDragging(false)
          if (!posting && e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
        }}
      >
        <h1 className="font-display text-2xl">Add new items</h1>
        <p className="text-sm text-charcoal-light">Take or choose up to {MAX_ITEMS_PER_POST} photos. Type what&apos;s on the tag and the price.</p>

        <input
          ref={fileInput}
          type="file"
          // JPEG first: iPhone Safari converts HEIC to the first listed type. Do not add image/heic.
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files)
            e.target.value = ''
          }}
        />

        {/* Locked while posting, so nothing typed or added after tapping Post is lost. */}
        <fieldset disabled={posting} className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
          <button
            type="button"
            onClick={() => {
              replaceTarget.current = null
              fileInput.current?.click()
            }}
            disabled={drafts.length >= MAX_ITEMS_PER_POST}
            className={`min-h-[56px] rounded-lg border-2 border-dashed text-lg font-semibold text-black disabled:opacity-50 ${
              dragging ? 'border-charcoal bg-mint-light' : 'border-mauve bg-white'
            }`}
          >
            {drafts.length ? 'Add more photos' : 'Take or choose photos'}
            <span className="hidden text-sm font-normal md:block">or drop photos here</span>
          </button>

          {drafts.map((d, i) => {
            const err = cardErrors[d.key]
            const parsed = parsePriceInput(d.price)
            const priceInvalid = !d.askInStore && d.price.trim() !== '' && !parsed.ok
            const busy = d.state === 'preparing' || d.state === 'uploading'
            return (
              <div
                key={d.key}
                className={`flex gap-3 rounded-xl border bg-white p-3 ${err || d.state === 'failed' || d.state === 'missing' ? 'border-red-700' : 'border-champagne-dark'}`}
              >
                <div
                  className="relative h-24 w-24 flex-none overflow-hidden rounded-lg bg-champagne bg-cover bg-center"
                  style={d.preview ? { backgroundImage: `url(${d.preview})` } : undefined}
                >
                  {d.state !== 'uploaded' && (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/60 p-1 text-center text-xs font-bold">
                      {d.state === 'failed' ? 'Failed' : d.state === 'missing' ? 'No photo' : d.state === 'preparing' ? 'Preparing' : `${d.progress}%`}
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <label htmlFor={`title-${d.key}`} className="text-xs font-semibold text-charcoal-light">
                    Title (what the tag says)
                  </label>
                  <input
                    id={`title-${d.key}`}
                    type="text"
                    value={d.title}
                    maxLength={80}
                    autoComplete="off"
                    placeholder="e.g. Brass floor lamp"
                    onChange={(e) => patch(d.key, { title: e.target.value })}
                    className="min-h-[46px] w-full rounded-lg border border-champagne-dark px-3 text-base focus:outline focus:outline-2 focus:outline-charcoal"
                  />

                  <label htmlFor={`price-${d.key}`} className="text-xs font-semibold text-charcoal-light">
                    Price
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-28">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-light">$</span>
                      <input
                        id={`price-${d.key}`}
                        type="text"
                        inputMode="decimal"
                        value={d.price}
                        disabled={d.askInStore}
                        placeholder="0"
                        aria-invalid={priceInvalid}
                        aria-describedby={priceInvalid ? `price-err-${d.key}` : undefined}
                        onChange={(e) => patch(d.key, { price: e.target.value })}
                        className="min-h-[46px] w-full rounded-lg border border-champagne-dark pl-6 pr-2 text-base disabled:bg-champagne focus:outline focus:outline-2 focus:outline-charcoal"
                      />
                    </div>
                    <label className="inline-flex min-h-[44px] items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={d.askInStore}
                        onChange={(e) => patch(d.key, { askInStore: e.target.checked, price: e.target.checked ? '' : d.price })}
                        className="h-5 w-5 accent-charcoal"
                      />
                      No price, ask in store
                    </label>
                  </div>
                  {priceInvalid && !parsed.ok && (
                    <p id={`price-err-${d.key}`} className="text-sm text-red-700">
                      {parsed.error}
                    </p>
                  )}

                  {booths.length > 1 && (
                    <>
                      <label htmlFor={`booth-${d.key}`} className="text-xs font-semibold text-charcoal-light">
                        Booth
                      </label>
                      <select
                        id={`booth-${d.key}`}
                        value={d.booth}
                        onChange={(e) => patch(d.key, { booth: e.target.value })}
                        className="min-h-[46px] rounded-lg border border-champagne-dark bg-white px-3 text-base"
                      >
                        <option value="">Pick a booth</option>
                        {booths.map((b) => (
                          <option key={b} value={b}>
                            Booth {b}
                          </option>
                        ))}
                      </select>
                    </>
                  )}

                  {(d.error || err) && <p className="text-sm text-red-700">{err || d.error}</p>}
                  <div className="flex flex-wrap gap-x-4">
                    {d.state === 'failed' && d.file && (
                      <button type="button" onClick={() => retry(d)} className="min-h-[36px] text-sm font-semibold underline">
                        Retry
                      </button>
                    )}
                    {(d.state === 'missing' || (d.state === 'failed' && !d.file)) && (
                      <button type="button" onClick={() => pickFor(d.key)} className="min-h-[36px] text-sm font-semibold underline">
                        Choose photo
                      </button>
                    )}
                    {!busy && (
                      <button type="button" onClick={() => remove(d.key)} className="min-h-[36px] text-sm text-charcoal-light underline">
                        Remove photo {i + 1}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </fieldset>

        {drafts.length === 0 && (
          <p className="text-sm text-charcoal-light">
            Photos are shrunk on your phone before they upload, so this works on slow store wifi. You can type titles with the
            microphone on your keyboard.
          </p>
        )}

        {(drafts.length > 0 || postError) && (
          <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 bg-champagne px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
            {consentNeeded && drafts.length > 0 && (
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={consent}
                  disabled={posting}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-5 w-5 flex-none accent-charcoal"
                />
                These are my items and my photos, and the mall may show them on its website and in its ads.
              </label>
            )}
            {postError && (
              <p role="alert" className="text-sm text-red-700">
                {postError}
              </p>
            )}
            {drafts.length > 0 && (
              <button
                type="button"
                onClick={post}
                disabled={!ready || posting}
                className="min-h-[52px] w-full rounded-lg bg-mauve text-lg font-bold text-black disabled:bg-champagne-dark disabled:text-charcoal-light"
              >
                {postLabel}
              </button>
            )}
          </div>
        )}
      </main>
    </>
  )
}
