'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'
import { preparePhoto } from '@/lib/booth-map/photo-client'
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
  state: 'preparing' | 'uploading' | 'uploaded' | 'failed'
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

const storageKey = (vendorId: string) => `mam-booth-map-drafts:${vendorId}`

function saveDrafts(vendorId: string, drafts: Draft[]) {
  try {
    const keep = drafts
      .filter((d) => d.state === 'uploaded' && d.blobUrl)
      .map(({ key, blobUrl, width, height, title, price, askInStore, booth }) => ({ key, blobUrl, width, height, title, price, askInStore, booth }))
    if (keep.length) localStorage.setItem(storageKey(vendorId), JSON.stringify(keep))
    else localStorage.removeItem(storageKey(vendorId))
  } catch {
    /* storage unavailable (private mode); drafts just won't survive a reload */
  }
}

function loadDrafts(vendorId: string): Draft[] {
  try {
    const raw = localStorage.getItem(storageKey(vendorId))
    if (!raw) return []
    const list = JSON.parse(raw) as Array<Partial<Draft>>
    return list
      .filter((d) => typeof d.blobUrl === 'string' && typeof d.key === 'string')
      .map((d) => ({
        key: d.key!,
        state: 'uploaded' as const,
        progress: 100,
        preview: d.blobUrl!,
        blobUrl: d.blobUrl,
        width: d.width,
        height: d.height,
        title: d.title ?? '',
        price: d.price ?? '',
        askInStore: d.askInStore === true,
        booth: d.booth ?? '',
      }))
  } catch {
    return []
  }
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
  const [live, setLive] = useState(liveCount)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const queue = useRef<Promise<void>>(Promise.resolve())
  const restored = useRef(false)

  // Restore uploaded drafts after a reload or dropped connection.
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const saved = loadDrafts(vendorId)
    if (saved.length) {
      setDrafts(saved)
      setScreen('add')
    }
  }, [vendorId])

  useEffect(() => {
    if (restored.current) saveDrafts(vendorId, drafts)
  }, [vendorId, drafts])

  const patch = useCallback((key: string, change: Partial<Draft>) => {
    setDrafts((list) => list.map((d) => (d.key === key ? { ...d, ...change } : d)))
  }, [])

  const uploadOne = useCallback(
    async (key: string, file: File) => {
      try {
        patch(key, { state: 'preparing', progress: 0, error: undefined })
        const photo = await preparePhoto(file)
        patch(key, { state: 'uploading', preview: URL.createObjectURL(photo.blob), width: photo.width, height: photo.height })
        const result = await upload(`booth-map/${vendorId}/${crypto.randomUUID()}.jpg`, photo.blob, {
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
        const message = err instanceof Error && /read|process/.test(err.message) ? err.message : 'Upload failed. Check the connection and tap Retry.'
        patch(key, { state: 'failed', error: message, file })
      }
    },
    [patch, vendorId]
  )

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      setPostError(null)
      const room = MAX_ITEMS_PER_POST - drafts.length
      const picked = Array.from(files).slice(0, Math.max(0, room))
      if (files.length > picked.length) setPostError(`You can post up to ${MAX_ITEMS_PER_POST} photos at a time.`)
      const fresh: Draft[] = picked.map((file) => ({
        key: crypto.randomUUID(),
        state: 'preparing',
        progress: 0,
        preview: '',
        title: '',
        price: '',
        askInStore: false,
        booth: booths.length === 1 ? booths[0] : '',
        file,
      }))
      setDrafts((list) => [...list, ...fresh])
      // One photo at a time keeps memory low on older phones.
      for (const d of fresh) queue.current = queue.current.then(() => uploadOne(d.key, d.file!))
    },
    [booths, drafts.length, uploadOne]
  )

  const retry = (d: Draft) => {
    if (d.file) queue.current = queue.current.then(() => uploadOne(d.key, d.file!))
  }

  const remove = (key: string) => {
    setDrafts((list) => list.filter((d) => d.key !== key))
    setCardErrors((e) => {
      const next = { ...e }
      delete next[key]
      return next
    })
  }

  const problems = useMemo(
    () =>
      drafts.map((d) => {
        if (d.state !== 'uploaded') return d.state === 'failed' ? 'failed' : 'uploading'
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
  else if (problems.includes('failed')) postLabel = 'Retry or remove the failed photo'
  else if (problems.some((p) => p === 'title' || p === 'price' || p === 'booth')) postLabel = 'Add a title and price to each photo'
  else if (consentNeeded && !consent) postLabel = 'Tick the box above to post'

  async function post() {
    if (!ready || posting) return
    setPosting(true)
    setPostError(null)
    setCardErrors({})
    try {
      const res = await fetch('/api/booth-map/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent,
          items: drafts.map((d) => ({
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
      if (res.ok) {
        setPosted(drafts.length)
        setLive((n) => n + drafts.length)
        setDrafts([])
        setConsentNeeded(false)
        setScreen('done')
        window.scrollTo(0, 0)
        return
      }
      if (data.code === 'ALREADY_POSTED' && Array.isArray(data.indexes)) {
        const doneKeys = new Set((data.indexes as number[]).map((i) => drafts[i]?.key))
        setDrafts((list) => list.filter((d) => !doneKeys.has(d.key)))
        setPostError('Some of these were already posted, so they were taken off this list. Tap Post again for the rest.')
        return
      }
      if (Array.isArray(data.errors)) {
        const map: Record<string, string> = {}
        for (const e of data.errors as Array<{ index: number; message: string }>) {
          const key = drafts[e.index]?.key
          if (key && !map[key]) map[key] = e.message
        }
        setCardErrors(map)
      }
      setPostError(res.status === 401 ? data.error : data.error || 'Posting failed. Check the connection and try again.')
    } catch {
      setPostError('No connection. Your photos and text are saved here. Try again when you have signal.')
    } finally {
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
          <button type="button" onClick={() => setScreen('home')} className="min-h-[44px] px-1 font-semibold text-black">
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
            {posted} {posted === 1 ? 'item is' : 'items are'} live
          </h1>
          <p className="text-base">Shoppers can see {posted === 1 ? 'it' : 'them'} now, tagged to your booth.</p>
          <button type="button" onClick={() => setScreen('add')} className="min-h-[52px] rounded-lg border-2 border-mauve bg-mauve text-lg font-semibold text-black">
            Add more
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
          <button
            type="button"
            onClick={() => setScreen('add')}
            className="min-h-[76px] w-full rounded-xl bg-mauve text-xl font-bold text-black active:bg-mauve-dark"
          >
            + Add new items
          </button>
          <div className="flex min-h-[60px] items-center justify-between rounded-xl border border-champagne-dark bg-white px-4 text-lg font-semibold">
            <span>My items</span>
            <span className="text-base font-medium">{live} live</span>
          </div>
          <p className="text-sm leading-relaxed text-charcoal-light">
            This is your private page. Treat your card like a key. If it goes missing, ask the front desk for a new link and the old one stops working.
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
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
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
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
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
          const priceInvalid = !d.askInStore && d.price.trim() !== '' && !parsePriceInput(d.price).ok
          return (
            <div key={d.key} className={`flex gap-3 rounded-xl border bg-white p-3 ${err ? 'border-red-700' : 'border-champagne-dark'}`}>
              <div
                className="relative h-24 w-24 flex-none overflow-hidden rounded-lg bg-champagne bg-cover bg-center"
                style={d.preview ? { backgroundImage: `url(${d.preview})` } : undefined}
              >
                {d.state !== 'uploaded' && (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/60 text-xs font-bold">
                    {d.state === 'failed' ? 'Failed' : d.state === 'preparing' ? 'Preparing' : `${d.progress}%`}
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
                {priceInvalid && (
                  <p id={`price-err-${d.key}`} className="text-sm text-red-700">
                    {(parsePriceInput(d.price) as { ok: false; error: string }).error}
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
                <div className="flex gap-4">
                  {d.state === 'failed' && d.file && (
                    <button type="button" onClick={() => retry(d)} className="min-h-[36px] text-sm font-semibold underline">
                      Retry
                    </button>
                  )}
                  <button type="button" onClick={() => remove(d.key)} className="min-h-[36px] text-sm text-charcoal-light underline">
                    Remove photo {i + 1}
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {drafts.length === 0 && (
          <p className="text-sm text-charcoal-light">
            Photos are shrunk on your phone before they upload, so this works on slow store wifi. You can type titles with the
            microphone on your keyboard.
          </p>
        )}

        {drafts.length > 0 && (
          <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 bg-champagne px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
            {consentNeeded && (
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 flex-none accent-charcoal" />
                These are my items and my photos, and the mall may show them on its website and in its ads.
              </label>
            )}
            {postError && (
              <p role="alert" className="text-sm text-red-700">
                {postError}
              </p>
            )}
            <button
              type="button"
              onClick={post}
              disabled={!ready || posting}
              className="min-h-[52px] w-full rounded-lg bg-mauve text-lg font-bold text-black disabled:bg-champagne-dark disabled:text-charcoal-light"
            >
              {postLabel}
            </button>
          </div>
        )}
      </main>
    </>
  )
}
