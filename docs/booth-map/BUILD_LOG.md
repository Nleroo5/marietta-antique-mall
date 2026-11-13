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
