# Booth map handoff (version 3.2)

Corrected on 2026-11-13 after an audit against the repo and current pricing. What changed is in `SPEC.md` section 0. The clickable preview with the correct brand colors replaces `ui-demo.html` as the look-and-flow reference: https://claude.ai/artifact/9DpWMkNdaACdUiZpg1ARmD

Everything Claude Code needs to build the MAM Live Booth Map inside this repo.

## Files

| File | What it is | How to use it |
| --- | --- | --- |
| `MASTER_PLAN.md` | The why and the what: decisions, workflow, audit findings, costs, rollout, open questions | Read first for context |
| `SPEC.md` | The how: architecture, stack, data model, routes, screens, AI contracts, security, build order | The build brief. Follow it. |
| `ui-demo.html` | A clickable single-file mockup of the vendor page and the shopper page | Reference for look, layout and flow. Open it in a browser. Do not copy its code. |
| `KICKOFF_PROMPT.md` | The first message to paste into Claude Code | Paste it to start |

## When the files disagree

1. `SPEC.md` wins on anything technical.
2. `MASTER_PLAN.md` wins on scope and priorities.
3. `ui-demo.html` is the oldest of the three and uses the wrong colors (deep green and cream from a temporary promo). Use the preview linked above instead.

## What is not settled

Items marked `[unknown]` or `[assumed]` in the spec are not facts. The sales report format is the big one. Do not build report parsing until a real sample is in `docs/booth-map/samples/`.

## Secrets

Nothing in this folder contains keys. The build needs these environment variables, set in Vercel and in `.env.local`, never committed:

- `DATABASE_URL` (Neon)
- `BLOB_READ_WRITE_TOKEN` (Vercel Blob)
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`
- `ADMIN_PASSCODE`, `SESSION_SECRET`

Already set in Vercel: `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`. Not needed: Upstash (rate limit counters live in Neon).
- `META_PIXEL_ID`, `META_CAPI_TOKEN` (if not already present)
