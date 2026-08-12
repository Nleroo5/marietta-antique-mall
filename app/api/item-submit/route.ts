import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { rateLimit } from '@/lib/rate-limit'
import { partnerPromoHtml } from '@/lib/transactional-emails'

// Lazy initialization to avoid build-time errors when the key is absent.
let resend: Resend | null = null
function getResendClient(): Resend | null {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

const MALL_NAME = 'Marietta Antique Mall'
// Where item leads land. The mall's monitored inbox (overridable via env).
const INBOX = process.env.MARIETTA_INBOX || 'contactus@mariettaantiquemall.com'
// Verified Resend sender on the mall's own domain (overridable via env).
const MAIL_FROM = process.env.MAIL_FROM || 'Marietta Antique Mall <sell@mariettaantiquemall.com>'

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const CATEGORY_LABELS: Record<string, string> = {
  furniture: 'Furniture',
  jewelry: 'Jewelry & Watches',
  art: 'Art & Paintings',
  collectibles: 'Collectibles',
  pottery: 'Pottery & Ceramics',
  coins: 'Coins & Currency',
  clothing: 'Clothing & Textiles',
  books: 'Books & Maps',
  other: 'Other',
}

function isAllowedOrigin(origin: string): boolean {
  return (
    origin.includes('mariettaantiquemall.com') ||
    origin.includes('.vercel.app') ||
    origin.includes('localhost')
  )
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || request.headers.get('referer') || ''
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { success } = await rateLimit(request, { prefix: 'item-submit', limit: 5, window: '1 m' })
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a moment.' },
      { status: 429 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    intent,
    photos,
    category,
    description,
    condition,
    era,
    maker,
    dimensions,
    acquisition,
    pricingIntent,
    askingPrice,
    zip,
    name,
    email,
    phone,
    timeline,
    _honey,
  } = body as {
    intent?: string
    photos?: string[]
    category?: string
    description?: string
    condition?: string
    era?: string
    maker?: string
    dimensions?: { h?: string; w?: string; d?: string }
    acquisition?: string
    pricingIntent?: string
    askingPrice?: string
    zip?: string
    name?: string
    email?: string
    phone?: string
    timeline?: string
    _honey?: string
  }

  // Honeypot: silently succeed for bots.
  if (_honey) {
    return NextResponse.json({ success: true }, { status: 200 })
  }

  if (!name || !email || !zip || !category || !photos?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Email service is not configured. Please call (770) 973-5600 to submit your item.' },
      { status: 503 }
    )
  }

  const trimmedZip = String(zip).trim()

  const categoryLabel = CATEGORY_LABELS[category] || category
  const intentLabel = intent === 'sell' ? 'Sell' : 'Donate'
  const pricingLabel =
    pricingIntent === 'offer'
      ? 'Make me an offer'
      : pricingIntent === 'asking'
        ? `Asking $${esc(askingPrice)}`
        : 'Donate (free)'
  const conditionLabel = condition
    ? condition.charAt(0).toUpperCase() + condition.slice(1)
    : 'Not specified'
  const timelineLabel =
    timeline === 'this-week' ? 'This week' : timeline === 'within-month' ? 'Within a month' : 'No rush'

  const detailRows = [
    era && `Age: ${esc(era)}`,
    maker && `Maker: ${esc(maker)}`,
    dimensions?.h && `Size: ${esc(dimensions.h)}" × ${esc(dimensions.w)}" × ${esc(dimensions.d)}"`,
    acquisition && `Source: ${esc(acquisition)}`,
  ]
    .filter(Boolean)
    .join('<br>')

  // Only trust photo URLs that came from our own Blob store.
  const photoUrls = (photos || [])
    .filter(
      (url): url is string =>
        typeof url === 'string' && url.includes('.public.blob.vercel-storage.com/')
    )
    .slice(0, 5)

  const photoHtml =
    photoUrls.length > 0
      ? photoUrls
          .map(
            (url) =>
              `<img src="${esc(url)}" alt="Item photo" style="width:120px;height:120px;object-fit:cover;border-radius:8px;margin-right:8px;" />`
          )
          .join('')
      : '<p style="color:#999;font-size:13px;">No photos uploaded.</p>'

  const leadHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;">
      <div style="padding:20px 24px;border-bottom:2px solid #2A2A2A;">
        <p style="color:#2A2A2A;font-size:20px;font-weight:700;margin:0;">${esc(MALL_NAME)}</p>
        <p style="color:#888;font-size:13px;margin:4px 0 0;">New item submission</p>
      </div>
      <div style="padding:20px 24px;">
        <p style="color:#2A2A2A;font-size:18px;font-weight:700;margin:0 0 4px;">${esc(intentLabel)} · ${esc(categoryLabel)}</p>
        <p style="color:#888;font-size:13px;margin:0 0 20px;">${esc(conditionLabel)} condition · ZIP ${esc(trimmedZip)}</p>

        <div style="margin-bottom:20px;">${photoHtml}</div>

        ${description ? `<p style="color:#444;font-size:14px;line-height:1.6;margin:0 0 16px;">"${esc(description)}"</p>` : ''}

        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;font-weight:600;color:#2A2A2A;width:120px;vertical-align:top;">From</td><td style="padding:6px 0;color:#444;">${esc(name)} · ${esc(email)}${phone ? ' · ' + esc(phone) : ''}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#2A2A2A;vertical-align:top;">Location</td><td style="padding:6px 0;color:#444;">ZIP ${esc(trimmedZip)}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#2A2A2A;vertical-align:top;">Pricing</td><td style="padding:6px 0;color:#444;">${esc(pricingLabel)}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#2A2A2A;vertical-align:top;">Timeline</td><td style="padding:6px 0;color:#444;">${esc(timelineLabel)}</td></tr>
          ${detailRows ? `<tr><td style="padding:6px 0;font-weight:600;color:#2A2A2A;vertical-align:top;">Details</td><td style="padding:6px 0;color:#444;">${detailRows}</td></tr>` : ''}
        </table>
      </div>
      <div style="padding:14px 24px;background:#F7F0E8;font-size:12px;color:#999;">
        Reply directly to this email to reach ${esc(name)}.
      </div>
    </div>
  `

  const autoReplyHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;">
      <div style="padding:20px 24px;border-bottom:2px solid #2A2A2A;">
        <p style="color:#2A2A2A;font-size:20px;font-weight:700;margin:0;">${esc(MALL_NAME)}</p>
      </div>
      <div style="padding:28px 24px;">
        <p style="color:#2A2A2A;font-size:16px;font-weight:600;margin:0 0 12px;">Hi ${esc(name)},</p>
        <p style="color:#444;font-size:14px;line-height:1.6;margin:0 0 16px;">
          Thanks for sending us your ${esc(String(categoryLabel).toLowerCase())}. We've received your submission and will review it shortly. If we're interested, we'll reach out to you directly — usually within 24 hours.
        </p>
        <p style="color:#444;font-size:14px;line-height:1.6;margin:0;">You can reply directly to this email if you have any questions.</p>
      </div>${partnerPromoHtml('item')}
      <div style="padding:16px 24px;background:#F7F0E8;font-size:12px;color:#999;">
        ${esc(MALL_NAME)} · (770) 973-5600
      </div>
    </div>
  `

  const resendClient = getResendClient()
  if (!resendClient) {
    return NextResponse.json({ error: 'Email service is not available' }, { status: 503 })
  }

  try {
    const [leadResult, autoReplyResult] = await Promise.allSettled([
      resendClient.emails.send({
        from: MAIL_FROM,
        to: INBOX,
        replyTo: email,
        subject: `Item submission: ${categoryLabel} — ${intentLabel} — ${name}`,
        html: leadHtml,
      }),
      resendClient.emails.send({
        from: MAIL_FROM,
        to: email,
        subject: `We received your item — ${MALL_NAME}`,
        html: autoReplyHtml,
      }),
    ])

    // Only the staff notification is critical — it carries the lead. A failed
    // confirmation is logged but must not tell the submitter their item was lost.
    if (leadResult.status === 'rejected') {
      throw new Error(
        leadResult.reason instanceof Error ? leadResult.reason.message : 'Lead email failed'
      )
    }
    if (leadResult.value.error) {
      throw new Error(leadResult.value.error.message)
    }
    if (autoReplyResult.status === 'rejected' || autoReplyResult.value.error) {
      console.error('item-submit: confirmation to submitter failed', autoReplyResult)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('item-submit error:', error)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
