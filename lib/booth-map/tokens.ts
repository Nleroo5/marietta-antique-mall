import { createHash, randomBytes } from 'node:crypto'

/**
 * Vendor links and device cookies (SPEC section 9).
 *
 * A token is 32 random bytes, sent to the vendor once inside their link and never
 * stored. Only its SHA-256 hash is stored, so a database leak does not leak links.
 * A plain hash is enough here: 256 bits of randomness cannot be brute-forced, so
 * a slow password hash would add cost without adding safety.
 */
export const TOKEN_BYTES = 32

export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

// base64url of 32 bytes is exactly 43 characters from [A-Za-z0-9_-].
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/

/** Cheap shape check before any database lookup, so junk never reaches a query. */
export function isWellFormedToken(value: unknown): value is string {
  return typeof value === 'string' && TOKEN_SHAPE.test(value)
}
