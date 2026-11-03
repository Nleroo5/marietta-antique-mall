import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { escapeHtml, isValidEmail } from '@/lib/transactional-emails'
import { rateLimit } from '@/lib/rate-limit'
import { HONEYPOT_FIELD, RENDERED_AT_FIELD, isAllowedOrigin } from '@/lib/spam-guard'

/**
 * Newsletter signups. There is no mailing-list service behind this: each
 * signup is emailed to the mall's inbox as a "New Newsletter Subscriber"
 * notice, the same inbox that receives vendor applications.
 *
 * Because a public form here puts mail straight into that inbox, it gets the
 * same screening as the vendor application form: origin, rate limit, honeypot,
 * and a render timestamp that a direct POST to this endpoint never has.
 */

// One email field and a button. Scrolling down to the form alone takes longer
// than this; a script posting the moment the page loads does not.
const MIN_FILL_MS = 2_000

const SOURCE_LABELS: Record<string, string> = {
  homepage: 'the homepage newsletter form',
  popup: 'the website newsletter popup',
}

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null
function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

// Deliberately shaped like success: a bot that sees a rejection retries or
// adapts, whereas one that believes it succeeded moves on.
function quietSuccess(reason: string) {
  console.warn(`newsletter: rejected (${reason})`)
  return NextResponse.json({ success: true, message: 'Successfully subscribed to newsletter' }, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') || request.headers.get('referer') || ''
    if (!isAllowedOrigin(origin)) return quietSuccess('bad origin')

    // Generous on purpose: the honeypot and timing checks do the real work, and
    // a rate-limited request is silently dropped, so this must never catch a
    // real person, even on a carrier IP shared by many phones.
    const { success: withinRate } = await rateLimit(request, {
      prefix: 'newsletter',
      limit: 10,
      window: '10 m',
    })
    if (!withinRate) return quietSuccess('rate limited')

    const body = await request.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim() : ''

    // A real person can mistype, so this one is answered honestly.
    if (!isValidEmail(email) || email.length > 254) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.', code: 'INVALID_EMAIL' },
        { status: 400 }
      )
    }

    const honeypot = body?.[HONEYPOT_FIELD]
    if (typeof honeypot === 'string' && honeypot.trim() !== '') return quietSuccess('honeypot filled')

    const renderedAt = Number(body?.[RENDERED_AT_FIELD])
    if (!body?.[RENDERED_AT_FIELD] || !Number.isFinite(renderedAt)) {
      return quietSuccess('missing form timestamp')
    }
    const elapsed = Date.now() - renderedAt
    if (elapsed < MIN_FILL_MS) return quietSuccess(`submitted in ${elapsed}ms`)

    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email service is not configured.',
        },
        { status: 503 }
      )
    }

    const sourceLabel = SOURCE_LABELS[body?.source] ?? 'the website'
    const safeEmail = escapeHtml(email)

    // Format email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              background-color: #f4f4f4;
            }
            .email-container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #2A2A2A 0%, #3A3A3A 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 28px;
              font-weight: 700;
              color: #D4C4B0;
              margin: 0;
            }
            .content {
              padding: 40px 30px;
            }
            .title {
              font-size: 20px;
              font-weight: 600;
              color: #2A2A2A;
              margin: 0 0 24px 0;
              text-align: center;
              border-bottom: 3px solid #D4C4B0;
              padding-bottom: 12px;
            }
            .email-box {
              background-color: #FAF8F5;
              border: 2px solid #D4C4B0;
              border-radius: 6px;
              padding: 20px;
              text-align: center;
              font-size: 18px;
              font-weight: 600;
              color: #2A2A2A;
              margin: 20px 0;
            }
            .footer {
              background-color: #FAF8F5;
              padding: 24px 30px;
              border-top: 1px solid #E5E5E5;
              text-align: center;
              font-size: 13px;
              color: #666;
            }
            .timestamp {
              font-weight: 600;
              color: #2A2A2A;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo">MARIETTA ANTIQUE MALL</div>
            </div>
            <div class="content">
              <h1 class="title">New Newsletter Subscriber</h1>
              <div class="email-box">
                ${safeEmail}
              </div>
              <p style="text-align: center; color: #666; margin-top: 20px;">
                Subscribed via ${sourceLabel}
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0;">
                <span class="timestamp">Submitted on ${new Date().toLocaleString('en-US', {
                  timeZone: 'America/New_York',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })} ET</span>
              </p>
              <p style="margin: 6px 0 0 0;">
                Via <a href="https://www.mariettaantiquemall.com" style="color: #D4C4B0;">www.mariettaantiquemall.com</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email via Resend
    const resendClient = getResendClient()
    if (!resendClient) {
      throw new Error('Email service is not available')
    }

    const { error } = await resendClient.emails.send({
      from: 'Marietta Antique Mall <newsletter@mariettaantiquemall.com>',
      to: 'contactus@mariettaantiquemall.com',
      replyTo: email,
      subject: `Newsletter Subscription - ${email}`,
      html: emailHtml,
    })

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully subscribed to newsletter',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing newsletter subscription:', error)
    return NextResponse.json(
      {
        error: 'Failed to subscribe to newsletter. Please try again later.',
        code: 'SUBSCRIPTION_FAILED',
      },
      { status: 500 }
    )
  }
}
