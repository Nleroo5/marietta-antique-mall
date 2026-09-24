/**
 * Screening for the public application forms.
 *
 * Built in response to ~15-20 automated vendor applications a day landing in
 * the mall's inbox with random-consonant names ("Xjcywwtpk", "Cnkmrndm LLC")
 * and harvested third-party email addresses.
 *
 * Two field names are shared with the client, so the form must render them.
 */

export const HONEYPOT_FIELD = 'companyWebsite'
export const RENDERED_AT_FIELD = 'renderedAt'

/** A human filling seven fields cannot beat this. A script always does. */
const MIN_FILL_MS = 4_000
/** Older than this and the page has been sitting open, or the token is replayed. */
const MAX_FORM_AGE_MS = 12 * 60 * 60 * 1000

export type SpamVerdict =
  | { action: 'allow' }
  | { action: 'flag'; reasons: string[] }
  | { action: 'reject'; reason: string }

export interface SubmissionFields {
  dealerName: string
  email: string
  phone: string
  merchandiseType: string
  businessName?: string
  previousMalls?: string
  additionalComments?: string
  honeypot: string | null
  renderedAt: string | null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Random-consonant strings are the signature of this wave of spam. Real words
 * carry vowels; the samples observed run at or below 14% vowels
 * ("UzjKAMlhrfVXhGrvYqkIrN" is 13.6%, "Cnkmrndm" is 0%).
 *
 * The threshold sits at 15% and only considers tokens of six characters or
 * more, which keeps genuine low-vowel surnames clear: "Strickland" is 20%,
 * "Thompson" 25%. 'y' is deliberately not counted as a vowel, since counting
 * it lets "Ygbgtnid" pass.
 */
export function gibberishTokensIn(value: string | undefined | null): string[] {
  if (!value) return []
  const tokens = value.match(/[A-Za-z]{6,}/g)
  if (!tokens) return []
  return tokens.filter((token) => {
    const vowels = (token.match(/[aeiou]/gi) || []).length
    return vowels / token.length < 0.15
  })
}

export function looksLikeGibberish(value: string | undefined | null): boolean {
  return gibberishTokensIn(value).length > 0
}

/** Digits only, so "(770) 555-0142" and "7705550142" both measure the same. */
function digitCount(value: string): number {
  return (value.match(/\d/g) || []).length
}

export function screenSubmission(fields: SubmissionFields): SpamVerdict {
  // 1. Honeypot. Hidden from people, irresistible to form-filling scripts.
  if (fields.honeypot && fields.honeypot.trim() !== '') {
    return { action: 'reject', reason: 'honeypot filled' }
  }

  // 2. Timing. A direct POST to the endpoint never loads the page, so it has
  //    no timestamp at all — which is the single most effective check here.
  const renderedAt = Number(fields.renderedAt)
  if (!fields.renderedAt || !Number.isFinite(renderedAt)) {
    return { action: 'reject', reason: 'missing form timestamp' }
  }
  const elapsed = Date.now() - renderedAt
  if (elapsed < MIN_FILL_MS) {
    return { action: 'reject', reason: `submitted in ${elapsed}ms` }
  }
  if (elapsed > MAX_FORM_AGE_MS) {
    return { action: 'reject', reason: 'form timestamp too old' }
  }

  // 3. Required fields. The form marks these required; the route never did.
  const required: [string, string][] = [
    ['dealerName', fields.dealerName],
    ['email', fields.email],
    ['phone', fields.phone],
    ['merchandiseType', fields.merchandiseType],
  ]
  for (const [name, value] of required) {
    if (!value || value.trim() === '') {
      return { action: 'reject', reason: `missing ${name}` }
    }
  }

  if (!EMAIL_RE.test(fields.email.trim())) {
    return { action: 'reject', reason: 'invalid email' }
  }
  if (digitCount(fields.phone) < 10) {
    return { action: 'reject', reason: 'phone has too few digits' }
  }

  // 4. Content heuristics. These only downgrade to "flag", never reject, so an
  //    unusual real name cannot cost the mall a genuine application.
  //    Distinct words are counted, not fields: a real applicant named Wyndham
  //    puts that one unusual word in both "dealer name" and "business name",
  //    which must not read as two independent signals.
  const nonsense = new Set<string>()
  for (const value of [
    fields.dealerName,
    fields.businessName,
    fields.merchandiseType,
    fields.previousMalls,
  ]) {
    for (const token of gibberishTokensIn(value)) nonsense.add(token.toLowerCase())
  }

  const reasons: string[] = []
  if (nonsense.size > 0) {
    reasons.push(`${nonsense.size} nonsense word(s): ${[...nonsense].slice(0, 4).join(', ')}`)
  }

  // A real description of merchandise contains spaces.
  const merch = fields.merchandiseType.trim()
  const merchIsOneLongWord = merch.length > 15 && !/\s/.test(merch)
  if (merchIsOneLongWord) reasons.push('merchandise is one long word')

  // One unusual surname scores 1 and passes. Generated submissions stack up.
  const score = nonsense.size + (merchIsOneLongWord ? 1 : 0)
  if (score >= 2) return { action: 'flag', reasons }

  return { action: 'allow' }
}

/**
 * Same-origin check. A browser always sends Origin on a cross-origin fetch and
 * Referer on same-origin navigation; a bare script POSTing to the endpoint
 * usually sends neither.
 *
 * Duplicated logic already exists inline in item-submit and upload-item-photo;
 * this is the shared copy, and those should migrate to it.
 */
export function isAllowedOrigin(origin: string): boolean {
  return (
    origin.includes('mariettaantiquemall.com') ||
    origin.includes('.vercel.app') ||
    origin.includes('localhost')
  )
}
