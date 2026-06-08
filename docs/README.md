# SettleIn — Project Docs

Design and implementation documentation for SettleIn, an information & automation hub for immigrant students arriving in Ireland (Dublin). These docs turn the product concept and the `content/` library into something buildable.

## Index

**Product**
- `../product-spec.md` — problem, users, three pillars, MVP scope, demo script, risks, roadmap.

**Technical** (`docs/technical/`)
- `data-model.md` — JSON schemas for guides, profile, timeline, forum, prefill; the bridge from `content/*.txt` to code.
- `architecture.md` — content-as-data design, the three pillars technically, tech stack, non-functional priorities.
- `api-spec.md` — static content shapes + the small REST API for profile/forum (post-MVP).

**Design / UX** (`docs/design/`)
- `user-flows.md` — the 6 core journeys (onboarding → timeline → guide → prefill → forum → help).
- `screen-map.md` — sitemap, low-fi wireframes, and a P0/P1 build checklist.
- `design-system.md` — brand, colour, type, components, accessibility.
- `content-style-guide.md` — voice, structure, trust conventions for all written content.

**Content source** (`../content/`)
- The actual data the site serves: task guides, prefill templates, forum seed, reference (sources, glossary, timeline rules, helplines, checklists).

## How it fits together

```
product-spec  ──▶  what & why
design/*      ──▶  how it looks & flows
technical/*   ──▶  how it's built (schemas ← content/*.txt)
content/*     ──▶  what it says (the data)
```

## Suggested still-to-add (not yet written)
- Project pack: hackathon build plan, repo README, pitch deck.
- Trust & safety pack: content governance, legal disclaimer, GDPR data-handling, forum moderation policy.

LAST UPDATED: 8 June 2026
