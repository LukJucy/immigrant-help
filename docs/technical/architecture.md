# System Architecture

Scope: an architecture that demos convincingly in a hackathon weekend and grows into a real product without a rewrite. The guiding principle is **content-as-data**: the `content/` library compiles to static JSON, the app is a thin client over it, and only the forum and profile need write paths.

## Overview

```
                ┌─────────────────────────────────────────┐
                │              SettleIn Web App             │
                │        (React SPA, mobile-first)          │
                │                                           │
                │  Onboarding · Timeline · Task guide ·     │
                │  Prefill · Forum · Glossary/Help          │
                └───────────────┬───────────────┬───────────┘
                                │ reads          │ reads/writes
                 ┌──────────────▼──────┐   ┌─────▼──────────────┐
                 │  Static content JSON │   │  Backend (post-MVP) │
                 │  (compiled from      │   │  profile · forum ·  │
                 │   content/*.txt)     │   │  auth · admin edit  │
                 └──────────────────────┘   └─────────┬──────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │   Postgres DB    │
                                              └──────────────────┘
```

## Layers

### 1. Content layer (build-time)
A small build script parses `content/**/*.txt` into validated JSON (see data-model.md) and bundles it with the app. Because guides are static data, search, timeline, and task pages need **no backend** for the demo. Updating content = edit a `.txt`, re-run the build.

### 2. Client layer (React SPA)
- Mobile-first single page app. Routes: `/onboard`, `/timeline`, `/task/:id`, `/prefill/:id`, `/forum`, `/forum/:postId`, `/help`.
- State: profile in React state (+ `localStorage` for persistence in the real app; in-memory only inside sandboxed artifacts).
- The **timeline rules engine** runs client-side: it takes profile anchors and the timeline rules JSON and produces the ordered, dated task list.
- The **prefill engine** runs client-side: template + profile → filled letter/checklist; `.ics` generated in-browser.

### 3. Service layer (post-MVP only)
For anything that writes or must be shared across users:
- **Profile service** — store/retrieve user profile (encrypted sensitive fields).
- **Forum service** — posts, upvotes, reports, moderation queue.
- **Auth** — email/social login.
- **Admin/content editor** — lets non-developers update guides and `lastVerified` dates.

A managed backend-as-a-service (Supabase or Firebase) covers auth + Postgres + storage with minimal setup, and keeps the same entity shapes from the data model.

## The three pillars, technically

| Pillar | Demo (hackathon) | Production |
|--------|------------------|-----------|
| Guided info | Static JSON + client-side filter/search | Same JSON, served via CDN; optional full-text search service |
| Prefill | Client-side templating + `.ics` | Same, plus saved drafts in profile service |
| Forum | Seeded JSON + in-memory post/upvote | Forum service + Postgres + moderation |

## Search (demo vs later)
- **Demo:** in-memory filter over the guides JSON (title, body, tags) — instant, no infra.
- **Later:** a lightweight search index (e.g. Lyra/FlexSearch client-side, or a hosted search service) once content volume grows or multilingual search is needed.

## Personalisation flow
`onboarding answers → UserProfile → derived flags → timeline engine filters TaskGuides by appliesTo → ordered dashboard`. All client-side and deterministic, so it's easy to demo and test.

## Non-functional priorities
- **Mobile-first & low-bandwidth** — users are often on phones, pre-arrival, on patchy connections. Keep the bundle small; lazy-load the forum.
- **Offline-friendly content** — static guides can be cached (service worker) so the checklist works without signal at an appointment.
- **Accessibility** — semantic HTML, keyboard nav, WCAG AA contrast (see design-system.md).
- **i18n-ready** — wrap all UI strings and keep guide content keyed by locale, even if the demo ships English only.
- **Privacy by design** — sensitive profile fields client-side or encrypted; no third-party trackers on pages handling passport data.

## Tech stack (recommended)
- Frontend: React + Tailwind, Vite build. (For the very first demo, a single React artifact is viable.)
- Content build: a Node script (`scripts/build-content.js`) → `public/content.json`.
- Backend (when needed): Supabase (Postgres + auth + storage).
- Hosting: any static host (Vercel/Netlify) for the SPA + content.

## Build/deploy
1. `npm run build:content` — txt → validated JSON.
2. `npm run build` — bundle SPA + content.
3. Deploy static output; (later) point the app at the Supabase project for profile/forum.
