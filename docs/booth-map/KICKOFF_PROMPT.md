# Kickoff prompt

Paste everything below the line into Claude Code, from the repo root.

---

I'm adding a new feature to this site: a live "new arrivals" page with a vendor upload page and a booth map. The full plan is in `docs/booth-map/`.

Before writing any code:

1. Read `docs/booth-map/README.md`, then `MASTER_PLAN.md`, then `SPEC.md` in full. Use the preview at https://claude.ai/artifact/9DpWMkNdaACdUiZpg1ARmD as the reference for look and flow (ui-demo.html is out of date).
2. Inspect this repo and tell me: the Next.js version, whether it uses the App Router, how styling is done (Tailwind, CSS modules, other), where the site's fonts and color variables are defined, where the Meta Pixel and GA4 are loaded, and whether there's an existing database or ORM.
3. List every place the spec's assumptions don't match what you find in the repo, and propose how to adapt. The spec marks its own guesses as [assumed] or [unknown].
4. Give me a short build plan for steps 1 to 3 of the spec's build order only (schema, vendor upload page, shopper feed and item pages). Wait for my OK before you start.

Rules for the whole build:

- Work on a new branch called `booth-map`. Don't touch `main`.
- Don't change existing pages, components or styles unless I approve it. This feature adds new routes.
- Reuse the site's existing fonts, colors and components. Match the branding in the spec. Don't invent a new look.
- Phone first. Every screen has to work at 375 px wide before anything else.
- No photo may pass through a server function. Uploads go from the browser straight to Vercel Blob.
- Don't load the Meta Pixel, GA4, Microsoft Clarity or any third-party script on vendor or admin routes. They load from app/layout.tsx today, so propose the route-group split and wait for my OK before moving any existing page.
- Never commit secrets. Use environment variables and tell me which ones to set.
- Don't build the sales report parser yet. There's no sample report. Build the Sold button and 30-day expiry first.
- Don't ship the booth sale button until I confirm how the mall's register handles sales. Build it behind a flag.
- After each build step, stop, summarize what you did, and tell me exactly how to test it on my phone.
- If something in the spec looks wrong or won't work in this repo, say so and suggest a fix. Don't work around it silently.
