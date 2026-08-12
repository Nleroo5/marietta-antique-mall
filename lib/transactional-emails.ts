/**
 * Shared building blocks for the transactional confirmation emails sent from
 * /api/item-submit and /api/dealer-application.
 *
 * Everything here has to survive Outlook and Gmail, which means: inline styles
 * only, tables for anything that needs padding or a background, absolute image
 * URLs (data URIs and SVG are stripped by most clients), and width/height
 * attributes on every image.
 */

export const SITE_URL = 'https://www.mariettaantiquemall.com'
export const MALL_NAME = 'Marietta Antique Mall'
export const MALL_PHONE = '(770) 973-5600'

/** Antique Partner brand colours, sampled from the badge artwork. */
const AP_PINK = '#FC3262'
const AP_NAVY = '#03213D'
const AP_CREAM = '#FBFAF6'

const AP_BADGE = `${SITE_URL}/badges/antique-partner-featured.png`
const AP_DIRECTORY = 'https://antiquepartner.com/directory/state/georgia'

export const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export type PartnerVariant = 'item' | 'vendor'

const PARTNER_COPY: Record<PartnerVariant, { headline: string; body: string }> = {
  item: {
    headline: 'Find antique events, deals and stores near you',
    body:
      'We&rsquo;re featured on Antique Partner &mdash; the world&rsquo;s largest directory of ' +
      'antique and thrift stores. Browse upcoming shows, deals and shops in your area.',
  },
  vendor: {
    headline: 'Discover antique malls near you',
    body:
      `${MALL_NAME} is featured on Antique Partner &mdash; the world&rsquo;s largest directory ` +
      'of antique and thrift stores. Find events, deals and stores nearby.',
  },
}

/**
 * The "Featured on Antique Partner" block. Sits below the transactional message
 * so each email's primary purpose stays transactional.
 *
 * The CTA is a bgcolor table cell rather than a styled anchor because Outlook
 * drops padding on links. Pink is used only for the rule and the button: white
 * on #FC3262 is 3.6:1, which clears the 3:1 large-text bar at 19px bold but
 * would fail as body copy, so all small text stays navy.
 */
export function partnerPromoHtml(variant: PartnerVariant): string {
  const { headline, body } = PARTNER_COPY[variant]
  const url =
    `${AP_DIRECTORY}?utm_source=mam_email&amp;utm_medium=transactional` +
    `&amp;utm_content=${variant}_confirmation`

  return `
      <div style="border-top:3px solid ${AP_PINK};background:${AP_CREAM};padding:24px;">
        <a href="${url}" target="_blank" style="text-decoration:none;">
          <img src="${AP_BADGE}" alt="Featured on Antique Partner" width="174" height="76" style="display:block;border:0;outline:none;margin:0 0 16px;" />
        </a>
        <p style="color:${AP_NAVY};font-size:19px;font-weight:700;line-height:1.3;margin:0 0 8px;">${headline}</p>
        <p style="color:#5A5F66;font-size:14px;line-height:1.6;margin:0 0 18px;">${body}</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0;">
          <tr>
            <td bgcolor="${AP_PINK}" style="border-radius:6px;">
              <a href="${url}" target="_blank" style="display:inline-block;padding:13px 26px;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:19px;font-weight:700;line-height:1;text-decoration:none;">Explore the directory &rarr;</a>
            </td>
          </tr>
        </table>
      </div>`
}

/**
 * Confirmation sent to someone who submits the vendor application on /vendors.
 * Deliberately mirrors the /sell auto-reply so the two read as one system.
 */
export function vendorConfirmationHtml(dealerName: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;">
      <div style="padding:20px 24px;border-bottom:2px solid #2A2A2A;">
        <p style="color:#2A2A2A;font-size:20px;font-weight:700;margin:0;">${escapeHtml(MALL_NAME)}</p>
      </div>
      <div style="padding:28px 24px;">
        <p style="color:#2A2A2A;font-size:16px;font-weight:600;margin:0 0 12px;">Hi ${escapeHtml(dealerName)},</p>
        <p style="color:#444;font-size:14px;line-height:1.6;margin:0 0 16px;">
          Thanks for applying for booth space at ${escapeHtml(MALL_NAME)}. We&#39;ve received your application and will review it shortly. If we have a space that suits your merchandise, we&#39;ll reach out to you directly.
        </p>
        <p style="color:#444;font-size:14px;line-height:1.6;margin:0;">You can reply directly to this email if you have any questions.</p>
      </div>${partnerPromoHtml('vendor')}
      <div style="padding:16px 24px;background:#F7F0E8;font-size:12px;color:#999;">
        ${escapeHtml(MALL_NAME)} &middot; ${escapeHtml(MALL_PHONE)}
      </div>
    </div>
  `
}

/** Conservative check before we hand an address to Resend. */
export const isValidEmail = (value: unknown): value is string =>
  typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
