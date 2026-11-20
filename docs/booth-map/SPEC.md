# MAM Live Booth Map: system, stack and UX spec

Version 3.2, 2026-11-13. Build brief for Claude Code. Corrected after an audit against the repo and current pricing pages (see section 0).
Business model: pricing to the mall is parked (see MASTER_PLAN.md). Vendors use it at no charge, and the mall's Meta budget drives traffic.

Status labels: **[verified]** = checked against a source this week. **[assumed]** = my judgment, test it. **[unknown]** = needs an answer.

---

## 0. What changed from version 3.1

| # | Area | Version 3.1 | Version 3.2 |
| --- | --- | --- | --- |
| 1 | Trackers on vendor and admin pages | "Don't load them" | Meta Pixel, GA4 **and Microsoft Clarity** load from `app/layout.tsx` on every route today. Split the root layout into route groups (`(site)` for existing pages, a bare group for `/v`, `/vendor`, `/admin`). This moves existing pages, so it needs approval before the build. |
| 2 | Brand tokens | Deep green, cream, sage | Those came from the temporary Holiday Open House banner (ends Nov 15). Section 8 now lists the real tokens from `tailwind.config.ts` and `app/globals.css`. The map is charcoal. |
| 3 | `/api/sold/[token]` | One-tap action from the email | GET shows a confirm page only. The answer is a POST from that page. Email link scanners open every GET link and would mark items sold. |
| 4 | Costs | $5 to $35 | Rebuilt line by line. See section 11. |
| 5 | `next/image` and Blob | Not mentioned | Add `*.public.blob.vercel-storage.com` to `images.remotePatterns` in `next.config.ts`. Existing file, needs approval. |
| 6 | Vendor access | Private link plus a 4-digit PIN on new devices | **Link only, no PIN** (owner's call, 2026-11-13). Bad-token rate limiting uses counters in Neon, because Upstash is not configured and the in-memory limiter does not hold across instances. |
| 7 | Categories | No collectibles | New list in section 6. Align it with the Sell page before the AI prompt is written. |
| 8 | Booth sale price | Formula rounded to cents while the text said dollars | Exact discounted price to the cent, rounded half up: what the register charges. Whole-dollar rounding (tried first) showed $2.99 at 10% off as "$3". Pending the register question. |
| 9 | Photo cleanup | Photos kept forever | Delete a photo from Blob 7 days after its item is sold, expired or removed. |
| 10 | Haiku settings | Not set | Effort `low`, structured output via `output_config.format`. Haiku 5.5 thinks at medium effort by default. |
| 11 | Sales report attachments | Fetched by API | Download URLs last 1 hour. Fetch right away or request a fresh URL. A Resend-managed receiving address works with no DNS change. |
| 12 | HEIC | [verified] | Behavior confirmed by WebKit bug 292350. The Feb 2026 fix targets drag and drop and names no iOS versions, so the real-phone test stays. |
| 13 | `/vendor` route | Missing from routes | Added to section 7. |
| 14 | Business model line | "Mall pays one monthly fee" | Pricing parked, matching the master plan. |
| 15 | Holds | Demo says "we will hold it" | "Call to check it's still here" until the owner decides. |
| 16 | Open and closed status | Hard-coded "Closes at 6:00 PM" | Reuse the site header's live open and closed logic. |
| 17 | How vendors get their link | Printed QR card | **Text message only, no cards** (decided 2026-11-20). Vendor-facing copy says "the link the mall texted you". A "text this vendor their link" admin action comes with build step 9. |
| 18 | Booth sale end | "Pick an end date (default 7 days)"; the preview offered 3, 7, 14 or 30 days | **Vendor picks the exact last day** on a calendar (decided 2026-11-20). Ends at midnight after that day, Eastern. See section 5b. |

Updated clickable preview with the correct brand: https://claude.ai/artifact/9DpWMkNdaACdUiZpg1ARmD

---

## 1. What changed from version 2

| Area | Version 2 | Version 3 | Why |
| --- | --- | --- | --- |
| How vendors post | Email photos to an address | A phone-first upload page with a title and price per photo | Each item needs a vendor-written title and price. Email can't collect that cleanly. |
| HEIC handling | Convert on the server | The browser does it | iOS Safari hands the page a JPEG when the file input asks for JPEG [verified]. A small fallback library covers the rest. |
| Image resizing | `sharp` on the server | Canvas in the browser, before upload | Uploads drop from several MB to a few hundred KB. No image code on the server. |
| Database | Supabase | Neon Postgres | Your call. Works well here: tiny database, pay for use, sleeps when idle. |
| Photo storage | Supabase Storage | Vercel Blob, uploaded straight from the browser | Direct browser-to-storage upload skips Vercel's 4.5 MB function limit [verified]. |
| AI on photos | Writes the title and description | Suggests a title the vendor can accept or retype, and checks the photo | The vendor is the source of truth for what it is and what it costs. |
| Vendor edits | Reply commands by email | "My items" screen | Mark sold, change price, remove. |
| Email intake | Photos and sales reports | Sales reports only | Still the agent that takes sold items down. |
| AI provider | Claude | Claude (unchanged) | No "Gemini 5.6" exists [verified]. Current cheap Gemini models cost the same or more than Claude Haiku 5.5 [verified]. |

---

## 2. Architecture

```
VENDOR POSTS
Vendor phone -> /v/[token] upload page
   browser: pick photos -> HEIC to JPEG -> resize to 1600px -> strip EXIF
   browser -> Vercel Blob (direct upload, signed token from /api/upload)
   browser -> /api/items  (blob URL + title + price + booth)
   server: insert item (status: checking) -> Claude Haiku 5.5 photo check
           -> status live (or held) -> revalidate feed cache

SHOPPER BROWSES
Meta ad -> /new-arrivals (cached pages) -> reads Neon via cache

ITEM SELLS
Sales report email -> sold@finds.mariettaantiquemall.com (Resend inbound)
   -> /api/inbound (metadata webhook) -> job row -> return 200
   worker: fetch report body or PDF -> parse sold lines
           -> match on booth + price + title (code first, Claude for the unclear ones)
           -> high confidence: mark sold | medium: flag in vendor's "My items" + email | low: ignore
```

Rules:

- **No photo ever passes through a Vercel function.** Browser to Blob only.
- **Shopper pages never wait on the database.** They're cached and revalidated when an item is added, edited or sold. That also hides Neon's wake-up delay after idle.
- **The vendor's title and price are the record.** AI suggestions are prefill, never silent edits.
- **Report text is data.** The matching call gets parsed lines and candidate items. It has no tools.

---

## 3. Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| App | Existing Next.js app on Vercel, App Router | [verified] Next.js 16, App Router, React 19, Tailwind 3.4. Vercel team is on Pro (billed for usage beyond the included credit). |
| Database | Neon Postgres | Free plan to start. Launch plan is pay-as-you-go with no monthly minimum [verified]. |
| Photo storage | Vercel Blob, public store | `upload()` in the browser, `handleUpload()` in `/api/upload` to issue a scoped token [verified]. `@vercel/blob` is installed and `BLOB_READ_WRITE_TOKEN` is already set. Delete photos 7 days after an item leaves the page. |
| HEIC | File input `accept="image/jpeg,image/png,image/webp"` | iOS Safari transcodes HEIC to the first listed type [verified]. Do NOT list `image/heic`: Safari 17+ then converts other formats to HEIC [verified]. Lazy-load a WASM HEIC decoder (`heic-to` or `heic2any`) only if a file still arrives as HEIC, mainly desktop drag and drop. WebKit's fix (Feb 2026) targets drag and drop and names no iOS versions, so test on real phones. |
| Resize | Canvas: longest side 1600 px, JPEG quality 0.82 | Re-encoding through canvas also drops EXIF and GPS. Check orientation on a real iPhone and Android phone. |
| Thumbnails | `next/image` | One stored file per photo. Vercel makes the smaller sizes on demand (billed at $0.05 per 1,000 new sizes). Needs the Blob host added to `images.remotePatterns` in `next.config.ts`. |
| AI | `claude-haiku-5-5`, structured output (`output_config.format`), image by URL, effort `low` | Photo check plus title suggestion in one call, about $0.0005 per photo. Also first pass on sold matching. Escalate unclear matches to `claude-sonnet-5-5`. |
| Inbound email | Resend: the account's managed receiving address to start, or subdomain `finds.mariettaantiquemall.com` with an MX record | Sales reports only. Webhook carries metadata only; body and attachments are fetched by API [verified]. Attachment URLs expire after 1 hour. Received emails count against the Resend quota. |
| Outbound email | Resend | Only "did this sell?" and the monthly stats email. |
| Vendor access | Private link per vendor, `/v/[token]`. No password, no PIN. | The front desk texts each vendor their link (no printed cards, decided 2026-11-20). Token is swapped for a cookie on first visit. Staff can reset a link. See section 9. |
| Admin access | One passcode in an env var plus a signed cookie | Upgrade later if several staff need their own logins. |
| Scheduled jobs | Vercel Cron | Retry sweeper, nightly expiry, sale end, photo cleanup, daily digest. Pro allows schedules down to once a minute. |
| Analytics | GA4, Meta Pixel + Conversions API, shopper pages only | Pixel, GA4 and Microsoft Clarity load from `app/layout.tsx` on every route today. Route groups are needed to keep them off vendor and admin pages (see section 0, item 1). |

---

## 4. Data model

```sql
vendors      (id, name, display_name, token_hash unique, status, consent_at, created_at)
vendor_devices(id, vendor_id, device_cookie_hash, first_seen_at, last_seen_at)
booth_sales  (id, vendor_id, booth_id, percent, starts_at, ends_at, ended_early_at)
activity_log (id, vendor_id, device_id, action, item_id, detail, created_at)
booths       (id, number unique, vendor_id, svg_id, zone)
items        (id, vendor_id, booth_id, status,       -- checking | live | held | sold | expired | removed
              title, price_cents, price_note,        -- price_note: 'ask in store' when no price
              category, tag_number,
              photo_url, photo_w, photo_h,
              ai_suggested_title, hold_reason,
              posted_at, sold_at, sold_source,       -- vendor | report | admin
              expires_at)
item_photos  (id, item_id, position, url, width, height)   -- extra angles
inbound_jobs (id, resend_email_id unique, status, attempts, error, received_at, finished_at)
sold_lines   (id, job_id, vendor_id, raw_text, price_cents, tag_number,
              matched_item_id, confidence, action)   -- auto | asked | ignored
events       (id, item_id, booth_id, type, utm_source, utm_campaign, created_at)
```

Indexes: `items(status, live_at desc)`, `items(booth_id, status)`, `items(vendor_id, status)`.

As built in Phase 1 (`lib/booth-map/schema.ts`, migration `drizzle/booth-map/0000_init.sql`). Changes from the list above, each tested:

- `vendors`: no `pin_hash`; adds `email`, `link_version` (a reset bumps it and signs out every phone), `is_test`, `stats_email_opt_out_at`, status `removed`. Vendors are offboarded, never deleted.
- `vendor_devices`: adds `link_version` and `revoked_at`.
- `booths.number` is text (`114A` allowed), uppercase letters, digits and dashes.
- `items`: `ask_in_store` boolean replaces `price_note`; adds `live_at` (the 30 days start at go-live), `removed_at`, `photo_deleted_at`, `ai_check_attempts`. Category is text with a CHECK. Sold history is kept if a sold item is later removed.
- New `uploads` table so abandoned uploads are cleaned up. New `auth_attempts` table for wrong-link counters (hashed keys).
- `booth_sales`: adds `closed_at` with one open sale per booth enforced by a unique index.
- `sold_lines`: adds `line_no` (unique per job), `booth_number`, `sold_on`, `method`, `reason`, `applied_at`, `reviewed_correct`, `asked_email_sent_at`. `inbound_jobs` adds `from_address`, `started_at`, `next_attempt_at`.
- `activity_log.detail` is jsonb with before and after values; adds `actor` and `booth_sale_id`. `events` adds `visitor_hash`.
- Foreign keys restrict deletes (except `events`, which sets null).
- Driver: Neon pooled (WebSocket) driver, so transactions work. Needs Node 22+ (the project is on 22.x) and Neon's pooled connection string.

---

## 5. Vendor upload page

Opens from the vendor's private link. Built for one thumb, standing in a booth.

**Screen 1: Home**

- "Hi [Vendor]. Booth 114."
- One big button: **Add new items**
- Below it: "My items (12 live)"

**Screen 2: Add items**

1. Tap the button. The phone offers Take Photo or Photo Library. Multi-select allowed, up to 10.
2. Each photo becomes a card as soon as it's picked, with a progress ring while it uploads.
3. Each card has:
   - **Title** (required). Prefilled in grey with the AI suggestion once it arrives. Tap to accept, or type over it.
   - **Price** (required), with a "No price, ask in store" toggle.
   - **Booth** picker, only if the vendor has more than one.
   - "Add another angle" link.
4. One button at the bottom: **Post 3 items**. Disabled until every card has a title and a price or the toggle.
5. Confirmation screen with the live link and a Share button.

**Screen 3: My items**

- List of live items, newest first: thumbnail, title, price, views.
- Each row: **Sold**, **Edit**, **Remove**.
- Items flagged by a sales report show a banner: "The sales report shows a $45 sale. Was it this?" Yes / No.
- Items near their 30-day expiry show **Keep 30 more days**.

Details that matter:

- Uploads start the moment a photo is picked, so by the time the vendor finishes typing, the upload is done.
- Inputs use 16 px text or larger, or iOS zooms the page on focus.
- Price field opens the number pad (`inputmode="decimal"`).
- The phone keyboard's microphone works for titles. Mention it in the vendor guide.
- If the connection drops, keep the cards and retry. Never lose typed text.
- Desktop gets the same page with a drag and drop zone.
- Vendor guide is the 90-second how-to video plus the same four steps in the text that delivers the link: tap your link, add photos, type what's on the tag and the price, post.

---

## 5b. Booth sale button

One button in My items discounts every live item in the vendor's booth. No per-item discounts.

- Flow: tap **Put my booth on sale** -> pick 10, 15, 20, 25, 30 or 50 percent -> pick the **exact last day** of the sale on a calendar (any day from today to 30 days out, suggested a week out) -> confirm on a preview with one real item's before and after price and "Sale runs through Sat, Nov 28".
- End date: the sale runs through the end of the picked day in mall time (America/New_York), so `ends_at` is midnight at the start of the next day, Eastern. Today is allowed (a one-day sale). The server checks the date again, because some phone date pickers ignore min and max. Never compute the day in server time (Vercel runs on UTC). Code: `lib/booth-map/sale-dates.ts`.
- Storage: `booth_sales (id, vendor_id, booth_id, percent, starts_at, ends_at, ended_early_at)`. Item prices are never rewritten. The sale price is computed at render as the exact discounted price to the cent, rounded half up: `floor((price_cents * (100 - percent) + 50) / 100)`. Code: `lib/booth-map/pricing.ts`.
- One active sale per booth. Starting a new one replaces the old one.
- Items posted during a sale are included automatically.
- Shopper side: struck-through old price plus sale price, "ask in store" items show "N% off", a banner on the booth page, a sale tag on the map (fourth booth state), an "On sale" filter chip in the feed.
- Cache: revalidate the feed, map and booth pages when a sale starts or ends. A cron job ends expired sales and revalidates.
- Sold matching: when a booth has an active sale, the matcher compares report prices against both the full price and the sale price.
- Every sale item shows: "Sale price confirmed at the register."
- [unknown] How the mall's register applies booth-wide discounts. Do not ship this until the owner answers.

---

## 6. AI contracts

**Photo check and title suggestion (Haiku 5.5).** Runs once per photo, right after upload. Input: image URL. Output:

```json
{
  "is_item": true,
  "quality": "good | blurry | dark | cluttered",
  "safe": true,
  "contains_person": false,
  "suggested_title": "max 60 chars, plain description, no maker or age claims",
  "category": "furniture | glass_china | pottery | jewelry | collectibles | art | lighting | textiles | books | home | other"
}
```

- The suggestion fills the title field only if the vendor hasn't typed yet.
- Category is set by AI and editable by admin. Vendors aren't asked for it. [decide] Align this list with the Sell page's categories before writing the prompt.
- Set effort to `low` and use structured output. A 1,600 px photo is about 2,500 input tokens.
- Hold the item if it isn't an item, isn't safe, or shows a person.

**Sold matching.** For each parsed sold line:

1. Code first: same vendor or booth, exact tag number match, or exact price match with one candidate. That's a match with no AI call.
2. If several candidates share the price, or the price differs slightly (discounts), send the line and that vendor's live items to Haiku 5.5. Output: `matched_item_id` or null, confidence, one-line reason.
3. Still unclear: Sonnet 5.5, or skip straight to asking the vendor.

Auto-mark sold on high confidence only. Medium puts the Yes / No banner in "My items" and sends one email. Low does nothing. First two weeks in shadow mode.

---

## 7. Routes

| Route | Purpose |
| --- | --- |
| `/new-arrivals`, `/new-arrivals/map`, `/new-arrivals/booth/[number]`, `/new-arrivals/item/[id]` | Shopper pages, cached |
| `/v/[token]` | Swaps the token for a cookie, then redirects to `/vendor` |
| `/vendor` | Vendor home, add items, my items, booth sale |
| `/api/upload` | Issues a Blob upload token. Checks the vendor token first. |
| `/api/items` | Create, edit, mark sold, remove. Vendor token required. |
| `/api/inbound` | Resend webhook for sales reports |
| `/api/sold/[token]` | Confirm page for the email's Yes / No. GET only shows the question. The answer is a POST from that page, because email link scanners open every GET link. |
| `/api/track` | Event beacon |
| `/admin` | Review queue, vendors, items, activity |

---

## 8. Shopper UX

Feed first, sticky tabs at the top, booth map with a bottom sheet on phones and a side panel on desktop, plus and minus zoom buttons, a list view alternative, no layout that depends on viewport height units, nothing essential pinned to the bottom, LCP under 2.5 s on 4G. `ui-demo.html` shows the intended look and flow.

Brand tokens, read from `tailwind.config.ts` and `app/globals.css`. Use the Tailwind names, not hex values. Deep green `#1F3A24`, cream `#FBF1E1` and sage `#E3E8D6` are NOT brand colors: they belong to the temporary Holiday Open House banner.

| Token | Tailwind name | Value | Used for |
| --- | --- | --- | --- |
| Heading font | `font-display` | Crete Round | Headings |
| Body font | `font-body` | Inter | Text |
| Nav font | `font-nav` | Montserrat | Navigation |
| Slate | `slate` / `secondary` | `#A5B8C8` (header at 80% opacity) | Header, footer |
| Golden tan | `mauve` / `accent` | `#EFC393`, dark `#D4A875`, light `#F5DDC0` | Button outlines and fills, card borders |
| Mint | `mint` / `primary` | `#C2DFC9`, light `#D5F4E6` | "Just in" badges, new-this-week booths |
| Champagne | `champagne` | `#F7F0E8` | Panels, sticky tab bar |
| Charcoal | `charcoal` / `bg-dark` | `#2A2A2A` | The map surface, booth tags |
| Page | (globals.css) | Gradient from `#FAF8F5` to `#E8E0D3` | Page background |
| Text | (globals.css) | `#2C2416` | Headings and text |
| Button radius | `rounded-lg` | 8 px | Buttons |
| Card radius | `rounded-xl` | 12 px | Cards |

Buttons follow `components/ui/Button.tsx`: golden tan outline with black text, filled golden tan on hover or when it's the main action.

Map booth states on the charcoal map: thin grey outline (nothing new), mint outline (new this week), golden tan fill with glow (new today), champagne ring (selected), plus a "%" tag when a booth sale is active. State must not rely on color alone: fill versus outline versus tag, and every booth's label says its state.

One change: the item view shows the vendor's own title and price. There's no AI-written description.

---

## 9. Security and privacy

- **Vendor link.** Token is 32 random bytes, stored hashed, revocable from admin. Never derive the URL from a booth number or name. Rate limit `/v/*` by IP and block after repeated bad tokens, with counters stored in Neon (Upstash is not configured, and the in-memory limiter in `lib/rate-limit.ts` does not hold across server instances).
- **Cookie swap.** First visit to `/v/[token]` sets an HttpOnly, Secure, SameSite=Lax cookie (1 year) and redirects to `/vendor`. The token never stays in the address bar.
- **No PIN (decided 2026-11-13).** The link is the only lock. Anyone holding a vendor's link can act as that vendor until staff reset the link. That is accepted, and covered by: the cookie swap, a one-tap link reset in admin, the activity log with undo, new-device use in the daily digest, and a line in the text message and on the vendor page saying the link works like a key and the front desk can send a new one.
- **No trackers on vendor routes.** Do not load Meta Pixel, GA4, Microsoft Clarity or any third-party script on `/v/*`, `/vendor/*` or `/admin/*`. They would send the URL to third parties, and Clarity records sessions. All three load from `app/layout.tsx` today.
- **Headers on vendor and admin routes.** `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store`. Keep these routes out of the sitemap and never link to them from public pages.
- **Nothing before auth.** No vendor name in the page title or Open Graph tags. The page shows nothing until the cookie check passes.
- **Activity log and alerts.** Log every post, edit, sold, remove and sale with the device. New-device use shows in the daily digest. Admin can undo.
- `/api/upload` only issues tokens for image types, max 5 MB, for a valid vendor.
- Verify the Resend webhook signature.
- Store sold item lines only, never a vendor's sales totals.
- Delete a photo from Blob 7 days after its item is sold, expired or removed.
- Hold any photo with a person in it.
- Vendor consent line before first post.

---

## 10. Build order

1. Neon schema, seed 2 test vendors with tokens.
2. Vendor upload page: pick, convert, resize, upload to Blob, title and price, post. Test on a real iPhone (HEIC on) and an Android phone.
3. Feed, item view, booth page in brand styling. This is the owner demo.
4. Photo check and title suggestion.
5. My items: sold, edit, remove, expiry.
6. Map with placeholder layout, then the traced floor plan.
7. Tracking events.
8. Sales report intake and matching, shadow mode.
9. Admin, monthly stats email.

---

## 11. Expected monthly cost at 100 vendors

Checked against pricing pages on 2026-11-13. Assumes 100 vendors and about 2,000 new photos a month (5,000 photos and 30,000 visits for a busy month).

| Item | Full mall | Busy month | Basis |
| --- | --- | --- | --- |
| Vercel Pro | $0 | $0 | [verified] The team is already on Pro |
| Vercel usage for this feature | $1 to $2 | $2 to $5 | Image resizing $0.05 per 1,000 new sizes, Blob storage $0.023 per GB, functions. The $20 monthly credit is already used by other sites. |
| Neon | $0 to $10 | $5 to $12 | Free: 100 compute hours, hard stop at the limit. Launch: $0.106 per compute hour, 4 to 12 awake hours a day at 0.25 CU |
| Claude API | $1 to $2 | $3 to $4 | Haiku 5.5 at $0.10 / $0.50 per million tokens, about $0.0005 per photo |
| Resend | $0 to $20 | $0 to $20 | Received emails count. Free allows 3,000 a month and 100 a day, shared with the site's form emails. Pro is $20. |
| Rate limiting | $0 | $0 | Counters in Neon. No Upstash. |
| **Total new spend** | **$2 to $34** | **$10 to $41** | Most likely about $5 to $15 |

One-time: none. Vendor links go out by text from the mall's phone (no printed cards, decided 2026-11-20).

---

## 12. Still unknown

- [ ] Which POS the mall uses, and one real sales report email (body text or PDF attachment?)
- [ ] Can the mall send one combined daily report?
- [ ] Do report lines include the tag description, a tag number, the price, or all three?
- [ ] Floor plan with booth numbers
- [ ] Vendor list with booth numbers
- [x] Confirm Next.js App Router and version (Next.js 16, App Router, Vercel Pro)
- [ ] Which Resend plan the account is on (decides the $0 or $20 line)
- [ ] Canvas orientation and HEIC behavior on a real iPhone and Android phone

---

## Sources

- WebKit bug 292350, Safari transcodes HEIC to first accepted type: https://bugs.webkit.org/show_bug.cgi?id=292350
- Apple developer forum, Safari 17+ converts to HEIC when image/heic is accepted: https://developer.apple.com/forums/thread/743049
- Vercel, uploading and storing files: https://vercel.com/kb/guide/how-to-upload-and-store-files-with-vercel
- Vercel Blob Next.js starter: https://vercel.com/kb/guide/vercel-blob-nextjs
- Neon pricing: https://neon.com/pricing
- Neon, no minimum charge: https://neon.com/faqs/managed-postgres-databases-free-tier
- Gemini API pricing roundups: https://benchlm.ai/google/api-pricing and https://www.morphllm.com/gemini-api-pricing
- Claude models overview: https://platform.claude.com/docs/en/models/overview
- Resend received email webhook: https://resend.com/docs/webhooks/emails/received
- Resend received attachments (1-hour download URLs): https://resend.com/docs/dashboard/receiving/attachments
- Resend pricing (received emails count toward quota): https://resend.com/pricing
- Vercel Blob pricing: https://vercel.com/docs/vercel-blob/usage-and-pricing
- Vercel cron limits by plan: https://vercel.com/docs/cron-jobs/usage-and-pricing
- Vercel usage rates: https://vercel.com/docs/limits/fair-use-guidelines
- Claude image token sizes: https://platform.claude.com/docs/en/build-with-claude/vision
