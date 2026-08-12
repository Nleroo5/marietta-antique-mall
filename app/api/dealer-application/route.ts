import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import {
  MALL_NAME,
  isValidEmail,
  vendorConfirmationHtml,
} from '@/lib/transactional-emails'

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null
function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email service is not configured. Please call (770) 973-5600 to submit your application.',
        },
        { status: 503 }
      )
    }

    const formData = await request.formData()

    // Extract form fields
    const dealerName = formData.get('dealerName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const phoneType = formData.get('phoneType') as string
    const businessName = formData.get('businessName') as string
    const merchandiseType = formData.get('merchandiseType') as string
    const newToResale = formData.get('newToResale') as string
    const yearsInIndustry = formData.get('yearsInIndustry') as string
    const previousMalls = formData.get('previousMalls') as string
    const spaceNeeded = formData.get('spaceNeeded') as string
    const moveInMonth = formData.get('moveInMonth') as string
    const additionalComments = formData.get('additionalComments') as string

    // Format move-in month to readable text (e.g., "January 2026")
    const formatMoveInMonth = (dateString: string) => {
      if (!dateString) return dateString
      const [year, month] = dateString.split('-')
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December']
      return `${monthNames[parseInt(month) - 1]} ${year}`
    }
    const formattedMoveInMonth = formatMoveInMonth(moveInMonth)


    // Format email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              background-color: #f4f4f4;
              -webkit-font-smoothing: antialiased;
            }
            .email-wrapper {
              width: 100%;
              background-color: #f4f4f4;
              padding: 40px 0;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
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
              margin: 0 0 8px 0;
              letter-spacing: 1px;
            }
            .header-subtitle {
              font-size: 14px;
              color: #E8E8E8;
              margin: 0;
              font-weight: 300;
            }
            .content {
              padding: 40px 30px;
            }
            .application-title {
              font-size: 20px;
              font-weight: 600;
              color: #2A2A2A;
              margin: 0 0 24px 0;
              text-align: center;
              border-bottom: 3px solid #D4C4B0;
              padding-bottom: 12px;
            }
            .section {
              margin-bottom: 32px;
            }
            .section-header {
              background-color: #FAF8F5;
              border-left: 4px solid #D4C4B0;
              padding: 12px 16px;
              margin-bottom: 16px;
            }
            .section-title {
              font-size: 16px;
              font-weight: 700;
              color: #2A2A2A;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .field-group {
              margin-bottom: 16px;
            }
            .field-label {
              font-size: 13px;
              font-weight: 600;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
              display: block;
            }
            .field-value {
              font-size: 15px;
              color: #2A2A2A;
              line-height: 1.6;
              padding: 8px 0;
            }
            .field-value-box {
              background-color: #F9F9F9;
              border: 1px solid #E5E5E5;
              border-radius: 6px;
              padding: 14px 16px;
              margin-top: 6px;
            }
            .highlight-value {
              display: inline-block;
              background-color: #D4C4B0;
              color: #2A2A2A;
              padding: 4px 12px;
              border-radius: 4px;
              font-weight: 600;
              font-size: 14px;
            }
            .divider {
              height: 1px;
              background-color: #E5E5E5;
              margin: 24px 0;
            }
            .footer {
              background-color: #FAF8F5;
              padding: 24px 30px;
              border-top: 1px solid #E5E5E5;
            }
            .footer-text {
              font-size: 13px;
              color: #666;
              margin: 0 0 6px 0;
              text-align: center;
              line-height: 1.6;
            }
            .timestamp {
              font-weight: 600;
              color: #2A2A2A;
            }
            a {
              color: #D4C4B0;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <!-- Header -->
              <div class="header">
                <div class="logo">MARIETTA ANTIQUE MALL</div>
                <p class="header-subtitle">Georgia's Premier Antique Destination</p>
              </div>

              <!-- Content -->
              <div class="content">
                <h1 class="application-title">New Dealer Application</h1>

                <!-- Single Form Table -->
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td colspan="2" style="padding: 12px 16px; background-color: #FAF8F5; border-left: 4px solid #D4C4B0; font-size: 16px; font-weight: 700; color: #2A2A2A; text-transform: uppercase; letter-spacing: 0.5px;">
                      APPLICANT DETAILS
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 16px; width: 40%; font-size: 13px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E5E5;">
                      Dealer Name
                    </td>
                    <td style="padding: 12px 16px; font-size: 15px; color: #2A2A2A; border-bottom: 1px solid #E5E5E5;">
                      ${dealerName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E5E5;">
                      Email Address
                    </td>
                    <td style="padding: 12px 16px; font-size: 15px; color: #2A2A2A; border-bottom: 1px solid #E5E5E5;">
                      <a href="mailto:${email}" style="color: #2A2A2A; text-decoration: none;">${email}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E5E5;">
                      Phone Number
                    </td>
                    <td style="padding: 12px 16px; font-size: 15px; color: #2A2A2A; border-bottom: 1px solid #E5E5E5;">
                      ${phone} (${phoneType})
                    </td>
                  </tr>
                  ${businessName ? `
                  <tr>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E5E5;">
                      Business Name
                    </td>
                    <td style="padding: 12px 16px; font-size: 15px; color: #2A2A2A; border-bottom: 1px solid #E5E5E5;">
                      ${businessName}
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E5E5; vertical-align: top; padding-top: 16px;">
                      Type of Merchandise
                    </td>
                    <td style="padding: 12px 16px; font-size: 15px; color: #2A2A2A; border-bottom: 1px solid #E5E5E5;">
                      <div style="background-color: #F9F9F9; border: 1px solid #E5E5E5; border-radius: 6px; padding: 14px 16px; margin-top: 6px;">
                        ${merchandiseType.replace(/\n/g, '<br>')}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E5E5;">
                      New to Resale Business
                    </td>
                    <td style="padding: 12px 16px; font-size: 15px; color: #2A2A2A; border-bottom: 1px solid #E5E5E5;">
                      ${newToResale}
                    </td>
                  </tr>
                  ${yearsInIndustry ? `
                  <tr>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E5E5;">
                      Years in Industry
                    </td>
                    <td style="padding: 12px 16px; font-size: 15px; color: #2A2A2A; border-bottom: 1px solid #E5E5E5;">
                      ${yearsInIndustry} years
                    </td>
                  </tr>
                  ` : ''}
                  ${previousMalls ? `
                  <tr>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E5E5; vertical-align: top; padding-top: 16px;">
                      Previous Mall Experience
                    </td>
                    <td style="padding: 12px 16px; font-size: 15px; color: #2A2A2A; border-bottom: 1px solid #E5E5E5;">
                      <div style="background-color: #F9F9F9; border: 1px solid #E5E5E5; border-radius: 6px; padding: 14px 16px; margin-top: 6px;">
                        ${previousMalls.replace(/\n/g, '<br>')}
                      </div>
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E5E5;">
                      Space Size/Type Needed
                    </td>
                    <td style="padding: 12px 16px; font-size: 15px; color: #2A2A2A; border-bottom: 1px solid #E5E5E5;">
                      ${spaceNeeded}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E5E5;">
                      Requested Move-In Month
                    </td>
                    <td style="padding: 12px 16px; font-size: 15px; color: #2A2A2A; border-bottom: 1px solid #E5E5E5;">
                      ${formattedMoveInMonth}
                    </td>
                  </tr>
                  ${additionalComments ? `
                  <tr>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding-top: 16px;">
                      Additional Comments
                    </td>
                    <td style="padding: 12px 16px; font-size: 15px; color: #2A2A2A;">
                      <div style="background-color: #F9F9F9; border: 1px solid #E5E5E5; border-radius: 6px; padding: 14px 16px; margin-top: 6px;">
                        ${additionalComments.replace(/\n/g, '<br>')}
                      </div>
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <!-- Footer -->
              <div class="footer">
                <p class="footer-text">
                  <span class="timestamp">Submitted on ${new Date().toLocaleString('en-US', {
                    timeZone: 'America/New_York',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })} EST</span>
                </p>
                <p class="footer-text">
                  Via <a href="https://www.mariettaantiquemall.com/vendors">www.mariettaantiquemall.com/vendors</a>
                </p>
              </div>
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

    const FROM = 'Marietta Antique Mall <applications@mariettaantiquemall.com>'

    // The applicant confirmation only goes out if we actually have an address to
    // send it to — the form is client-validated, but this route never was.
    const sends: Promise<unknown>[] = [
      resendClient.emails.send({
        from: FROM,
        to: 'contactus@mariettaantiquemall.com',
        replyTo: email,
        subject: `Dealer Application - ${dealerName}`,
        html: emailHtml,
      }),
    ]

    const sendsConfirmation = isValidEmail(email)
    if (sendsConfirmation) {
      sends.push(
        resendClient.emails.send({
          from: FROM,
          to: email.trim(),
          subject: `We received your application — ${MALL_NAME}`,
          html: vendorConfirmationHtml(dealerName),
        })
      )
    }

    const [staffResult, confirmationResult] = await Promise.allSettled(sends)

    // Only the staff notification is critical — it carries the application.
    if (staffResult.status === 'rejected') {
      throw new Error(
        staffResult.reason instanceof Error ? staffResult.reason.message : 'Application email failed'
      )
    }
    const staffResponse = staffResult.value as { data?: { id?: string }; error?: { message: string } }
    if (staffResponse.error) {
      throw new Error(staffResponse.error.message)
    }
    const data = staffResponse.data

    if (sendsConfirmation && confirmationResult) {
      const failed =
        confirmationResult.status === 'rejected' ||
        (confirmationResult.value as { error?: unknown }).error
      if (failed) {
        console.error('dealer-application: confirmation to applicant failed', confirmationResult)
      }
    } else if (!sendsConfirmation) {
      console.warn('dealer-application: no valid applicant email, confirmation skipped')
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Application submitted successfully',
        emailId: data?.id
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending dealer application:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to submit application. Please try again or call (770) 973-5600.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
