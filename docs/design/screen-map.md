# Screen Map & Wireframes

Every screen, its purpose, key components, and states. Wireframes are described as low-fidelity ASCII layouts (mobile-first, ~375px). Components reference the design system.

## Sitemap

```
/onboard            Onboarding wizard (first run only)
/timeline           Dashboard — personalised task list   [home]
/task/:id           Task guide detail
/prefill/:id        Prefill generator
/forum              Community feed
/forum/:postId      Single experience post
/forum/new          Compose post
/help               Help & helplines
/search             Search results (overlay/modal)
/about              Disclaimer, content trust, privacy
```

Bottom tab bar (persistent): **Timeline · Forum · Search · Help**.

## 1. Onboarding (`/onboard`)

Purpose: collect 6 core fields, one per screen, with progress.

```
┌─────────────────────────────┐
│  ●●●○○○            Skip      │   progress dots + skip
│                             │
│  Where are you from?        │   question (one per screen)
│                             │
│  [ Search nationality   ▾ ] │   select/typeahead
│                             │
│  Why we ask: this decides   │   micro-help (calm tone)
│  if you need a visa & IRP.  │
│                             │
│           [  Next  → ]      │   primary button
└─────────────────────────────┘
```
States: default, selected, "do this later". Last step → CTA "See my plan".

## 2. Timeline / Dashboard (`/timeline`) — home

Purpose: the anxiety-killer. Deadline-first ordered list.

```
┌─────────────────────────────┐
│  Hi Priya 👋                │
│ ┌─────────────────────────┐ │
│ │ ⏳ IRP deadline          │ │   pinned countdown card
│ │ 76 days left · Nov 23   │ │   (only if needsIrp)
│ │ Book your appointment → │ │
│ └─────────────────────────┘ │
│                             │
│  BEFORE ARRIVAL             │   phase group header
│  ☐ Student visa     4-12wk │   task row: status · title · timing
│  ☐ Accommodation    early  │
│  PsT WEEK 1                  │
│  ☐ SIM card         day 1  │
│  ☐ Book IRP appt    urgent │
│  ☑ Open Revolut     done   │   completed state
│  ...                        │
└─────────────────────────────┘
   [Timeline] [Forum] [Search] [Help]
```
Components: CountdownCard, PhaseGroup, TaskRow (checkbox + title + timing chip + "blocked by" note), TabBar. States: empty (no arrival date → no countdown), all-done.

## 3. Task guide (`/task/:id`)

Purpose: how to do one task.

```
┌─────────────────────────────┐
│ ← IRP Registration   ⚖ legal│   back · title · category chip
│ Verified 8 Jun 2026 · gov.ie│   trust line
│                             │
│ Why it matters              │   short intro
│ Steps                       │
│  1. Arrive in Ireland       │   numbered steps
│  2. Create ISD account …    │
│ Documents  ☐ Passport …     │   checklist
│ Fee  €300                   │   fact chips
│ Timeframe  within 90 days   │
│ Tips  ▸                     │   collapsible
│                             │
│ [ Prefill this ] [ Remind ] │   CTAs
│ [ See experiences (irp) ]   │
│ Report outdated info        │   feedback link
└─────────────────────────────┘
```
Components: TrustLine, StepList, DocChecklist, FactChip, TipAccordion, GlossaryTooltip, CTAButton. States: with/without prefill template, with/without forum posts.

## 4. Prefill (`/prefill/:id`)

Purpose: generate letter + checklist + reminder.

```
┌─────────────────────────────┐
│ ← Prefill: PPSN letter      │
│ Missing: Irish address      │   inline field request
│ [ 12 Foster Place, D2     ] │
│                             │
│ ┌─ Draft (editable) ──────┐ │
│ │ Dear TCD International   │ │   filled template preview
│ │ Office, I am a …        │ │
│ └─────────────────────────┘ │
│ [ Copy ] [ Download ] [Send]│
│                             │
│ Your checklist              │   personalised doc list
│  ☐ Passport  ☐ College ltr │
│ [ Add deadline to calendar ]│   .ics
└─────────────────────────────┘
```
Components: InlineFieldRequest, DraftEditor, DocChecklist, IcsButton. States: profile complete vs missing-field; copied/downloaded confirmation.

## 5. Forum feed (`/forum`)

```
┌─────────────────────────────┐
│ Experiences      [+ Share]  │
│ Filter: [All ▾]  Sort:[Top▾]│   tag filter · sort
│ ┌─────────────────────────┐ │
│ │ irp · ▲142              │ │   tag chip · upvotes
│ │ Got my IRP slot — check │ │   title
│ │ the portal at 8am       │ │
│ │ @maptolife 🇮🇳  · seed   │ │   author · seed label
│ └─────────────────────────┘ │
│ … more cards …             │
└─────────────────────────────┘
```
Components: TagFilter, SortControl, PostCard (tag, upvotes, title, author, seed badge). States: filtered empty, loading.

## 6. Post detail (`/forum/:postId`)
Full body, upvote button, report link, related task guide link, "more on this tag".

## 7. Compose (`/forum/new`)
Tag picker (required) · title · body · submit. Shows moderation note ("posts are reviewed"). States: validation errors, submitted/pending.

## 8. Help (`/help`)
Grouped contact cards: Emergency (999/112) · Wellbeing (Samaritans, Aware, Text 50808) · Legal/rights (Immigrant Council, FLAC, NASC) · Housing (Threshold). Calm visual tone, click-to-call.

## 9. Search (`/search`, overlay)
Single input → grouped results: Guides · Glossary · Experiences. Each result links to its screen.

## 10. About / Trust (`/about`)
The signposting-not-legal-advice disclaimer, how content is kept current (verification dates), and the privacy/data note.

## Screen inventory (build checklist)

| # | Screen | Priority | Notes |
|---|--------|----------|-------|
| 1 | Onboarding | P0 | gates everything |
| 2 | Timeline | P0 | home, the hero |
| 3 | Task guide | P0 | core content |
| 4 | Prefill | P0 | the wow demo moment |
| 5 | Forum feed | P0 | seeded |
| 6 | Post detail | P1 | |
| 7 | Compose | P1 | in-memory for demo |
| 8 | Help | P1 | static |
| 9 | Search | P1 | client-side filter |
| 10 | About/Trust | P1 | disclaimer required |
```
