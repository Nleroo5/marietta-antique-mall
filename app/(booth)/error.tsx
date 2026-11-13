'use client'

/** Error screen for vendor and admin pages: no site header, footer or trackers. */
export default function BoothError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <p className="font-display text-2xl">Marietta Antique Mall</p>
        <p className="mt-3 text-base">Something went wrong loading your page. Your photos and text are saved on this phone.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 min-h-[52px] w-full rounded-lg bg-mauve text-lg font-bold text-black"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
