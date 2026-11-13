import { describe, expect, it } from 'vitest'
import { isBoothMapPrivatePath } from '@/lib/booth-map/paths'

describe('isBoothMapPrivatePath', () => {
  it.each(['/v/abc', '/v', '/vendor', '/vendor/', '/vendor/items', '/admin', '/admin/vendors'])('%s is private', (p) =>
    expect(isBoothMapPrivatePath(p)).toBe(true)
  )
  // Every public route in the site today, plus near misses.
  it.each(['/', '/vendors', '/visit', '/contact', '/gallery', '/privacy', '/sell', '/shop', '/terms', '/no-such-page', '/vendorsx', '/administration', '/vv'])(
    '%s is public',
    (p) => expect(isBoothMapPrivatePath(p)).toBe(false)
  )
})
