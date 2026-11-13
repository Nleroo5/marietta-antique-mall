/** 404 inside vendor and admin pages: no site header, footer or trackers. */
export default function BoothNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <p className="font-display text-2xl">Marietta Antique Mall</p>
        <p className="mt-3 text-base">This page doesn&apos;t exist. Open your vendor page from the QR code on your card.</p>
      </div>
    </main>
  )
}
