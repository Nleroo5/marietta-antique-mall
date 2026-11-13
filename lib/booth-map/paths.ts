/**
 * Booth map vendor and admin paths: /v/..., /vendor..., /admin....
 * Not /vendors (the public vendor-application page) or /visit.
 * Trackers never render on these paths (SPEC section 9).
 */
const PRIVATE_PATH = /^\/(v|vendor|admin)(\/|$)/i

export function isBoothMapPrivatePath(pathname: string): boolean {
  return PRIVATE_PATH.test(pathname)
}
