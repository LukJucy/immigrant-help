# SettleIn — Product Spec

*An information & automation hub for immigrant students arriving in Ireland*

**Version:** 0.1 (hackathon draft) · **Target city:** Dublin · **Date:** 8 June 2026

---

## 1. The problem

A non-EU student accepted to a Dublin university faces a maze of disconnected, bureaucratic tasks in their first 90 days — get a PPSN, register for an IRP, open a bank account, get a Leap card, buy a SIM. Each has its own portal, document checklist, eligibility rule, and appointment queue. The information is scattered across `gov.ie`, `irishimmigration.ie`, `mywelfare.ie`, `leapcard.ie`, bank sites, and dozens of out-of-date blog posts. Students miss deadlines (IRP must be registered within 90 days of arrival), bring the wrong documents to appointments, and re-ask the same questions every intake cycle.

**The gap:** no single place that (a) tells you *exactly what to do, in order, for your situation*, (b) *pre-fills the repetitive parts*, and (c) lets you *learn from people who just did it*.

## 2. Who it's for

The primary user is a **first-time non-EU undergraduate or postgraduate** arriving in Dublin, 18–30, anxious, time-poor, often pre-arrival and researching from their home country. Secondary users: EU students (lighter needs — no IRP), university international offices who currently field these questions manually, and returning students renewing permissions.

## 3. What it does — three pillars

### Pillar 1 — Guided information ("What do I do?")

A searchable, structured knowledge base of public-service tasks, each rendered as a **checklist with current rules, fees, documents, and official links** rather than a wall of text. Content is filtered by the user's profile (nationality, visa stamp, university, arrival date) so they only see what applies to them. A timeline view orders every task by deadline relative to their arrival date.

Launch task guides (Dublin, 2026):

| Task | Key facts the guide must surface | Official source |
|------|----------------------------------|-----------------|
| **PPSN** | Must be resident in Ireland to apply; apply via MyGovID → MyWelfare; needs passport, proof of address (long-term, not temporary), and a college letter stating the PPSN is needed for study; **in-person appointment required**; number arrives by post. | [gov.ie](https://www.gov.ie/en/department-of-social-protection/services/get-a-personal-public-service-pps-number/) · [citizensinformation.ie](https://www.citizensinformation.ie/en/social-welfare/irish-social-welfare-system/personal-public-service-number/) |
| **IRP registration** | Register within **90 days** of arrival; first-time Dublin registrations booked via the **ISD Customer Portal**, slots open ~10 weeks ahead (real waits 8–10 weeks in late 2025); **€300 fee**; appointment at Burgh Quay; card posted in ~10–15 working days. | [irishimmigration.ie](https://www.irishimmigration.ie/registering-your-immigration-permission/information-on-registering/irish-residence-permit/) · [citizensinformation.ie](https://www.citizensinformation.ie/en/moving-country/moving-to-ireland/rights-of-residence-in-ireland/registration-of-non-eea-nationals-in-ireland/) |
| **Student bank account** | Needs passport, IRP/visa, college acceptance letter, proof of Irish address; AIB Student Plus & BOI student accounts are fee-free; only licensed banks issue Irish IBANs; BOI/AIB allow pre-arrival application start (BOI "Coming to Ireland", up to 45 days early); Revolut/N26 open in minutes but check IBAN/employer acceptance. | [AIB](https://aib.ie/our-products/current-accounts/student-plus-account) · [educationinireland.com](https://www.educationinireland.com/en/living-in-ireland/banking-in-ireland) |
| **Student Leap Card** | Full-time course, 15+ hrs/week, 25+ weeks; apply online at leapcard.ie, upload college acceptance letter (English/Irish); €5 refundable deposit + €5 min credit; **half-price fares**; collect from a Student Leap agent with student ID. | [student.leapcard.ie](https://student.leapcard.ie/) · [transportforireland.ie](https://www.transportforireland.ie/fares/leap-card/) |
| **SIM card** | Compare prepaid plans (Three, Vodafone, Eir, 48, GoMo); eSIM vs physical; most prepaid SIMs need no PPSN/IRP — passport often enough. Guide compares price/data, not a transaction. | Provider sites |

> All figures must be treated as **last-verified** and shown with a date stamp; rules and fees change. A maintenance process (see §7) keeps them current.

### Pillar 2 — Smart prefill ("Do it for me, almost")

For each task, the user enters their core details **once** into a profile (name, passport number, nationality, address, university, course dates, arrival date). SettleIn then:

- **Pre-fills downloadable/printable forms and generates the exact document checklist** for each appointment, personalised to their profile.
- **Auto-drafts the required college/support letters** (e.g. the PPSN "reason for application" letter) ready to send to their university office.
- **Deep-links into official portals** with as many fields pre-populated as each portal's URL parameters allow, and shows a step-by-step "what you'll see next" walkthrough for portals that can't be pre-filled.
- **Generates calendar events** with deadlines (the 90-day IRP clock) and appointment reminders.

> **Scope boundary:** SettleIn does **not** log into government portals or submit applications on the user's behalf, and never executes payments. It prepares, pre-fills, reminds, and hands off. This keeps it legally safe and avoids handling credentials. (See §8 Risks.)

### Pillar 3 — Community & experiences ("How did others do it?")

A forum / experience feed where students share real, recent walkthroughs ("I got my IRP appointment in 3 weeks by checking the portal at 8am", "this bank branch is fastest during orientation week"). Two content sources:

1. **User-generated** — students post guides, tips, and Q&A, upvote, and tag by task and nationality. This is the long-term moat.
2. **Curated/aggregated** — surfaced links to relevant existing content (Reddit r/IrishStudents, YouTube arrival vlogs, university blogs) as *references*, not scraped copies, to respect platform terms and copyright. Each task guide links out to a small set of vetted community threads.

## 4. MVP scope (hackathon-feasible)

Build a **demo that tells a complete story for one persona** — a non-EU master's student arriving in Dublin — across all three pillars, breadth-first but shallow.

**In scope for the demo:**

- Profile onboarding (5 fields) that personalises everything downstream.
- The **5 task guides** above, as structured checklist pages with live rules + official links.
- A **personalised timeline** ordering the 5 tasks by deadline from arrival date.
- **Prefill demo on one task** (PPSN): generate the college-letter draft + a personalised document checklist + a calendar `.ics` reminder.
- A **seeded forum** with ~10 realistic example posts and working post/upvote (in-memory).

**Explicitly out of scope for the hackathon:** real auth, real database, payments, live scraping pipelines, more than one city, mobile app. Fake/seed the data; make the flow feel real.

## 5. Suggested tech stack

Optimised for building fast and demoing in a browser:

- **Frontend:** React + Tailwind, single-page. Could be one React artifact for the hackathon demo.
- **Content:** task guides as structured JSON/Markdown (no CMS needed for MVP) so they're easy to edit and version.
- **Prefill:** client-side templating for letters/checklists; `.ics` generation in-browser; deep links via URL params.
- **Forum:** in-memory state for the demo; swap to a real backend (Supabase/Firebase) post-hackathon.
- **Later:** lightweight backend + Postgres, auth, an admin tool for keeping rules current.

## 6. Demo script (for judges)

1. "Meet Priya, accepted to Trinity, arriving in 3 weeks." Enter profile.
2. Timeline appears — every task ordered by deadline, IRP flagged "register within 90 days."
3. Open the PPSN guide — current rules, fee, documents, official link.
4. Click **Prefill** — SettleIn drafts her college letter, builds her document checklist, drops an appointment reminder into her calendar.
5. Open the forum — read a recent "how I got my IRP slot" tip, upvote it.
6. Close on the vision: "one place, personalised, kept current by the community."

## 7. Keeping content correct (the real challenge)

The product's credibility dies if the rules are stale. Plan: each guide carries a `lastVerified` date and a source link; a scheduled monthly review (and post-MVP, automated change-detection on the source pages) flags drift; the community flags errors directly on each guide. Surface the verification date to users so trust is explicit.

## 8. Key risks

- **Legal / liability:** giving immigration "advice" is sensitive. Position SettleIn as *signposting to official sources*, never as legal advice; always link the authoritative `gov.ie` / `irishimmigration.ie` page; add a clear disclaimer.
- **Stale data:** mitigated by §7 and visible verification dates.
- **Scraping & copyright:** prefer linking and user-generated content over copying Reddit/YouTube; respect platform terms.
- **Credentials / privacy:** never store passport numbers server-side unencrypted; the no-login-on-their-behalf boundary (§Pillar 2) sidesteps the worst of this. GDPR applies — minimise and encrypt personal data.
- **Cold-start on the forum:** seed with university-office content and a few power users before launch.

## 9. Post-hackathon roadmap

Near term: real auth + database, second city, more task guides (GP/health registration, accommodation, tax/Revenue, driving licence exchange). Medium term: university partnerships (international offices co-maintain content and onboard their cohort), browser extension for true portal pre-fill, multilingual content. Long term: expand to other countries with the same task-engine model — the structure (profile → personalised tasks → prefill → community) is country-agnostic.

---

*Sources for the Irish service details in §3 are linked inline. All rules, fees, and wait times are as reported for 2026 and must be re-verified before launch.*
