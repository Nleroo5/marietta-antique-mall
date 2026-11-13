import { notFound } from 'next/navigation'

/** Any unknown address under this path gets the vendor 404 (no site trackers), not the public one. */
export default function Unknown() {
  notFound()
}
