# Design System & Brand

A small, calm, mobile-first system. The emotional job is to **reduce anxiety**: clear hierarchy, generous space, plain language, no clutter. Everything below is tuned for that and for Tailwind defaults so it's fast to build.

## Brand

- **Name:** SettleIn (working name). Tagline: *"Your first 90 days in Ireland, sorted."*
- **Personality:** calm, trustworthy, plain-speaking, quietly warm. Think a well-organised friend who's done this before — not a government form, not a hype startup.
- **Voice:** see `content-style-guide.md`. Short sentences, second person, no jargon without a tooltip.

## Colour

Trust + calm. A deep teal/green primary (echoes Ireland without clichéd shamrock-green), warm neutrals, and clear semantic colours for deadlines.

| Token | Hex | Use |
|-------|-----|-----|
| `primary` | `#0F766E` (teal-700) | actions, links, active nav |
| `primary-soft` | `#CCFBF1` (teal-100) | highlights, selected chips |
| `ink` | `#1F2937` (gray-800) | body text |
| `muted` | `#6B7280` (gray-500) | secondary text, captions |
| `surface` | `#FFFFFF` | cards |
| `bg` | `#F9FAFB` (gray-50) | page background |
| `border` | `#E5E7EB` (gray-200) | dividers, card borders |
| `danger` | `#DC2626` (red-600) | hard deadlines, urgent |
| `warning` | `#D97706` (amber-600) | "due soon", caution |
| `success` | `#16A34A` (green-600) | completed, verified |
| `info` | `#2563EB` (blue-600) | tips, neutral notices |

Rules: never red except for genuine deadlines/urgency (don't make the whole app feel alarming). Verified/`lastVerified` badges use `success`. Maintain WCAG AA contrast (4.5:1 body, 3:1 large text).

## Typography

System/Tailwind stack for speed and legibility: `Inter` (or system-ui) for everything.

| Style | Size / weight | Use |
|-------|---------------|-----|
| Display | 28px / 700 | screen titles |
| H2 | 20px / 600 | section headers |
| H3 | 16px / 600 | card titles |
| Body | 16px / 400 | default (never below 16px on mobile) |
| Small | 14px / 400 | captions, trust line |
| Mono | 14px | none/avoid; only codes if needed |

Line length max ~70 chars; line-height 1.5 for body. Left-aligned, never justified.

## Spacing & layout

- 4px base scale: `4, 8, 12, 16, 24, 32, 48`.
- Mobile-first, single column, ~16px page gutters. Max content width 640px on desktop (it stays a focused, phone-like column).
- Cards: `surface` bg, 1px `border`, 12px radius, 16px padding.
- Touch targets ≥ 44px.

## Core components

- **Button** — primary (filled `primary`), secondary (outline), text. Full-width on mobile for primary CTAs.
- **TaskRow** — checkbox · title · timing chip · optional "blocked by" caption. Tappable.
- **CountdownCard** — large number + label, `danger`/`warning` accent by urgency, single CTA.
- **FactChip** — small rounded label for fee/timeframe/category.
- **TrustLine** — `success` check + "Verified {date} · {source}" linking the official page.
- **DocChecklist** — checkboxes that persist.
- **TipAccordion** — collapsed by default.
- **GlossaryTooltip** — dotted-underline term → definition popover.
- **PostCard** — tag chip · upvote count · title · author · `seed` badge.
- **TabBar** — 4 items (Timeline/Forum/Search/Help), `primary` active.
- **HelpCard** — icon · service name · click-to-call number.
- **PhaseGroup** — sticky header grouping tasks by timeline phase.

## Iconography
Simple line icons (e.g. lucide). One icon per category: legal ⚖, money €, transport 🚌, health ＋, housing 🏠, comms 📱, lifestyle ★. Keep emoji out of production UI except where intentional and tested.

## States & feedback
- Every list has an **empty state** with a friendly line + next action.
- **Loading:** skeleton cards, not spinners, on the timeline/forum.
- **Success toasts** for copy/download/submit.
- **Errors:** inline, plain-language, never a raw code.

## Accessibility (required)
- Semantic HTML, labelled inputs, visible focus rings.
- AA contrast; don't rely on colour alone (pair the deadline colour with text + icon).
- Full keyboard nav; respect reduced-motion.
- Screen-reader labels on icon-only buttons (upvote, back).

## Tone-of-voice in UI (quick rules)
- Reassure, don't alarm: "76 days left to register" + a clear CTA, not "URGENT: DEADLINE".
- Plain English; expand every acronym on first use.
- Address the user as "you"; be specific ("Book your IRP appointment" not "Proceed").
