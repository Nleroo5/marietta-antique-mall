'use client'

import { useState } from 'react'
import { MAX_SALE_PERCENT, MIN_SALE_PERCENT, SALE_QUICK_PICKS, formatPrice, parseSalePercentInput, salePriceCents } from '@/lib/booth-map/pricing'
import { formatPickedDay, mallToday } from '@/lib/booth-map/sale-dates'
import type { BoothSaleView, SalePreviewItem } from '@/lib/booth-map/sales'

/**
 * Put my booth on sale (SPEC 5b). One discount for everything in a booth, ending on
 * the exact day the vendor picks. The server checks the date again in mall time,
 * because some phone date pickers ignore min and max.
 */

export interface SaleBooth {
  number: string
  active: BoothSaleView | null
  preview: SalePreviewItem | null
}

export interface SaleSetup {
  /** YYYY-MM-DD in mall time: first and last day a vendor may pick, and the suggestion. */
  range: { min: string; max: string; suggested: string }
  booths: SaleBooth[]
}

const EXPIRED = 'Your vendor link has expired. Tap the link the mall texted you again.'

export default function BoothSale({ setup, onChange }: { setup: SaleSetup; onChange: (booths: SaleBooth[]) => void }) {
  const { range, booths } = setup
  const [boothNo, setBoothNo] = useState(booths[0]?.number ?? '')
  const booth = booths.find((b) => b.number === boothNo) ?? booths[0]
  const [editing, setEditing] = useState(!booth?.active)
  const [percentText, setPercentText] = useState('20')
  const [lastDay, setLastDay] = useState(range.suggested)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmEnd, setConfirmEnd] = useState(false)

  if (!booth) return null

  // Any whole percent from 1 to 90, typed or picked from the shortcuts.
  const parsedPercent = parseSalePercentInput(percentText)
  const percent = parsedPercent.ok ? parsedPercent.percent : null
  const dayOk = lastDay >= range.min && lastDay <= range.max && formatPickedDay(lastDay) !== ''
  const dayError = !lastDay
    ? 'Pick the last day of your sale.'
    : lastDay < range.min
      ? 'That day has already passed. Pick today or a later day.'
      : lastDay > range.max
        ? `A sale can run up to 30 days. Pick ${formatPickedDay(range.max)} or earlier.`
        : null

  async function send(body: Record<string, unknown>) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/booth-map/sale', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = (await res.json().catch(() => ({}))) as { sale?: BoothSaleView | null; error?: string }
      if (res.status === 401) return setError(EXPIRED)
      if (!res.ok) return setError(data.error ?? 'That didn’t work. Try again.')
      onChange(booths.map((b) => (b.number === booth.number ? { ...b, active: data.sale ?? null } : b)))
      setEditing(!data.sale)
      setConfirmEnd(false)
    } catch {
      setError('No connection. Try again when you have signal.')
    } finally {
      setBusy(false)
    }
  }

  const pick = (n: string) => {
    setBoothNo(n)
    setPercentText('20')
    setLastDay(range.suggested)
    setEditing(!booths.find((b) => b.number === n)?.active)
    setConfirmEnd(false)
    setError(null)
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pb-10 pt-5">
      {booths.length > 1 && (
        <div className="flex flex-col gap-1">
          <label htmlFor="sale-booth" className="text-sm font-semibold">
            Booth
          </label>
          <select id="sale-booth" value={booth.number} onChange={(e) => pick(e.target.value)} className="min-h-[48px] rounded-lg border-2 border-champagne-dark bg-white px-3 text-lg">
            {booths.map((b) => (
              <option key={b.number} value={b.number}>
                Booth {b.number}
                {b.active ? ` (${b.active.percent}% off now)` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {booth.active && !editing ? (
        <>
          <div className="rounded-xl bg-mauve-light p-4">
            <p className="text-lg font-bold">
              {booth.active.percent}% off everything in Booth {booth.number}
            </p>
            <p className="text-base">Runs through the end of {booth.active.lastDayLabel}.</p>
          </div>
          <p className="text-base text-charcoal-light">Shoppers see the sale price on every item and a sale banner on your booth page. Anything you post during the sale is included.</p>
          <button
            type="button"
            onClick={() => {
              // Start from the current sale: its discount and its last day (mall time).
              const active = booth.active!
              setPercentText(String(active.percent))
              setLastDay(mallToday(new Date(new Date(active.endsAt).getTime() - 1)))
              setEditing(true)
            }}
            disabled={busy}
            className="min-h-[52px] rounded-lg border-2 border-mauve bg-mauve text-lg font-semibold text-black">
            Change the sale
          </button>
          {confirmEnd ? (
            <button type="button" onClick={() => send({ action: 'end', booth: booth.number })} disabled={busy} className="min-h-[52px] rounded-lg border-2 border-red-700 text-lg font-semibold text-red-700">
              {busy ? 'Ending…' : 'Tap again to end the sale now'}
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmEnd(true)} disabled={busy} className="min-h-[52px] rounded-lg border-2 border-mauve text-lg font-semibold text-black">
              End sale now
            </button>
          )}
        </>
      ) : (
        <>
          <div>
            <h1 className="font-display text-2xl">{booth.active ? 'Change your sale' : 'Put my booth on sale'}</h1>
            <p className="mt-1 text-base text-charcoal-light">One discount for every live item in Booth {booth.number}, including anything you post during the sale.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="sale-percent" className="text-sm font-semibold">
              Discount
            </label>
            <div className="flex items-center gap-2">
              <input
                id="sale-percent"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={percentText}
                onChange={(e) => setPercentText(e.target.value)}
                aria-describedby="sale-percent-help"
                className="min-h-[52px] w-28 rounded-lg border-2 border-champagne-dark bg-white px-3 text-right text-2xl font-bold tabular-nums"
              />
              <span className="text-2xl font-bold">% off</span>
            </div>
            <p id="sale-percent-help" className={`text-sm ${parsedPercent.ok ? 'text-charcoal-light' : 'text-red-700'}`}>
              {parsedPercent.ok ? `Any whole number from ${MIN_SALE_PERCENT}% to ${MAX_SALE_PERCENT}%. Or tap one:` : parsedPercent.error}
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Common discounts">
              {SALE_QUICK_PICKS.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={percent === p}
                  onClick={() => setPercentText(String(p))}
                  className={`min-h-[44px] min-w-[64px] rounded-full border-2 px-4 text-lg font-semibold ${percent === p ? 'border-charcoal bg-charcoal text-white' : 'border-champagne-dark bg-white text-black'}`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="sale-last-day" className="text-sm font-semibold">
              Last day of the sale
            </label>
            <input
              id="sale-last-day"
              type="date"
              value={lastDay}
              min={range.min}
              max={range.max}
              onChange={(e) => setLastDay(e.target.value)}
              aria-describedby="sale-last-day-help"
              className="min-h-[52px] rounded-lg border-2 border-champagne-dark bg-white px-3 text-lg"
            />
            <p id="sale-last-day-help" className={`text-sm ${dayError ? 'text-red-700' : 'text-charcoal-light'}`}>
              {dayError ?? `Runs through the end of ${formatPickedDay(lastDay)}. Pick any day up to ${formatPickedDay(range.max)}.`}
            </p>
          </div>

          {booth.preview && (
            <div className="flex items-center gap-3 rounded-xl border border-champagne-dark bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- a small private preview, not worth the image optimizer */}
              <img src={booth.preview.photoUrl} alt="" className="h-16 w-16 flex-none rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{booth.preview.title}</p>
                <p className="text-lg font-bold tabular-nums">
                  <s className="mr-1.5 font-normal text-charcoal-light">{formatPrice(booth.preview.priceCents)}</s>
                  {percent === null ? '…' : formatPrice(salePriceCents(booth.preview.priceCents, percent))}
                </p>
                <p className="text-xs text-charcoal-light">How it will look to shoppers</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => send({ action: 'start', booth: booth.number, percent, lastDay })}
            disabled={busy || !dayOk || percent === null}
            className="min-h-[56px] rounded-lg border-2 border-mauve bg-mauve text-lg font-bold text-black disabled:opacity-50"
          >
            {busy ? 'Saving…' : `${booth.active ? 'Save' : 'Start'} ${percent ?? '…'}% sale through ${formatPickedDay(lastDay, false) || '…'}`}
          </button>
          {booth.active && (
            <button type="button" onClick={() => setEditing(false)} disabled={busy} className="min-h-[48px] font-semibold text-black underline">
              Keep the current sale
            </button>
          )}
          <p className="text-sm text-charcoal-light">Ask the front desk how the register applies booth sales before you start one.</p>
        </>
      )}
      {error && (
        <p role="alert" className="text-base text-red-700">
          {error}
        </p>
      )}
    </main>
  )
}
