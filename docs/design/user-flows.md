# User Flows

The journeys the app must support, in build order. Each flow lists the steps, what data it reads/writes, and the success state. Flows map directly to the screens in `screen-map.md` and the entities in `../technical/data-model.md`.

## Primary persona

**Priya, 24, non-EU master's student, Trinity College Dublin.** Accepted, arriving in ~3 weeks, researching from home on her phone. Anxious about deadlines and paperwork, unsure what order to do things in. Success = she always knows the *next* thing to do and has the documents ready.

(Secondary: EU student — no visa/IRP; returning student — renewal; university office — content trust.)

## Flow 1 — Onboarding (first run)

Goal: capture the 5-6 core profile fields so everything else personalises.

1. Landing → "Tell us about you" (value prop in one line).
2. Ask, one per screen: nationality → visa stamp (auto-suggested from nationality) → university → arrival date → course start → "will you work part-time?".
3. Compute derived flags (`needsVisa`, `needsIrp`, `irpDeadline`, …).
4. → Land on the personalised **Timeline/Dashboard**.

Reads: nothing. Writes: `UserProfile.core` + `willWork`. Success: dashboard shows tasks tailored to her (e.g. EU student never sees IRP).

Edge cases: skip/"do this later" allowed for every field; missing arrivalDate disables the countdown but still shows the task list.

## Flow 2 — See what to do & when (Timeline/Dashboard)

Goal: the anxiety-killer. One ordered list, deadline-first.

1. Dashboard loads timeline items, filtered by profile, ordered by computed due date, grouped by phase (Pre-arrival → Week 1 → First month → First 90 days → When working).
2. The **IRP 90-day countdown** is pinned at the top if `needsIrp`.
3. Each item shows: title, phase, due/by date, status (not started / in progress / done), and any "blocked by" note (e.g. PPSN blocked by accommodation).
4. Tap an item → Task guide (Flow 3).
5. User can mark items done; progress persists.

Reads: `TimelineItem[]`, `TaskGuide` summaries, profile. Writes: per-item status. Success: she sees the single most urgent next action above the fold.

## Flow 3 — Read a task guide

Goal: know exactly how to do one task.

1. From dashboard or search → Task guide screen.
2. Sections: why it matters → who needs it → **step-by-step** → documents → fees → timeframe → official link(s) → tips → `lastVerified` date.
3. Inline glossary tooltips on first use of terms (PPSN, Stamp 2…).
4. CTAs: **Prefill this** (if a template exists), **Add reminder** (`.ics`), **See others' experiences** (jump to forum tag), **Report outdated info**.

Reads: `TaskGuide`, related `PrefillTemplate`, `ForumPost[]` by tag. Success: she understands the task and can act, or hands off to prefill.

## Flow 4 — Prefill (the "do it for me, almost")

Goal: remove repetitive paperwork.

1. From a guide → "Prefill this".
2. If profile is missing a needed field (e.g. Irish address), ask for it inline (one field).
3. Generate, from template + profile: the filled **letter/email draft**, a personalised **document checklist**, and a **calendar reminder** for the deadline.
4. User reviews the draft (editable), then: copy, download, or send to their university office; download `.ics`.

Reads: `PrefillTemplate`, `document-checklists`, `TimelineItem`. Writes: optional new profile fields. Success: she has a ready-to-send letter and a checklist without retyping anything. **Boundary:** the app never logs into gov portals or submits on her behalf.

## Flow 5 — Community / forum

Goal: learn from people who just did it; beat the cold-start with seed posts.

1. Forum tab → list of posts, filterable by task tag, sortable by top/recent.
2. Seed/example posts are clearly labelled as such.
3. Tap a post → full experience; upvote; report.
4. "Share your experience" → compose (task tag, title, body) → submit. (Moderation per policy; new posts may be `pending`.)

Reads: `ForumPost[]`. Writes: new post, upvote, report. Success: she finds a recent relevant tip (e.g. "check the IRP portal at 8am") and/or contributes one.

## Flow 6 — Get help (always available)

Goal: one tap to safety/support.

1. Persistent "Help" entry → emergency numbers (999/112), wellbeing helplines (Samaritans, Aware), legal/migrant-rights support, housing/scam advice.
2. Calm, non-alarming presentation; links out to official services.

Reads: `Contact[]`, support links. Success: she can reach the right helpline immediately.

## Cross-cutting
- **Search** is reachable from every screen → matches guides, glossary, and forum.
- **Trust:** every factual screen shows a `lastVerified` date and links the official source; a global "this is signposting, not legal advice" disclaimer is reachable from the footer.
- **Resumability:** the user can leave and return; profile and progress persist.
