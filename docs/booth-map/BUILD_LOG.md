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
