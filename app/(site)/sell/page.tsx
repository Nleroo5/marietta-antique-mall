'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  Heart,
  ImagePlus,
  X,
  Armchair,
  Gem,
  Palette,
  Trophy,
  Landmark,
  Coins,
  Shirt,
  BookOpen,
  HelpCircle,
  Handshake,
  Gift,
  MapPin,
  Check,
  Pencil,
  RotateCcw,
} from 'lucide-react'

// This page renders inside the site's root layout, which already provides
// <Header /> and <Footer />. The wizard keeps a persistent bottom action bar
// for the Airbnb-style host flow.

// ── Types ──────────────────────────────────────────────────────────
type Intent = 'sell' | 'donate' | null
type Condition = 'excellent' | 'good' | 'fair' | 'poor' | null
type PricingIntent = 'offer' | 'asking' | 'donate' | null
type Era = 'pre-1900' | '1900-1950' | '1950-1980' | 'after-1980' | 'unknown' | null
type Acquisition = 'inherited' | 'purchased' | 'found' | 'other' | null
type Timeline = 'no-rush' | 'within-month' | 'this-week' | null
type Status = 'idle' | 'loading' | 'success' | 'error'

interface PhotoItem {
  id: string
  file: File
  preview: string
  uploading: boolean
  progress: number
  cdnUrl: string | null
  error: boolean
}

interface FormData {
  intent: Intent
  photos: PhotoItem[]
  category: string | null
  description: string
  condition: Condition
  era: Era
  maker: string
  dimensions: { h: string; w: string; d: string }
  acquisition: Acquisition
  pricingIntent: PricingIntent
  askingPrice: string
  zip: string
  name: string
  email: string
  phone: string
  timeline: Timeline
  _honey: string
}

const INITIAL_FORM: FormData = {
  intent: null,
  photos: [],
  category: null,
  description: '',
  condition: null,
  era: null,
  maker: '',
  dimensions: { h: '', w: '', d: '' },
  acquisition: null,
  pricingIntent: null,
  askingPrice: '',
  zip: '',
  name: '',
  email: '',
  phone: '',
  timeline: 'no-rush',
  _honey: '',
}

const TOTAL_STEPS = 7
const PHASE_STEP_RANGES: [number, number][] = [[1, 3], [4, 5], [6, 7]]

function getPhase(step: number): number {
  for (let i = 0; i < PHASE_STEP_RANGES.length; i++) {
    if (step >= PHASE_STEP_RANGES[i][0] && step <= PHASE_STEP_RANGES[i][1]) return i
  }
  return 0
}

// ── Categories ─────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'furniture', label: 'Furniture', icon: Armchair },
  { value: 'jewelry', label: 'Jewelry & Watches', icon: Gem },
  { value: 'art', label: 'Art & Paintings', icon: Palette },
  { value: 'collectibles', label: 'Collectibles', icon: Trophy },
  { value: 'pottery', label: 'Pottery & Ceramics', icon: Landmark },
  { value: 'coins', label: 'Coins & Currency', icon: Coins },
  { value: 'clothing', label: 'Clothing & Textiles', icon: Shirt },
  { value: 'books', label: 'Books & Maps', icon: BookOpen },
  { value: 'other', label: 'Other', icon: HelpCircle },
]

const CONDITIONS: { value: Condition; label: string; hint: string }[] = [
  { value: 'excellent', label: 'Excellent', hint: 'Like new, no visible wear' },
  { value: 'good', label: 'Good', hint: 'Minor wear consistent with age' },
  { value: 'fair', label: 'Fair', hint: 'Noticeable wear, fully functional' },
  { value: 'poor', label: 'Poor', hint: 'Significant damage or missing parts' },
]

const ERAS: { value: Era; label: string }[] = [
  { value: 'pre-1900', label: 'Pre-1900' },
  { value: '1900-1950', label: '1900–1950' },
  { value: '1950-1980', label: '1950–1980' },
  { value: 'after-1980', label: 'After 1980' },
  { value: 'unknown', label: 'No idea' },
]

const ACQUISITIONS: { value: Acquisition; label: string }[] = [
  { value: 'inherited', label: 'Inherited' },
  { value: 'purchased', label: 'Purchased' },
  { value: 'found', label: 'Found / Gifted' },
  { value: 'other', label: 'Other' },
]

// ── Progress Bar ── thin full-width segmented bar (Airbnb host-flow footer) ──
function ProgressBar({ step }: { step: number }) {
  const phase = getPhase(step)
  return (
    <div className="flex items-center gap-0.5">
      {PHASE_STEP_RANGES.map(([start, end], i) => {
        const total = end - start + 1
        const filled = i < phase ? total : i === phase ? step - start + 1 : 0
        const pct = Math.min((filled / total) * 100, 100)
        return (
          <div key={i} className="flex-1 h-[3px] bg-[#ebebeb] overflow-hidden">
            <motion.div
              className="h-full bg-[#222222]"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        )
      })}
    </div>
  )
}

// ── Slide Transition Wrapper ───────────────────────────────────────
function StepWrapper({
  stepKey,
  direction,
  children,
}: {
  stepKey: number
  direction: number
  children: React.ReactNode
}) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepKey}
        custom={direction}
        initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg mx-auto px-4"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// ── Photo Upload Helpers ───────────────────────────────────────────
const PHOTO_PROMPTS = [
  '',
  'Got it! Now try the back or any maker’s marks.',
  'Any damage to show? Honesty gets better offers.',
  'Looking good. Add up to 2 more or continue.',
]

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

async function compressPhoto(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1600
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width)
          width = MAX
        } else {
          width = Math.round((width * MAX) / height)
          height = MAX
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file)
          resolve(new File([blob], file.name, { type: 'image/webp' }))
        },
        'image/webp',
        0.82
      )
    }
    img.src = url
  })
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// ── Main Component ─────────────────────────────────────────────────
export default function SellOrDonate() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [status, setStatus] = useState<Status>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const update = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  )

  const goNext = () => {
    setDirection(1)
    setStep((s) => {
      const next = Math.min(s + 1, TOTAL_STEPS)
      if (next === 5 && form.intent === 'donate') return 6
      return next
    })
  }
  const goBack = () => {
    setDirection(-1)
    setStep((s) => {
      const prev = Math.max(s - 1, 1)
      if (prev === 5 && form.intent === 'donate') return 4
      return prev
    })
  }
  const goTo = (target: number) => {
    setDirection(target > step ? 1 : -1)
    setStep(target)
  }

  const resetForm = () => {
    form.photos.forEach((p) => URL.revokeObjectURL(p.preview))
    setForm(INITIAL_FORM)
    setStatus('idle')
    setDirection(1)
    setStep(1)
    window.scrollTo({ top: 0 })
  }

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return form.intent !== null
      case 2:
        return form.photos.some((p) => p.cdnUrl !== null) && !form.photos.some((p) => p.uploading)
      case 3:
        return form.category !== null && form.condition !== null
      case 4:
        return true
      case 5:
        return (
          form.pricingIntent !== null &&
          (form.pricingIntent !== 'asking' || form.askingPrice.length > 0)
        )
      case 6:
        return form.zip.length >= 5 && form.name.length >= 2 && /\S+@\S+\.\S+/.test(form.email)
      case 7:
        return true
      default:
        return false
    }
  }

  // ── Photo handling ─────────────────────────────────────────────
  const uploadSinglePhoto = async (id: string, file: File) => {
    try {
      const compressed = await compressPhoto(file)
      const dataUrl = await fileToDataUrl(compressed)
      let lastError: unknown = null
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 30_000)
          const res = await fetch('/api/upload-item-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo: dataUrl }),
            signal: controller.signal,
          })
          clearTimeout(timeout)
          if (!res.ok) throw new Error('Upload failed')
          const { url } = await res.json()
          setForm((prev) => ({
            ...prev,
            photos: prev.photos.map((p) =>
              p.id === id
                ? { ...p, file: compressed, uploading: false, progress: 100, cdnUrl: url }
                : p
            ),
          }))
          return
        } catch (err) {
          lastError = err
          if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
        }
      }
      throw lastError
    } catch {
      setForm((prev) => ({
        ...prev,
        photos: prev.photos.map((p) => (p.id === id ? { ...p, uploading: false, error: true } : p)),
      }))
    }
  }

  const addPhotos = (files: FileList | null) => {
    if (!files) return
    const remaining = 5 - form.photos.length
    const toAdd = Array.from(files).slice(0, remaining)
    const newPhotos: PhotoItem[] = toAdd.map((file) => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
      progress: 0,
      cdnUrl: null,
      error: false,
    }))
    setForm((prev) => ({ ...prev, photos: [...prev.photos, ...newPhotos] }))
    newPhotos.forEach((p) => {
      uploadSinglePhoto(p.id, p.file)
    })
  }

  const removePhoto = (id: string) => {
    setForm((prev) => {
      const photo = prev.photos.find((p) => p.id === id)
      if (photo) URL.revokeObjectURL(photo.preview)
      return { ...prev, photos: prev.photos.filter((p) => p.id !== id) }
    })
  }

  const retryPhoto = (id: string) => {
    const photo = form.photos.find((p) => p.id === id)
    if (!photo) return
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.map((p) => (p.id === id ? { ...p, uploading: true, error: false } : p)),
    }))
    uploadSinglePhoto(id, photo.file)
  }

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setStatus('loading')
    try {
      const photoUrls = form.photos
        .map((p) => p.cdnUrl)
        .filter((url): url is string => url !== null)

      const res = await fetch('/api/item-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: form.intent,
          photos: photoUrls,
          category: form.category,
          description: form.description,
          condition: form.condition,
          era: form.era,
          maker: form.maker,
          dimensions: form.dimensions,
          acquisition: form.acquisition,
          pricingIntent: form.pricingIntent,
          askingPrice: form.askingPrice,
          zip: form.zip,
          name: form.name,
          email: form.email,
          phone: form.phone,
          timeline: form.timeline,
          _honey: form._honey,
        }),
      })

      if (!res.ok) throw new Error('Submit failed')
      await res.json()

      // Track GA4 lead conversion — consistent with the vendor application form.
      if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag) {
        ;(window as unknown as { gtag: (...a: unknown[]) => void }).gtag('event', 'generate_lead', {
          lead_type: 'sell_or_donate',
          intent: form.intent,
          category: form.category,
        })
      }

      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {status === 'success' ? (
        <div className="flex-1 flex items-center justify-center pt-10 pb-16">
          <SuccessScreen name={form.name} onReset={resetForm} />
        </div>
      ) : (
        <>
          <div className="flex-1 w-full flex flex-col items-center pt-8 sm:pt-12 pb-36">
            <StepWrapper stepKey={step} direction={direction}>
              {step === 1 && (
                <StepIntent
                  value={form.intent}
                  onChange={(v) => {
                    update('intent', v)
                    if (v === 'donate') update('pricingIntent', 'donate')
                    if (v === 'sell') update('pricingIntent', null)
                    if (v) {
                      setDirection(1)
                      setStep(2)
                    }
                  }}
                />
              )}
              {step === 2 && (
                <StepPhotos
                  photos={form.photos}
                  onAdd={addPhotos}
                  onRemove={removePhoto}
                  onRetry={retryPhoto}
                  fileInputRef={fileInputRef}
                />
              )}
              {step === 3 && (
                <StepCategory
                  intent={form.intent}
                  category={form.category}
                  description={form.description}
                  condition={form.condition}
                  onCategory={(v) => update('category', v)}
                  onDescription={(v) => update('description', v)}
                  onCondition={(v) => update('condition', v)}
                />
              )}
              {step === 4 && (
                <StepDetails
                  era={form.era}
                  maker={form.maker}
                  dimensions={form.dimensions}
                  acquisition={form.acquisition}
                  onEra={(v) => update('era', v)}
                  onMaker={(v) => update('maker', v)}
                  onDimensions={(v) => update('dimensions', v)}
                  onAcquisition={(v) => update('acquisition', v)}
                />
              )}
              {step === 5 && (
                <StepPricing
                  pricingIntent={form.pricingIntent}
                  askingPrice={form.askingPrice}
                  onIntent={(v) => update('pricingIntent', v)}
                  onAskingPrice={(v) => update('askingPrice', v)}
                />
              )}
              {step === 6 && (
                <StepContact
                  zip={form.zip}
                  name={form.name}
                  email={form.email}
                  phone={form.phone}
                  timeline={form.timeline}
                  honey={form._honey}
                  onZip={(v) => update('zip', v)}
                  onName={(v) => update('name', v)}
                  onEmail={(v) => update('email', v)}
                  onPhone={(v) => update('phone', v)}
                  onTimeline={(v) => update('timeline', v)}
                  onHoney={(v) => update('_honey', v)}
                />
              )}
              {step === 7 && <StepReview form={form} onEdit={goTo} />}
            </StepWrapper>

            {status === 'error' && (
              <p className="text-sm text-red-600 mt-4 text-center font-body px-4">
                Something went wrong. Please try again.
              </p>
            )}
          </div>

          {/* Sticky footer: thin progress bar above Back / Next */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#ebebeb]">
            <ProgressBar step={step} />
            <div className="w-full max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
              {step > 1 ? (
                <button
                  onClick={goBack}
                  className="text-sm font-semibold text-[#222222] underline underline-offset-4 hover:text-[#222222]/70 transition-colors font-body"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < TOTAL_STEPS ? (
                <button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="px-6 py-3 rounded-lg bg-[#222222] text-white font-semibold text-sm font-body disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black active:scale-[0.98] transition-all"
                >
                  {step === 4 ? 'Skip or continue' : 'Next'}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={status === 'loading'}
                  className="px-6 py-3 rounded-lg bg-[#222222] text-white font-semibold text-sm font-body disabled:opacity-50 hover:bg-black active:scale-[0.98] transition-all"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                        className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                      />
                      Submitting…
                    </span>
                  ) : (
                    <>Submit to the mall</>
                  )}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// ── Step 1: Intent ─────────────────────────────────────────────────
function StepIntent({ value, onChange }: { value: Intent; onChange: (v: Intent) => void }) {
  const cards: { intent: Intent; icon: typeof ShoppingBag; title: string; desc: string }[] = [
    { intent: 'sell', icon: ShoppingBag, title: 'Sell an item', desc: 'Get an offer from Marietta Antique Mall' },
    { intent: 'donate', icon: Heart, title: 'Donate', desc: 'Pass it on to the mall' },
  ]

  return (
    <div className="pt-8 pb-4">
      <h1 className="text-2xl sm:text-[28px] font-display text-charcoal mb-2">
        Have something to sell or donate?
      </h1>
      <p className="text-sm text-charcoal/50 font-body mb-10">
        Send it to Marietta Antique Mall. Free, no obligation.
      </p>
      <div className="flex flex-col gap-3">
        {cards.map(({ intent, icon: Icon, title, desc }) => (
          <motion.button
            key={intent}
            onClick={() => onChange(intent)}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all ${
              value === intent
                ? 'border-[#222222] bg-white shadow-sm'
                : 'border-[#dddddd] hover:border-[#222222] bg-white'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                value === intent ? 'bg-[#222222]/10 text-[#222222]' : 'bg-charcoal/5 text-charcoal/40'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-charcoal font-body text-[15px]">{title}</p>
              <p className="text-sm text-charcoal/45 font-body">{desc}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ── Step 2: Photos ─────────────────────────────────────────────────
function StepPhotos({
  photos,
  onAdd,
  onRemove,
  onRetry,
  fileInputRef,
}: {
  photos: PhotoItem[]
  onAdd: (files: FileList | null) => void
  onRemove: (id: string) => void
  onRetry: (id: string) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}) {
  const prompt = PHOTO_PROMPTS[Math.min(photos.length, PHOTO_PROMPTS.length - 1)]

  return (
    <div className="pt-8 pb-4">
      <h1 className="text-2xl sm:text-[28px] font-display text-charcoal mb-2">Add a few photos</h1>
      <p className="text-sm text-charcoal/50 font-body mb-8">
        Clear, well-lit photos help the mall make a better offer.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onAdd(e.target.files)
          e.target.value = ''
        }}
      />

      {photos.length < 5 && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 rounded-xl border-2 border-dashed border-[#dddddd] bg-[#f7f7f7] flex flex-col items-center justify-center gap-3 hover:border-[#222222] transition-colors mb-4"
        >
          <div className="w-14 h-14 rounded-xl bg-[#f0f0f0] flex items-center justify-center">
            <ImagePlus className="w-6 h-6 text-[#222222]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-charcoal font-body">
              {photos.length === 0 ? 'Upload photos' : 'Add more photos'}
            </p>
            <p className="text-xs text-charcoal/40 font-body mt-0.5">
              {photos.length}/5 · JPEG, PNG, or WebP
            </p>
          </div>
        </motion.button>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {photos.map((photo, i) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative aspect-square rounded-xl overflow-hidden bg-charcoal/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.preview} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-charcoal/70 text-white text-[10px] font-semibold font-body rounded-full">
                  Cover
                </span>
              )}
              {photo.uploading && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-charcoal/10">
                  <motion.div
                    className="h-full bg-[#222222]"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </div>
              )}
              {photo.error && (
                <button
                  onClick={() => onRetry(photo.id)}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center"
                >
                  <div className="flex flex-col items-center gap-1">
                    <RotateCcw className="w-5 h-5 text-white" />
                    <span className="text-[10px] text-white font-semibold font-body">Retry</span>
                  </div>
                </button>
              )}
              <button
                onClick={() => onRemove(photo.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors z-10"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {prompt && photos.length > 0 && (
        <motion.p
          key={photos.length}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-[#222222] font-body text-center"
        >
          {prompt}
        </motion.p>
      )}
    </div>
  )
}

// ── Step 3: Category + Description + Condition ─────────────────────
function StepCategory({
  intent,
  category,
  description,
  condition,
  onCategory,
  onDescription,
  onCondition,
}: {
  intent: Intent
  category: string | null
  description: string
  condition: Condition
  onCategory: (v: string) => void
  onDescription: (v: string) => void
  onCondition: (v: Condition) => void
}) {
  const [tooltip, setTooltip] = useState<Condition>(null)
  useEffect(() => {
    if (!tooltip) return
    const t = setTimeout(() => setTooltip(null), 2000)
    return () => clearTimeout(t)
  }, [tooltip])
  return (
    <div className="pt-8 pb-4">
      <h1 className="text-2xl sm:text-[28px] font-display text-charcoal mb-2">
        {intent === 'donate' ? 'What are you donating?' : 'What are you selling?'}
      </h1>
      <p className="text-sm text-charcoal/50 font-body mb-8">Pick a category and describe your item.</p>

      {/* Category grid */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {CATEGORIES.map(({ value, label, icon: Icon }) => (
          <motion.button
            key={value}
            whileTap={{ scale: 0.96 }}
            onClick={() => onCategory(value)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
              category === value
                ? 'border-[#222222] bg-white'
                : 'border-[#dddddd] hover:border-[#222222] bg-white'
            }`}
          >
            <Icon className={`w-5 h-5 ${category === value ? 'text-[#222222]' : 'text-charcoal/35'}`} />
            <span className="text-xs font-body font-medium text-charcoal text-center leading-tight">
              {label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wide mb-1.5 font-body">
          Describe your item
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescription(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="e.g. Oak roll-top desk, circa 1920s, some wear on the writing surface"
          className="w-full px-4 py-3 rounded-lg border border-[#dddddd] text-sm text-charcoal placeholder:text-charcoal/25 focus:outline-none focus:border-[#222222] focus:ring-1 focus:ring-[#222222] bg-white transition-colors font-body resize-none"
        />
        <p className="text-xs text-charcoal/30 font-body text-right mt-1">{description.length}/300</p>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wide mb-2 font-body">
          Condition
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {CONDITIONS.map(({ value, label, hint }) => (
            <div key={value} className="relative">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  onCondition(value)
                  setTooltip(value)
                }}
                className={`w-full py-2.5 rounded-full text-xs font-semibold font-body transition-all ${
                  condition === value
                    ? 'bg-[#222222] text-white'
                    : 'bg-white border border-[#dddddd] text-[#3f3f3f] hover:border-[#222222]'
                }`}
              >
                {label}
              </motion.button>
              <AnimatePresence>
                {tooltip === value && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-charcoal text-white text-[11px] font-body rounded-lg whitespace-nowrap z-10 shadow-lg"
                  >
                    {hint}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-charcoal rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Step 4: Optional Details ───────────────────────────────────────
function StepDetails({
  era,
  maker,
  dimensions,
  acquisition,
  onEra,
  onMaker,
  onDimensions,
  onAcquisition,
}: {
  era: Era
  maker: string
  dimensions: { h: string; w: string; d: string }
  acquisition: Acquisition
  onEra: (v: Era) => void
  onMaker: (v: string) => void
  onDimensions: (v: { h: string; w: string; d: string }) => void
  onAcquisition: (v: Acquisition) => void
}) {
  return (
    <div className="pt-8 pb-4">
      <h1 className="text-2xl sm:text-[28px] font-display text-charcoal mb-2">
        Help the mall give a better offer
      </h1>
      <p className="text-sm text-charcoal/50 font-body mb-8">All optional — skip anything you don’t know.</p>

      {/* Era */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wide mb-2 font-body">
          How old is it?
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ERAS.map(({ value, label }) => (
            <motion.button
              key={value}
              whileTap={{ scale: 0.96 }}
              onClick={() => onEra(era === value ? null : value)}
              className={`px-4 py-2 rounded-full text-xs font-semibold font-body transition-all ${
                era === value
                  ? 'bg-[#222222] text-white'
                  : 'bg-white border border-[#dddddd] text-[#3f3f3f] hover:border-[#222222]'
              }`}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Maker */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wide mb-1.5 font-body">
          Maker or brand
        </label>
        <input
          type="text"
          value={maker}
          onChange={(e) => onMaker(e.target.value)}
          placeholder="e.g. Stickley, Tiffany, unmarked"
          className="w-full px-4 py-3 rounded-lg border border-[#dddddd] text-sm text-charcoal placeholder:text-charcoal/25 focus:outline-none focus:border-[#222222] focus:ring-1 focus:ring-[#222222] bg-white transition-colors font-body"
        />
      </div>

      {/* Dimensions */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wide mb-1.5 font-body">
          Dimensions (inches)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['h', 'w', 'd'] as const).map((dim) => (
            <div key={dim} className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={dimensions[dim]}
                onChange={(e) => onDimensions({ ...dimensions, [dim]: e.target.value })}
                placeholder={dim === 'h' ? 'Height' : dim === 'w' ? 'Width' : 'Depth'}
                className="w-full px-4 py-3 rounded-lg border border-[#dddddd] text-sm text-charcoal placeholder:text-charcoal/25 focus:outline-none focus:border-[#222222] focus:ring-1 focus:ring-[#222222] bg-white transition-colors font-body"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Acquisition */}
      <div>
        <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wide mb-2 font-body">
          How did you get it?
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ACQUISITIONS.map(({ value, label }) => (
            <motion.button
              key={value}
              whileTap={{ scale: 0.96 }}
              onClick={() => onAcquisition(acquisition === value ? null : value)}
              className={`px-4 py-2 rounded-full text-xs font-semibold font-body transition-all ${
                acquisition === value
                  ? 'bg-[#222222] text-white'
                  : 'bg-white border border-[#dddddd] text-[#3f3f3f] hover:border-[#222222]'
              }`}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Step 5: Pricing Intent ─────────────────────────────────────────
function StepPricing({
  pricingIntent,
  askingPrice,
  onIntent,
  onAskingPrice,
}: {
  pricingIntent: PricingIntent
  askingPrice: string
  onIntent: (v: PricingIntent) => void
  onAskingPrice: (v: string) => void
}) {
  const priceInputRef = useRef<HTMLInputElement>(null)

  const cards: { value: PricingIntent; icon: typeof Handshake; title: string; desc: string }[] = [
    { value: 'offer', icon: Handshake, title: 'Make me an offer', desc: 'Let the mall suggest a price' },
    { value: 'asking', icon: ShoppingBag, title: 'I have a price in mind', desc: 'Tell the mall what you’re looking for' },
    { value: 'donate', icon: Gift, title: 'Free — I’d like to donate', desc: 'Pass it on to the mall' },
  ]

  return (
    <div className="pt-8 pb-4">
      <h1 className="text-2xl sm:text-[28px] font-display text-charcoal mb-2">What are you hoping for?</h1>
      <p className="text-sm text-charcoal/50 font-body mb-10">
        This isn’t a commitment — it just helps the mall respond faster.
      </p>

      <div className="flex flex-col gap-3">
        {cards.map(({ value, icon: Icon, title, desc }) => (
          <motion.button
            key={value}
            onClick={() => {
              onIntent(value)
              if (value === 'asking') setTimeout(() => priceInputRef.current?.focus(), 100)
            }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all ${
              pricingIntent === value
                ? 'border-[#222222] bg-white shadow-sm'
                : 'border-[#dddddd] hover:border-[#222222] bg-white'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                pricingIntent === value ? 'bg-[#222222]/10 text-[#222222]' : 'bg-charcoal/5 text-charcoal/40'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-charcoal font-body text-[15px]">{title}</p>
              <p className="text-sm text-charcoal/45 font-body">{desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <p className="text-xs text-charcoal/35 font-body text-center mt-5 leading-relaxed">
        Stores typically offer 30-50% of an item’s retail value to cover their overhead and resale
        margin. Setting realistic expectations helps you get a faster response.
      </p>

      <AnimatePresence>
        {pricingIntent === 'asking' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4">
              <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wide mb-1.5 font-body">
                Your asking price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-charcoal/40 font-semibold font-body">
                  $
                </span>
                <input
                  ref={priceInputRef}
                  type="text"
                  inputMode="decimal"
                  value={askingPrice}
                  onChange={(e) => onAskingPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="e.g. 250"
                  className="w-full px-4 py-3 pl-8 rounded-lg border border-[#dddddd] text-sm text-charcoal placeholder:text-charcoal/25 focus:outline-none focus:border-[#222222] focus:ring-1 focus:ring-[#222222] bg-white transition-colors font-body"
                />
              </div>
              <p className="text-xs text-charcoal/30 font-body mt-1.5">
                The mall may counter — this just sets expectations.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Step 6: Contact + Location ─────────────────────────────────────
function StepContact({
  zip,
  name,
  email,
  phone,
  timeline,
  honey,
  onZip,
  onName,
  onEmail,
  onPhone,
  onTimeline,
  onHoney,
}: {
  zip: string
  name: string
  email: string
  phone: string
  timeline: Timeline
  honey: string
  onZip: (v: string) => void
  onName: (v: string) => void
  onEmail: (v: string) => void
  onPhone: (v: string) => void
  onTimeline: (v: Timeline) => void
  onHoney: (v: string) => void
}) {
  const [emailTouched, setEmailTouched] = useState(false)
  const [zipTouched, setZipTouched] = useState(false)

  const emailValid = /\S+@\S+\.\S+/.test(email)
  const zipValid = zip.length >= 5

  const timelines: { value: Timeline; label: string }[] = [
    { value: 'no-rush', label: 'No rush' },
    { value: 'within-month', label: 'Within a month' },
    { value: 'this-week', label: 'This week' },
  ]

  const inputBase =
    'w-full px-4 py-3 rounded-lg border text-sm text-charcoal placeholder:text-charcoal/25 focus:outline-none bg-white transition-colors font-body'

  return (
    <div className="pt-8 pb-4">
      <h1 className="text-2xl sm:text-[28px] font-display text-charcoal mb-2">
        Almost done — how should the mall reach you?
      </h1>
      <p className="text-sm text-charcoal/50 font-body mb-8">
        Marietta Antique Mall will get back to you directly.
      </p>

      <div className="space-y-4">
        {/* Honeypot */}
        <input
          type="text"
          name="_honey"
          value={honey}
          onChange={(e) => onHoney(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        {/* Name */}
        <input
          type="text"
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
          className={`${inputBase} border-[#dddddd] focus:border-[#222222] focus:ring-1 focus:ring-[#222222]`}
        />

        {/* Email */}
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            placeholder="Email address"
            autoComplete="email"
            className={`${inputBase} ${
              emailTouched && email && !emailValid
                ? 'border-red-400 focus:border-red-400'
                : 'border-[#dddddd] focus:border-[#222222] focus:ring-1 focus:ring-[#222222]'
            }`}
          />
          {emailTouched && email && !emailValid && (
            <p className="text-xs text-red-500 mt-1 ml-1 font-body">Enter a valid email address</p>
          )}
        </div>

        {/* Phone */}
        <input
          type="tel"
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          placeholder="Phone (optional — the mall responds faster by phone)"
          autoComplete="tel"
          className={`${inputBase} border-[#dddddd] focus:border-[#222222] focus:ring-1 focus:ring-[#222222]`}
        />

        <div className="h-px bg-charcoal/[0.08]" />

        {/* ZIP / Postal */}
        <div>
          <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wide mb-1.5 font-body">
            ZIP / Postal code
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="text"
              value={zip}
              onChange={(e) => onZip(e.target.value.replace(/[^0-9A-Za-z\s]/g, '').slice(0, 7))}
              onBlur={() => setZipTouched(true)}
              placeholder="e.g. 30060"
              autoComplete="postal-code"
              className={`${inputBase} pl-10 ${
                zipTouched && zip && !zipValid
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-[#dddddd] focus:border-[#222222] focus:ring-1 focus:ring-[#222222]'
              }`}
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/25" />
          </div>
          {zipTouched && zip && !zipValid && (
            <p className="text-xs text-red-500 mt-1 ml-1 font-body">Enter a valid ZIP or postal code</p>
          )}
        </div>

        {/* Timeline */}
        <div>
          <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wide mb-2 font-body">
            Timeline
          </label>
          <div className="flex gap-1.5">
            {timelines.map(({ value, label }) => (
              <motion.button
                key={value}
                whileTap={{ scale: 0.96 }}
                onClick={() => onTimeline(value)}
                className={`flex-1 py-2.5 rounded-full text-xs font-semibold font-body transition-all ${
                  timeline === value
                    ? 'bg-[#222222] text-white'
                    : 'bg-white border border-[#dddddd] text-[#3f3f3f] hover:border-[#222222]'
                }`}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-charcoal/30 font-body text-center mt-6">
        Your info goes straight to Marietta Antique Mall. They’ll reach out if they’re interested.
      </p>
    </div>
  )
}

// ── Step 7: Review ─────────────────────────────────────────────────
function StepReview({ form, onEdit }: { form: FormData; onEdit: (step: number) => void }) {
  const categoryLabel = CATEGORIES.find((c) => c.value === form.category)?.label ?? form.category
  const conditionLabel = CONDITIONS.find((c) => c.value === form.condition)?.label ?? ''
  const eraLabel = ERAS.find((e) => e.value === form.era)?.label ?? ''
  const acquisitionLabel = ACQUISITIONS.find((a) => a.value === form.acquisition)?.label ?? ''
  const pricingLabel =
    form.pricingIntent === 'offer'
      ? 'Make me an offer'
      : form.pricingIntent === 'asking'
        ? `Asking $${form.askingPrice}`
        : 'Donate (free)'

  return (
    <div className="pt-8 pb-4">
      <h1 className="text-2xl sm:text-[28px] font-display text-charcoal mb-2">Review your submission</h1>
      <p className="text-sm text-charcoal/50 font-body mb-8">Make sure everything looks right.</p>

      <div className="rounded-xl border border-charcoal/10 bg-[#f7f7f7] overflow-hidden">
        {/* Photos */}
        <div className="p-4 flex gap-2 overflow-x-auto scrollbar-hide">
          {form.photos.map((photo, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={photo.preview}
              alt={`Photo ${i + 1}`}
              className="w-20 h-20 rounded-xl object-cover shrink-0"
            />
          ))}
        </div>

        <div className="px-4 pb-4 space-y-3">
          {/* Category + Condition */}
          <ReviewRow label="Item" onEdit={() => onEdit(3)}>
            <div className="flex gap-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 bg-[#f0f0f0] text-[#222222] text-xs font-semibold rounded-full font-body">
                {categoryLabel}
              </span>
              {conditionLabel && (
                <span className="px-2.5 py-0.5 bg-charcoal/5 text-charcoal/60 text-xs font-semibold rounded-full font-body">
                  {conditionLabel}
                </span>
              )}
            </div>
          </ReviewRow>

          {/* Description */}
          {form.description && (
            <ReviewRow label="Description" onEdit={() => onEdit(3)}>
              <p className="text-sm text-charcoal/70 font-body line-clamp-2">{form.description}</p>
            </ReviewRow>
          )}

          {/* Details */}
          {(eraLabel || form.maker || acquisitionLabel) && (
            <ReviewRow label="Details" onEdit={() => onEdit(4)}>
              <div className="text-sm text-charcoal/70 font-body space-y-0.5">
                {eraLabel && <p>Age: {eraLabel}</p>}
                {form.maker && <p>Maker: {form.maker}</p>}
                {form.dimensions.h && (
                  <p>
                    Size: {form.dimensions.h}&quot; × {form.dimensions.w}&quot; × {form.dimensions.d}&quot;
                  </p>
                )}
                {acquisitionLabel && <p>Source: {acquisitionLabel}</p>}
              </div>
            </ReviewRow>
          )}

          {/* Pricing */}
          <ReviewRow label="Pricing" onEdit={() => onEdit(form.intent === 'donate' ? 1 : 5)}>
            <p className="text-sm text-charcoal/70 font-body">{pricingLabel}</p>
          </ReviewRow>

          {/* Location & Contact */}
          <ReviewRow label="Contact" onEdit={() => onEdit(6)}>
            <div className="text-sm text-charcoal/70 font-body space-y-0.5">
              <p>{form.name}</p>
              <p>{form.email}</p>
              {form.phone && <p>{form.phone}</p>}
              <p>ZIP: {form.zip}</p>
              {form.timeline && (
                <p className="text-charcoal/40">
                  Timeline:{' '}
                  {form.timeline === 'no-rush'
                    ? 'No rush'
                    : form.timeline === 'within-month'
                      ? 'Within a month'
                      : 'This week'}
                </p>
              )}
            </div>
          </ReviewRow>
        </div>
      </div>

      <p className="text-xs text-charcoal/30 font-body text-center mt-6">
        Free. No obligation. The mall typically responds within 24 hours.
      </p>
    </div>
  )
}

function ReviewRow({
  label,
  onEdit,
  children,
}: {
  label: string
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-t border-charcoal/5 first:border-t-0">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-charcoal/35 uppercase tracking-wider font-body mb-1">
          {label}
        </p>
        {children}
      </div>
      <button
        onClick={onEdit}
        className="shrink-0 w-7 h-7 rounded-full bg-charcoal/5 flex items-center justify-center hover:bg-charcoal/10 transition-colors mt-1"
      >
        <Pencil className="w-3 h-3 text-charcoal/40" />
      </button>
    </div>
  )
}

// ── Success Screen ─────────────────────────────────────────────────
function SuccessScreen({ name, onReset }: { name: string; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-lg mx-auto px-4 text-center"
    >
      {/* Checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Check className="w-8 h-8 text-green-600" />
        </motion.div>
      </motion.div>

      <h1 className="text-2xl font-display text-charcoal mb-3">Thanks{name ? `, ${name}` : ''}!</h1>
      <p className="text-sm text-charcoal/50 font-body mb-8">
        Your submission is on its way to Marietta Antique Mall.
        <br />
        If they’re interested, they’ll reach out to you directly — usually within 24 hours.
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#222222] text-white font-semibold text-sm font-body hover:brightness-110 transition-all"
        >
          Submit another item
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-charcoal/10 text-charcoal/60 text-sm font-body hover:bg-charcoal/[0.03] transition-all"
        >
          Back to home
        </Link>
      </div>
    </motion.div>
  )
}
