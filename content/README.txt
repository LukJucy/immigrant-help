==============================================================
SettleIn — CONTENT LIBRARY
Context & source data for site development
==============================================================

PURPOSE
-------
This folder holds the actual CONTENT that populates the SettleIn
website — not code and not the product spec. Each file is written
so it can be parsed/imported into the site's task guides, prefill
tools, forum, and reference data later.

Target audience: non-EU (and EU) students arriving in Dublin, Ireland.
All facts verified for 2026. Re-verify before any public launch —
fees, wait times, and portals change.

FOLDER MAP -> SITE
------------------
01-task-guides/    -> Pillar 1 (Guided info). One file per public
                      service. Each follows the SAME template so it
                      imports cleanly. This is the core knowledge base.
                      Guides: visa-application, irp-registration, ppsn,
                      student-bank-account, student-leap-card, sim-card,
                      health-gp, accommodation, tax-revenue,
                      driving-licence.

02-prefill-templates/ -> Pillar 2 (Smart prefill). The profile fields
                      a user enters once, the per-task document
                      checklists, and ready-to-edit letter drafts.

03-forum-seed/     -> Pillar 3 (Community). Seed experience posts to
                      avoid a cold-start, plus vetted external links.

04-reference/      -> Shared/global data used across the site: official
                      source links, a glossary of terms, the deadline
                      timeline engine inputs, key phone numbers,
                      support/mental-health helplines, and stage
                      checklists (pre-arrival -> graduation).

TASK-GUIDE TEMPLATE (used by every file in 01-task-guides/)
-----------------------------------------------------------
  TASK:            short name
  CATEGORY:        legal / money / transport / health / housing / comms
  PRIORITY:        when to do it (pre-arrival / week 1 / first 90 days)
  WHO NEEDS IT:    eligibility
  WHY:             one line
  STEPS:           numbered, in order
  DOCUMENTS:       what to bring/upload
  FEES:            cost
  TIMEFRAME:       how long it takes
  OFFICIAL LINK:   authoritative source(s)
  TIPS:            practical, community-sourced advice
  LAST VERIFIED:   date

CONVENTIONS
-----------
- Plain text, UTF-8. Fields in CAPS so they're easy to split on.
- Every factual figure is dated. Treat undated facts as suspect.
- "[VERIFY]" tags mark anything that especially needs a fresh check.

LAST UPDATED: 8 June 2026
==============================================================
