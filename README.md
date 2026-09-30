# leftovers

A little memory for what's in your fridge. Snap a receipt or an item, confirm what the AI found, and Leftovers keeps track, nudging you about what to eat soon.

Desktop-first web app: React + TypeScript + Vite. Receipt and item scanning use Claude's vision through a small server route, so your API key never reaches the browser.

## Run it locally

You need Node 22 or newer (`node -v`; install with `brew install node`).

```bash
npm run setup   # once: installs dependencies and asks for your Anthropic API key
npm run dev     # starts the app and opens http://localhost:5173
```

**Scanning needs Claude, powered one of two ways** (`npm run setup` walks you through it):

- **Your Claude subscription, via Claude Code (free, local only).** If the `claude` CLI is installed and signed in, and there's no API key, scans run through `claude -p` and count against your plan's usage limits. This is for trying the app on your own machine.
- **An Anthropic API key (pay-as-you-go).** Paste it into `npm run setup`, which hides it as you type, checks it works, and saves it to `.env` (git-ignored, readable only by you). You'll need this once anyone else uses the app.

To force one, set `LEFTOVERS_SCANNER=api` or `LEFTOVERS_SCANNER=claude-code` in `.env`. Without either, everything works except scanning, and **Add by hand** always works.

When `npm run dev` starts, it prints whether scanning is on. Your food is saved in the browser, so it survives restarts; to wipe it, go to Profile → Start over.

## What's here

| Area | Where |
|---|---|
| Home: the fridge door (eat-soon magnets + your decor), eat-soon list, photo grid | `src/pages/Home.tsx` |
| Fridge: the door swings open onto the shelves, or switch to List view; item details on the right | `src/pages/FridgePage.tsx`, `src/components/Fridge.tsx`, `Shelves.tsx`, `ItemPanel.tsx` |
| Add: scan a receipt, scan an item, or add by hand; editable review, and uncertain items must be confirmed | `src/components/AddDialog.tsx` |
| Customize: 8 paints (incl. light teal), gloss/matte, drag-around magnets | `src/pages/Customize.tsx`, `src/lib/decor.ts` |
| Onboarding: name → just me / share → pick your fridge | `src/pages/Onboarding.tsx` |
| Scanning (server): Claude vision → structured JSON | `server/scan.ts`, mounted by `server/vitePlugin.ts` |
| Data: local-first store in `localStorage`, all writes go through `actions` | `src/lib/store.ts` |

## Not built yet

- **Accounts and real sharing.** Households, members and Mine/Shared exist in the UI and data model, but data lives on this device only. The next step is Supabase (auth, Postgres with row-level security, photo storage) behind the same `actions` API in `src/lib/store.ts`.
- **Production hosting for `/api/scan`.** It runs inside the Vite dev/preview server today. Move `server/scan.ts` into a Supabase Edge Function (or any serverless function) when deploying.
- **Photos.** `public/food/` holds Creative Commons placeholders, some of which require attribution. See `CREDITS.md`, and replace them before launch.
