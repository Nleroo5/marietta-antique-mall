# Booth map build log

Branch `booth-map`. Nothing is merged to `main` or pushed without the owner's OK.

## Phase 0: baseline (2026-11-13)

- `tsc --noEmit` clean, `next build` passes with 17 routes. Every later phase must leave that route table unchanged except for new booth-map routes.

## Phase 1: database layer (SPEC build step 1)

Built: `lib/booth-map/{schema,pricing,tokens,db,seed}.ts`, `drizzle/booth-map/0000_init.sql`, `scripts/booth-map/seed.ts`, tests in `tests/booth-map/` (72, run on PGlite, a real in-process Postgres).

Audit, round 1 (independent reviewer, given the spec and code only): 5 must-fix, 9 should-fix. Main ones: sale-price rounding showed cheap items above their original price; decimal-comma prices parsed 100x too big; parser and database disagreed on the maximum price; test vendors would take real booth numbers; deleting a vendor wiped their history; HTTP driver had no transactions while tests did; link reset could leave a device signed in; one-open-sale-per-booth not enforced. All fixed.

Audit, round 2: all round-1 items confirmed fixed. New: an item that never went live couldn't be removed (must-fix); test-vendor teardown missed two kinds of log rows; booth numbers could differ only by case; a live item could keep sold dates; feed index on the wrong timestamp. All fixed, each with a test.

Checks after fixes: 72 tests pass; the old whole-dollar rounding put back on purpose fails 8 tests; schema and migration match (`drizzle-kit generate` reports no changes); `tsc` clean; `next build` passes with the route table identical to the baseline. Vercel project runs Node 22.x.

Notes carried into later phases:
- Every "start a booth sale" path closes any open sale for that booth in the same transaction (an expired sale stays open until the sale-end job closes it).
- Public queries must filter out `vendors.is_test`.
- `next build` type-checks `tests/`; excluding them needs a `tsconfig.json` edit (owner's call).

## Phase 2: vendor upload page (SPEC build step 2)

Built: public pages moved into `app/(site)` (URLs unchanged) so the Meta Pixel, GA4 and Clarity load only there; vendor routes in `app/(booth)` (`/v/[token]` link sign-in, `/vendor`); APIs under `/api/booth-map/` (upload token, upload record, post items, session check); `proxy.ts` adds noindex, no-referrer and no-store headers; browser-side photo prep (resize to 1600 px, JPEG, EXIF removed, HEIC fallback); the vendor page itself. Neon database created (Free plan, iad1), migrated, two test vendors seeded on booths 9001-9003.

Checks before the audit: public pages compared with `main` page by page (titles, head tags, structured data, visible text identical; one Pixel snippet per page); browser check that Pixel, GA4 and Clarity load on public pages and nothing third-party loads on vendor pages; end-to-end post against the real database and Blob store. My own checks found that an unknown `/vendor/...` address was served the prebuilt public 404 with the Pixel inside; fixed with catch-all routes.

Audit (independent reviewer, spec and code only): no must-fix; 8 should-fix, all fixed and tested:
1. Photo URLs and the image optimizer accepted any Vercel Blob store. Now pinned to this site's own store (host derived from the token), and the URL Blob reports back must equal the posted one.
2. One upload token could create many files. Now no random suffix and no overwrite, so one token makes one file; tokens last 2 minutes.
3. A successful post cleared cards added while it was posting. The form now locks while posting and only the posted cards are cleared.
4. Typed text on cards still uploading was lost on reload. All cards' text is saved; a card whose photo didn't finish comes back asking for the photo again.
5. A wrong-link block on the shared mall wifi blocked valid cards too. Valid cards now always work; only wrong links are blocked.
6. The tracker path guard was dead code. Kept as a client-side extra; the real control is structural and now has a test.
7. Vendor routes had no error screen. Added one with no trackers.
8. An expired link looked like a network error. The page now checks and says "Scan your card again"; a missing consent box reappears when the server asks for it.

Notes also fixed: unique index on `items.photo_url` (migration 0001, applied); HEAD requests don't sign in a device; repeat scans refresh the cookie; new devices limited to 30 an hour per IP; internal errors no longer reach the browser; Origin check uses the Host header; preview images released from memory; Retry can't be queued twice; native image decode tried before the HEIC decoder; transparent PNGs get a white background; vendors with no booth see a clear message; route-level tests added.

Checks after fixes: 132 tests pass; reintroducing the store and suffix holes fails 3 tests; `tsc` clean; build passes.

Known and accepted: the vendor token appears in Vercel request logs and in browser history for the redirect; link-preview fetches (iMessage, Slack) can sign in a device row (no cookie reaches a person).

## Phase 3: New Arrivals shopper pages (SPEC build step 3)

Built: `/new-arrivals` (feed with category chips, Get directions and Call), `/new-arrivals/item/[id]`, `/new-arrivals/booth/[number]`, all cached (5-minute refresh, expired the moment a vendor posts). Owner decisions: test vendors' items show on preview deployments only; the pages stay hidden until launch (noindex, not in the menu or sitemap; tests enforce both).

My own checks found: the feed is built during deploys, so a Neon outage could have blocked deploying the whole site; it now falls back to an empty feed for that build. My first version of that fallback stored the empty feed in Next's data cache, so the next build reused it; moved outside the cache and proven with a build against an unreachable database followed by a normal one. Also capped the item photo's height on phones so title and price show without scrolling.

Audit (independent reviewer): no must-fix; 6 should-fix, all handled:
1. The test-vendor setting wasn't part of the cache key, so a shared cache could serve a preview's feed (with test items) on the live site. Now part of every key, with a test.
2. Expiring the cache on post makes the next visitor wait for a fresh page. Kept on purpose so a vendor who taps "See it on New Arrivals" sees their item; the trade-off is written in `lib/booth-map/feed-cache.ts`.
3. Shared links to these pages previewed as the homepage. They now have their own Open Graph and Twitter tags (item pages use the item photo).
4. Made-up booth numbers got real-looking pages. Unknown booths, and booths of paused, removed or (on the live site) test vendors, now 404.
5. The feed, where ads land, had no Get directions or Call. Added to the feed header, which is also shorter on phones so photos start on the first screen.
6. Tests added for all of the above, the post-time cache expiry, and hidden-ness across every component.

Notes also fixed: card images no longer repeat the title to screen readers; long titles wrap; image sizes match the real card width; "Yesterday" uses calendar days in Eastern time; sold items' descriptions don't quote a price; the vendor's done screen links to the item itself when one was posted.

Accepted for now: the feed shows the newest 200 items; photo addresses contain the vendor's internal id (not a credential).

## Fonts: stored in the site (owner approved)

Builds failed intermittently, locally and once on Vercel, with a Turbopack error while downloading Google Fonts ("next/font/google queries have exactly one entry"). The three fonts now live in `app/fonts` (Fontsource 5.3.0, OFL licence files included) and load through `next/font/local`. Text measures identically to the Google-downloaded fonts for all 11 font and weight combinations used; no Google Fonts requests. Four builds in a row passed, plus one with internet access blocked.

## Booth sales with an exact end date (SPEC 5b, ahead of build order)

Nicolas asked for vendors to pick the exact day their sale ends, working on the site itself, not live yet.

Built:
- `lib/booth-map/sale-dates.ts`: the vendor picks the last day; the sale runs through the end of that day in mall time (America/New_York), so `ends_at` is midnight after it, Eastern. Today to 30 days out. Worked out in Eastern time because the server runs on UTC (a naive version would have ended Eastern sales at 7 or 8 pm the night before). Tested across both daylight-saving switches, the UTC date boundary, and the `booth_sales_window` database check.
- `lib/booth-map/sales.ts` and `POST /api/booth-map/sale`: start, replace (one open sale per booth) and end a sale, each in one transaction with an activity log row. Two taps at once get a 409 from the unique index instead of a 500.
- Vendor page: "Put my booth on sale" row, then discount chips, a "Last day of the sale" date field (also checked on the server, because some phone date pickers ignore min and max), a before-and-after preview with one of the vendor's real items, Change the sale, and a two-tap End sale now.
- Shopper pages: struck-through price and exact sale price, "Ask in store · N% off", a % OFF tag on cards, an On sale filter, and sale banners on booth and item pages ("Sale price confirmed at the register"). Tag-price wording changes while a sale shows.

**Not live:** booth sales are off on the live site (`VERCEL_ENV=production`) until `BOOTH_SALES_ENABLED=true` is set, because the owner still has to say how the register applies a booth discount. On for previews and local builds. Nothing is merged to main.

Known and accepted: a sale drops off shopper pages at the next cache refresh after midnight (within 5 minutes); there is no job yet that marks ended sales closed (they simply stop counting at `ends_at`); "My items" (build step 5) is still not built, so the sale row sits on the vendor home screen.

Checks: 172 tests pass, `tsc` clean, build passes, and an end-to-end run on the local build as the demo vendor (start a 30% sale through Sat, Nov 28; a past day is refused; feed, filter, booth and item pages show it; ending it removes it).

Audit (independent reviewer): 1 must-fix, 2 should-fix, all handled:
1. Starting a sale just after midnight in October and picking the furthest day put `ends_at` 31 days and 59 minutes after `starts_at` (the November clock change adds an hour), which the database window check rejected with a 500. The check now allows 30 days plus 2 of slack (migration `0002_booth_sales_window_slack`, applied to Neon), with a test for that exact case.
2. The shopper join matched on booth only, so if a booth changed hands one vendor's sale could discount another vendor's items. It now also matches the item's vendor, with a test.
3. The booth page still said "the price on the tag in store is final" under its sale banner. Fixed.
Nits fixed: switching booths on the sale screen resets the discount and day; replacing a sale that had already ended is logged as a new sale, not a replacement. Accepted: if the vendor page stays open past midnight, its date range is a day old until reload (the server still checks the real date).

## Booth sales: any discount (2026-11-20)

Nicolas asked for vendors to enter any discount instead of six fixed percents. Vendors now type any whole number from 1% to 90% (10, 15, 20, 25, 30 and 50 stay as one-tap shortcuts). Whole numbers keep sale prices exact to the cent; the 90% cap stops a typo like 100 from listing a booth for free. The database CHECK matches (migration `0003_booth_sales_any_percent`, applied to Neon); the sale price math is tested at every percent from 1 to 90. At 1% off, items under 51 cents round back to their own price (half-up rounding); from $1 up the sale price is always lower. Still off on the live site until `BOOTH_SALES_ENABLED=true`.

Checks: 191 tests pass, `tsc` clean, build passes; end to end on the local build: 95% refused with a message, 35% shows $145 crossed out to $94.25 and reaches the feed, booth and item pages.

## Store map, phase 1 (SPEC build step 6, 2026-11-24)

The mall's printed floor plan (dated March 2023) arrived; Nicolas approved the plan and my recommendations ("go, use your recommendations"). Plan and analysis: https://claude.ai/artifact/NfzuG7w87YENNHuj2FmZ6e

Built:
- `lib/booth-map/floor-plan.ts`: all 239 spaces traced from the plan (162 booths, 49 end caps, 28 cases), one line each, plus streets, rooms and the entrance. The number is the address: the hundreds digit names the street, even numbers on the left walking in, the last two digits count from the front (`docs/booth-map/floor-plan/README.md`).
- `lib/booth-map/directions.ts`: walking directions from the main entrance to every space ("Walk straight in. Marietta Street is right in front of you. Booth 705 is on your right, about halfway up."), booth search ("705", "booth 705", "2000a", "k 3", "1004" finds 1004-1006) and street search.
- `/new-arrivals/map`: the charcoal map with the entrance at the bottom, drag, pinch, trackpad pinch and + and - zoom, search, a list by street, a panel with directions, and `?booth=705` links. Every space is drawn; only booths with a vendor shoppers can see are lit and tappable (`getMapBooths`, the same rule as booth pages, so a lit booth never opens a 404). Any space can be searched.
- Booth and item pages: "Booth 705 · Marietta Street", the directions and a Show it on the store map link. The feed links to the map.
- `scripts/booth-map/space-sheet.ts` writes `docs/booth-map/floor-plan/space-sheet.csv` for the front desk: every space, street by street, with directions and an empty Vendor column.

Decisions (Nicolas, 2026-11-24): the plan's red dots are left off the map. Vendor names are not shown or searchable on shopper pages (they never have been; it would need the owners' OK). No database changes: the floor plan file holds the drawing; the booths table only says which vendor has which number.

Test data: the Demo Vendor's made-up booths (114, 127, 136, 142, 151, 158) were renumbered to real spaces on the plan (705, 402, 1012, 2014, 506, 811) with Nicolas's OK, so previews show lit booths. Test vendors never show on the live site.

Checks: 234 tests pass (43 new: numbering rules for every space, no overlaps, directions for every space, search, the lit-booth query on PGlite, the booth-page block), `tsc` clean, build passes (`/new-arrivals/map` static, refreshed every 5 minutes like the feed). Checked in Chrome on the local build at desktop width and in a 390 px frame (no sideways scroll): search, tap a lit booth, its booth page and back, drag, zoom, list by street, street search, the not-found message.

Audit (independent reviewer): nothing must-fix; 6 should-fix, all handled:
1. The booth address used `replaceState(window.history.state, ...)`, which Next.js treats as its own entry and later restores the old URL. Now `replaceState(null, ...)`.
2. Screen readers activate with a synthetic click, which the lit booths ignored. They now take a click with `detail 0` (mouse and touch stay on the pointer handlers, so no double selection).
3. A phone held sideways could be shorter than the map, and the map swallowed every swipe. Zoomed out it now lets a one-finger swipe scroll the page (`touch-pan-y`); zoomed in it takes swipes for dragging. The box is capped at 600 px and stays square below tablet width.
4. Dragging re-rendered the hidden street list. The list renders only when shown, and each street's spaces are worked out once.
5. On phones the directions sat below the map, out of sight. A pick now scrolls just enough to show them (not on page load).
6. 920 and 921 sit past the men's restroom; their directions now say "past the far end of the aisle, between the restrooms" instead of a side.
Nits fixed: wording for Powder Springs distances and the spaces under the cashier, ctrl+wheel cancels a running zoom, Safari trackpad pinch (gesture events, Mac only), the search message's live region stays rendered, the panel's live region is stable, tabbing to an off-screen booth pans to it, the map page keeps the share image.

Known and accepted: if a vendor is paused or a booth reassigned, the map can show it lit for up to 5 minutes (nothing changes vendor status yet; when admin can, it must expire `FEED_TAG`, build step 9). Directions to the 2000s go up Cherokee Street to Powder Springs Street, which the walk-through must confirm.

**Not live:** on the booth-map branch only, nothing merged to main. Waiting on the front desk: the space sheet (who rents what) and a 30-minute walk-through to confirm the plan.
