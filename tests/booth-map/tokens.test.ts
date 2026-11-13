import { describe, expect, it } from 'vitest'
import { generateToken, hashToken, isWellFormedToken } from '@/lib/booth-map/tokens'

describe('vendor tokens (SPEC 9)', () => {
  it('are 32 random bytes in base64url', () => {
    const t = generateToken()
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(Buffer.from(t, 'base64url')).toHaveLength(32)
  })

  it('do not repeat', () => {
    const seen = new Set(Array.from({ length: 2000 }, generateToken))
    expect(seen.size).toBe(2000)
  })

  it('hash to a stable 64-char hex digest that differs from the token', () => {
    const t = generateToken()
    expect(hashToken(t)).toMatch(/^[0-9a-f]{64}$/)
    expect(hashToken(t)).toBe(hashToken(t))
    expect(hashToken(t)).not.toBe(t)
    expect(hashToken(t)).not.toBe(hashToken(generateToken()))
  })

  it('shape check rejects anything that is not a token', () => {
    expect(isWellFormedToken(generateToken())).toBe(true)
    for (const bad of ['', 'short', 'x'.repeat(44), 'a'.repeat(42) + '=', 'a'.repeat(42) + '/', null, 123, undefined]) {
      expect(isWellFormedToken(bad)).toBe(false)
    }
  })
})
