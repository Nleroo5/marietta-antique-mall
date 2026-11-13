# MAM Live Booth Map: master plan

As of 2026-11-13, revised after the audit (see SPEC.md section 0). Covers workflow, tech stack and running costs. Pricing to the mall is parked and not part of this document.

A live "new arrivals" page on mariettaantiquemall.com. Vendors post photos of new items from their phones, shoppers arriving from Meta ads see what just came in and which booth it's in, and items come down when they sell.

---

## 1. Decisions

| Decision | Current answer | Status |
| --- | --- | --- |
| Who the customer is | The mall. Vendors use it at no charge. | Locked |
| Trial period | 45 days, every vendor included | Locked |
| Who funds ads | The mall's own Meta budget | Locked |
| How vendors post | Private upload page, title and price per photo | Locked |
| How items come down | Agent reads the mall's sales report emails, plus a vendor Sold button, plus 30-day expiry | Locked |
| Database | Neon | Locked |
| Look | Same branding as the live site (slate, golden tan, mint, champagne), charcoal map as the one dark surface | Locked |
| Booth sale button | One button discounts every item in a vendor's booth | Locked, but do not ship until the register question is answered |
| Photo storage | Vercel Blob, uploaded straight from the browser | Proposed |
| AI | Claude Haiku 5.5 for photo checks and matching | Proposed |
| Vendor access | Private link only, no PIN | Locked |
| Mall's monthly ad budget for this | | Open |
| Sales report format and POS | | Open |
| Start date | | Open |

---

## 2. Workflow

**Posting, runs when a vendor taps Post**

1. Vendor opens their private page on a phone and taps Add new items.
2. They take or pick up to 10 photos. The browser converts HEIC to JPEG, resizes to 1600 px and uploads straight to storage.
3. They type a title and a price on each photo. AI suggests a title they can accept with one tap.
4. They tap Post. A quick AI check confirms each photo is a usable picture of an item.
5. The items appear on the shopper page, tagged to the booth. The booth lights up on the map.

**Shopping**

1. A shopper taps a Meta ad and lands on the feed of new finds.
2. They filter by category, or open the booth map and tap a glowing booth.
3. On an item, they tap Get directions or Call.

**Removal, three signals**

1. Sales report: the mall's daily report is emailed to an intake address. Code parses the sold lines and matches them to live items by booth, price and title. A clean single match marks the item sold. Anything unclear asks the vendor.
2. Vendor: a Sold button on every item in My items.
3. Expiry: items come down after 30 days unless the vendor keeps them.

Sold items show a SOLD stamp for 48 hours, then drop off. Their photos are deleted from storage 7 days after the item leaves the page.

**Booth sale**

A vendor taps Put my booth on sale, picks a percentage and an end date, and every live item in the booth shows the sale price until it ends.

---

## 3. Audit findings

Rating: 7 out of 10. Ready to demo. Not ready to build past the demo until the mall's inputs arrive.

| # | Finding | Fix |
| --- | --- | --- |
| 1 | The owner hasn't seen or agreed to any of this | Show the demo. Get the go-ahead and the inputs in section 8 first. |
| 2 | Nobody has seen a real sales report | Get one real report before writing matching code. Until then, removal is the Sold button plus expiry. |
| 3 | Posting takes more effort than emailing a photo | AI title suggestion, staff can post for any booth, seed the feed before ads run |
| 4 | Day 45 lands around New Year's | Review at day 35. Compare with the same weeks last year and with booths that didn't post. |
| 5 | No baseline is being captured | Record last year's sales for the same weeks and current ad numbers before launch |
| 6 | "Call to hold" has no process behind it | Ask the owner. If no holds, the button becomes "Call to check it's still here". |
| 7 | The private link is the only lock on a vendor's page (no PIN, decided) | Cookie swap, no trackers on vendor routes, one-tap link reset, activity log with undo, new devices in the daily digest, "treat this like a key" on the card |
| 8 | Sold matching will hit discounts and same-price items | Auto-remove only on a clean single match. Booth sales tell the matcher the expected price. Shadow mode first. |
| 9 | Phone photo handling is untested | Test on a real iPhone and Android phone at build step 2 |
| 10 | The existing site's setup is assumed | Confirm Next.js App Router and the Vercel plan before starting |
| 11 | One operator | Daily digest, alert on any failed job, status line in admin |
| 12 | Posted price and booth tag can disagree | Edit button, and "Price on the tag in store is final" on every item |
| 13 | Booth sale price must match the register | Ask the owner how the register learns of a booth-wide sale before shipping the button |
| 14 | Trackers load on every route from the site layout, including Microsoft Clarity | Split the layout into route groups before building vendor pages. Needs approval: it moves existing pages. |
| 15 | Spec's brand colors came from the temporary Holiday Open House banner | Use the Tailwind theme: slate, golden tan, mint, champagne, charcoal |
| 16 | One-tap email answers would be triggered by email link scanners | Confirm page plus POST |
| 17 | Cost estimate was off line by line | Rebuilt in section 6 |
| 18 | Photos never deleted | Delete 7 days after an item leaves the page |
| 19 | Category list has no collectibles | Align with the Sell page before writing the AI prompt |

---

## 4. The product

| Page | Who uses it | What they do |
| --- | --- | --- |
| Vendor page | 100-plus vendors | Add photos with title and price, post, see views, mark sold, edit, remove, run a booth sale |
| Shopper page, `/new-arrivals` | People who tapped a Meta ad | Scroll new finds, filter, tap a booth on the map, get directions or call |
| Admin page, `/admin` | The agency and mall staff | Approve held photos, post for a vendor, mark sold, add vendors, reset a link, see failed jobs |

Design rules:

- Vendor page: one big button on the home screen. Uploads start when a photo is picked. Post stays disabled until every photo has a title and a price or "ask in store".
- Shopper page: photos first, map second. Tabs stick to the top. Nothing essential pinned to the bottom edge. No layout that depends on screen-height units.
- Map: booth states shown by fill and outline. Tap opens that booth's items. Plus and minus buttons as well as pinch. A plain list view as an alternative.
- Every item: vendor's own title and price, booth number, time posted, "Price on the tag in store is final".
- Branding matches the live site. Tokens are listed in SPEC.md section 8.

---

## 5. Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| App | New routes in the existing Next.js site on Vercel | Same domain, same pixel, same GA4 |
| Database | Neon Postgres | Tiny database, pay for use, sleeps when idle |
| Photos | Vercel Blob, direct upload from the browser | Skips Vercel's 4.5 MB function limit |
| HEIC and resizing | In the vendor's browser before upload | iPhone Safari hands over a JPEG when asked. Photos shrink to a few hundred KB. |
| AI | Claude Haiku 5.5, structured output | Photo check and title suggestion in one call. Second pass on unclear sold matches. |
| Sales report intake | Resend inbound on `finds.mariettaantiquemall.com` | Small webhook, body or PDF fetched by API |
| Outbound email | Resend | "Did this sell?" and monthly stats |
| Jobs | Vercel Cron | Retries, expiry, sale end, daily digest |
| Tracking | GA4, Meta Pixel, Conversions API on shopper pages only | Directions and call taps are the events ads optimize toward. Pixel, GA4 and Clarity load sitewide today, so vendor and admin routes need their own layout. |

Four rules:

1. No photo passes through a server function. Browser to storage only.
2. Shopper pages are served from cache and refreshed when an item changes.
3. The vendor's title and price are the record. AI suggestions are prefill only.
4. Sales report text is data. The matching call has no tools.

---

## 6. Overall costs

About $2 to $34 a month in new spend at 100 vendors, most likely $5 to $15. Rebuilt from pricing pages checked on Nov 13, 2026.

| Item | Monthly cost | What drives it |
| --- | --- | --- |
| Vercel Pro | $0 | Already on Pro (the team is billed for usage beyond the included credit) |
| Vercel usage | $1 to $2 | Image resizing for the feed, photo storage, functions. The $20 credit is already used by other sites. |
| Neon | $0 to $10 | Free plan has a hard stop at 100 compute hours. Launch is $0.106 per compute hour with no minimum. |
| Claude API | $1 to $2 | About $0.0005 per photo on Haiku 5.5, plus pennies for unclear sold lines |
| Resend | $0 to $20 | Received emails count. Free allows 100 a day, shared with the site's forms. The monthly stats email to 100+ vendors fills a day by itself. |
| Total new spend | $2 to $34 | |

| Stage | Monthly estimate |
| --- | --- |
| Demo and seeding, 10 vendors | $0 to $1 |
| Full mall, 100 vendors, about 2,000 photos | $2 to $34 |
| Busy mall, 5,000 photos and 30,000 visits | $10 to $41 |

One-time cash cost is close to nothing: a print run of vendor QR cards.

---

## 7. Rollout

1. Owner meeting. Gate: go-ahead, vendor list, floor plan, one real sales report.
2. Week 1, build the core. Gate: an item posted from a phone shows on the page in under 30 seconds.
3. Week 2, seed and soft launch with 10 vendors. Gate: 60 or more live items across 15 or more booths before any ad runs.
4. Day 1, launch to all vendors. Ads on. The 45 days start.
5. Days 1 to 14, sold matching in shadow mode. Gate: no wrong matches before auto-removal goes on.
6. Day 14, first vendor stats.
7. Day 35, results review with the owner.
8. Day 45, trial ends.

Success measures: 40 or more vendors posting, a target number of direction and call taps (set once the ad budget is known), and posted items selling faster than each booth's usual pace.

---

## 8. Open questions

For the owner:

- [ ] Will you try this for 45 days with every vendor included?
- [ ] Which POS sends the sales reports? One real report email, please.
- [ ] Can reports go to one extra address, or as one combined report a day?
- [ ] How much of the monthly Meta budget can point at this page?
- [ ] Do you hold items for callers? For how long, and who takes the call?
- [ ] When a vendor runs a booth-wide sale, how does the register know?
- [ ] Floor plan with booth numbers, and the vendor list with booth numbers
- [ ] Will staff post for vendors who can't or won't?

For the build:

- [x] Confirm Next.js App Router, its version, and the Vercel plan (Next.js 16, App Router, Pro)
- [ ] Check which Resend plan the account is on
- [ ] Test HEIC upload and photo rotation on a real iPhone and Android phone
- [x] Resend inbound: no size cap published; attachments are fetched by URL that lasts 1 hour
