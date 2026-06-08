# Content Style Guide

How to write every guide, tip, label, and forum prompt in SettleIn. Consistency here is what makes the content trustworthy and easy to scan. This formalises the conventions already used in the `content/` library.

## Voice & tone

- **Calm and reassuring.** Users are anxious and time-poor. Lead with the next action, not the risk.
- **Plain English.** Aim for a reading age of ~12. Short sentences. One idea per sentence.
- **Second person.** "You need your passport," not "The applicant must present a passport."
- **Specific and concrete.** "Book your IRP appointment within 90 days of arriving," not "Registration should be completed promptly."
- **Never alarmist.** Flag a real deadline once, clearly, then move on. No ALL-CAPS scare lines (except sparingly for a genuine warning like scam/deposit).
- **Non-judgemental.** Assume competence; never condescend.

## Acronyms & jargon

- Expand on first use, then use the short form: "Personal Public Service Number (PPSN)".
- Anything in the glossary gets a tooltip on first use in a guide.
- Avoid bureaucratic phrasing ("immigration permission for the purpose of study") — translate it ("permission to live here as a student").

## Structure of a task guide

Every guide uses the same fielded template so it parses and scans consistently:

```
TASK · CATEGORY · PRIORITY · WHO NEEDS IT · WHY ·
STEPS · DOCUMENTS · FEES · TIMEFRAME · OFFICIAL LINK ·
TIPS · LAST VERIFIED
```

- **Steps** are numbered, imperative, in order: "Create a MyGovID account."
- **Documents** are a flat checklist, each item a concrete noun: "Passport", "College PPSN letter".
- **Tips** are practical and community-sourced in spirit; 1-2 sentences each.
- **Fees/Timeframe** state numbers plainly with currency and a date stamp.

## Facts, figures & trust

- **Date every fact.** Each guide carries a `LAST VERIFIED` date; figures that change often (fees, wait times, work-hour limits) get a `[VERIFY]` tag.
- **Link the source.** Prefer official (`gov.ie`, `irishimmigration.ie`, `citizensinformation.ie`) over secondary. Show the source on screen.
- **One source of truth.** Don't restate a fee in five guides; reference the canonical guide and link.
- **No advice we can't stand behind.** Frame immigration/legal/tax content as signposting to official info, not personal advice. Use: "This is general information, not legal advice — check the official page for your situation."

## Numbers, dates, money

- Currency: `€300` (symbol, no space). Spell out only in prose where natural.
- Dates: "23 November 2026" in prose; ISO (`2026-11-23`) in data.
- Ranges: "8-10 weeks". Durations: "within 90 days".
- Phone numbers grouped as the provider lists them (e.g. `1800 666 111`).

## Formatting

- Sentence case for headings and buttons ("Book your appointment"), not Title Case.
- Lists for steps and documents; prose for explanation.
- Bold sparingly — only for a genuine warning or the single key action.
- No walls of text: chunk into the fielded sections.

## Buttons & microcopy

- Verbs, specific: "Prefill this letter", "Add deadline to calendar", "Share your experience".
- Avoid vague labels: not "Submit"/"OK"/"Proceed".
- Empty states are warm and actionable: "No experiences here yet — be the first to share how it went."
- Errors are plain and blameless: "We couldn't load this. Try again." Never expose codes.

## Forum & user content

- Label seed/example posts clearly as examples until replaced by real opt-in content.
- Encourage recency and specificity in the compose hint: "What surprised you? What would you tell someone arriving next week?"
- Moderate for scams, personal data, and misinformation (see trust & safety policy if/when created).

## Sensitive topics

- **Money/scams (housing):** be direct about deposit scams; give the safe action ("never pay before viewing") and a support link (Threshold).
- **Mental health/help:** present calmly, offer the helpline, never dramatise. Don't bury the Samaritans number.
- **Immigration risk:** state rules factually; always point to the official source and free advice (Immigrant Council, FLAC).

## Localisation-ready
Write so strings translate cleanly: avoid idioms, keep sentences self-contained, don't concatenate fragments in code. Even English-only at launch, keep content keyed by locale.
