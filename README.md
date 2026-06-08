# SettleIn

**Your first 90 days in Ireland, sorted.**

A mobile-first web app that helps immigrant students arriving in Dublin navigate
their first 90 days — visa, IRP, PPSN, bank, Leap card, SIM, health, tax — across
three pillars: **guided info**, **smart prefill**, and a **community forum**.

This is the v1 demo: a personalised, deadline-ordered timeline with a live IRP
90-day countdown, verified task guides with official links, a prefill engine that
drafts your college letter + document checklist + calendar reminder, and a seeded
forum. It runs entirely in the browser — no backend, no account.

---

## Quick start

```bash
npm install
npm run dev      # builds content.json, then starts Vite on http://localhost:5173
```

Other scripts:

| Command | What it does |
|---|---|
| `npm run build:content` | Parse `content/**.txt` → validated `public/content.json` (fails if a guide is missing `lastVerified`) |
| `npm run build` | Build content → typecheck → production bundle in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the unit tests (parser, timeline engine, prefill engine) |
| `npm run typecheck` | TypeScript check, no emit |

---

## Demo script (≈90 seconds)

> **Meet Priya** — accepted to Trinity, arriving in Dublin in a few weeks. On the
> onboarding screen, tap **"Explore with Priya's demo profile"**. Her **timeline**
> appears instantly: every task ordered by deadline, with the **IRP countdown**
> pinned at the top — *168 days left, register by 23 Nov, book by 14 Sep*. Open the
> **PPSN guide**: current rules, "Free", official `gov.ie` links, and a green
> *Verified 8 June 2026* trust line. Tap **Prefill** — SettleIn drafts her college
> letter (her name, course, and Trinity filled in), asks only for the one missing
> field (her Irish address), builds her **document checklist**, and lets her
> **download a calendar reminder**. Open the **Forum** to read a real "how I got my
> IRP slot at 8am" tip and upvote it. Close on the vision: *one place,
> personalised, kept current by the community.*

Switch the nationality during onboarding to an EU country and the IRP/visa steps
and countdown disappear — that's the personalisation engine at work.

---

## How it works

**Content-as-data.** The `content/` library of `.txt` files is the source of
truth. `scripts/build-content.ts` parses it into a validated `public/content.json`
(matching `docs/technical/data-model.md`) that the app loads statically. Editing a
guide = edit a `.txt` and re-run the build.

**Two deterministic, unit-tested engines run client-side:**

- **Timeline engine** (`src/engines/timeline.ts`) — from the profile anchors
  (`arrivalDate`, `courseStart`) + timeline rules → an ordered, dated,
  phase-grouped task list; the IRP 90-day countdown; and `blockedBy`
  relationships. Personalised by `appliesTo` (EU students never see IRP/visa;
  non-working students never see the tax guide).
- **Prefill engine** (`src/engines/prefill.ts`) — `PrefillTemplate` + `UserProfile`
  → a filled letter draft (with missing fields surfaced), a personalised document
  checklist, and a downloadable `.ics` reminder.

### Project layout

```text
content/                 source-of-truth .txt library (guides, templates, forum seed)
docs/                    product spec, data model, design system, screen map
scripts/
  parse.ts               pure, tested txt → schema parsers
  build-content.ts       IO + Zod validation + the lastVerified trust gate
src/
  engines/               timeline + prefill (client-side, deterministic)
  store/profile.tsx      localStorage profile (GDPR delete, sensitive fields client-only)
  screens/               Onboarding, Timeline, TaskGuide, Prefill, Forum, Search, Help, About
  components/            TrustLine, CountdownCard, TaskRow, DocChecklist, TabBar, …
tests/                   parser, timeline, prefill (Vitest)
```

---

## Trust & boundaries (by design)

- **Signposting, not legal advice.** Every factual screen shows a
  `Verified {date} · {source}` line linking the official page, and a global
  disclaimer is reachable from the footer and the **About** screen.
- **Prefill boundary.** SettleIn prepares, pre-fills, reminds, and hands off. It
  **never** logs into government portals, submits applications, or handles payments.
- **Privacy.** Everything stays in your browser — no server, no account. Passport
  number and date of birth are treated as sensitive: client-side only, never logged.
  **About → Delete all my data** performs a full wipe.
- **Accessibility.** Semantic HTML, labelled inputs, visible focus rings, AA
  contrast, colour never used alone, keyboard navigable, reduced-motion respected.

## Stack

React + TypeScript + Tailwind + Vite. Vitest for tests. Zod for content validation.
Deploys to any static host (Vercel/Netlify). Mobile-first, single focused column
(≤640px) with a bottom tab bar (Timeline · Forum · Search · Help).

> All Irish service rules, fees, and wait times are as reported for 2026 and carry
> a `lastVerified` date. Re-verify against the linked official sources before relying
> on them.
