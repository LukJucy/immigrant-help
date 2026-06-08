# Data Model & Content Schema

This is the bridge between the `content/` library (the `.txt` source files) and the running app. Every guide, profile field, forum post, and timeline rule maps to one of the schemas below. Build the import/parser against these shapes.

All entities use string IDs and ISO-8601 dates. `lastVerified` is mandatory on anything factual so the UI can show a trust date.

## 1. TaskGuide

Source: `content/01-task-guides/*.txt`. One file → one TaskGuide.

```json
{
  "id": "irp-registration",
  "title": "IRP (Irish Residence Permit) Registration",
  "category": "legal",
  "priority": "first_90_days",
  "whoNeedsIt": "All non-EEA/non-Swiss students staying longer than 90 days.",
  "why": "Legal proof of permission to live in Ireland (typically Stamp 2).",
  "steps": [
    { "order": 1, "text": "Arrive in Ireland." },
    { "order": 2, "text": "Create an account on the ISD Customer Portal." }
  ],
  "documents": ["Passport (incl. biometric page)", "University admission letter"],
  "fees": { "amount": 300, "currency": "EUR", "note": "unless in an exempt category" },
  "timeframe": "Register within 90 days of arrival; card posted ~10-15 working days after appointment.",
  "officialLinks": [
    { "label": "Immigration Service Delivery", "url": "https://www.irishimmigration.ie/..." }
  ],
  "tips": ["Book the appointment as soon as you arrive — waits can be 8-10 weeks."],
  "relatedGuides": ["health-gp", "ppsn"],
  "appliesTo": { "nationality": ["non_eea"], "stamp": ["stamp_2"] },
  "lastVerified": "2026-06-08",
  "verifyFlags": ["Appointment wait time", "Stamp 2 work-hour rules"]
}
```

Field notes:
- `category` enum: `legal | money | transport | health | housing | comms | lifestyle`.
- `priority` enum: `pre_arrival | week_1 | first_month | first_90_days | when_working | each_year | after_graduation`.
- `appliesTo` powers personalisation — a guide is shown only if the user's profile matches. Omit to show to everyone.
- `verifyFlags` are the `[VERIFY]` tags from the source text; surface as a maintenance queue (see content-governance).

## 2. UserProfile

Source: `content/02-prefill-templates/profile-fields.txt`. Entered once at onboarding; everything personalises from it.

```json
{
  "id": "usr_123",
  "core": {
    "fullName": "Priya Sharma",
    "nationality": "IN",
    "nationalityClass": "non_eea",
    "visaStamp": "stamp_2",
    "university": "tcd",
    "courseStart": "2026-09-14",
    "arrivalDate": "2026-08-25"
  },
  "extended": {
    "passportNumber": null,
    "dateOfBirth": "2001-04-02",
    "irishAddress": null,
    "hasAccommodation": false,
    "phoneIrish": null,
    "email": "priya@example.com",
    "willWork": true
  },
  "derived": {
    "needsVisa": true,
    "needsIrp": true,
    "irpDeadline": "2026-11-23",
    "needsPpsn": true,
    "showTaxGuide": true
  }
}
```

Privacy rules (enforce in code):
- `passportNumber` and `dateOfBirth` are sensitive: encrypt at rest, never log, prefer client-side-only for the demo.
- `derived.*` is computed, never stored as source of truth.
- Support full profile deletion (GDPR).

## 3. TimelineItem (rules engine)

Source: `content/04-reference/timeline-deadlines.txt`. The engine takes the profile anchors (`arrivalDate`, `courseStart`) and emits an ordered, dated task list.

```json
{
  "taskId": "irp-registration",
  "phase": "first_90_days",
  "timingRule": { "anchor": "arrivalDate", "offsetDays": 90 },
  "hardDeadline": true,
  "blockedBy": ["accommodation"],
  "showCountdown": true
}
```

Computed outputs the UI needs: `irpDeadline = arrivalDate + 90d`, `bookIrpBy = irpDeadline - 70d`, `taxRegisterBy = firstWorkDay - 7d`. Order the dashboard by computed due date, grouped by `phase`, and surface `blockedBy` relationships (PPSN + bank both depend on `accommodation`).

## 4. ForumPost

Source: `content/03-forum-seed/seed-posts.txt`.

```json
{
  "id": "post_001",
  "taskTag": "irp",
  "title": "Got my Dublin IRP slot — check the portal at 8am",
  "authorAlias": "maptolife",
  "authorNationality": "IN",
  "body": "The ISD portal releases slots on a rolling basis...",
  "upvotes": 142,
  "isSeed": true,
  "createdAt": "2026-06-08T00:00:00Z",
  "status": "published"
}
```

- `taskTag` links a post to a TaskGuide (`general` for cross-cutting).
- `isSeed` flags example/seed content so it can be visibly labelled and later replaced with real opt-in posts.
- `status` enum: `published | pending | removed` (for moderation).

## 5. PrefillTemplate

Source: `content/02-prefill-templates/letter-templates.txt`. `{{placeholders}}` resolve from `UserProfile`.

```json
{
  "id": "ppsn-college-letter-request",
  "type": "email",
  "subject": "Request for PPSN confirmation letter — {{fullName}}",
  "body": "Dear {{university}} International Office, ...",
  "placeholders": ["fullName", "university", "courseName", "irishAddress"],
  "relatedGuide": "ppsn"
}
```

Also generate, per task: a personalised **document checklist** (from `document-checklists.txt`) and a calendar `.ics` reminder from the relevant TimelineItem.

## 6. CuratedLink & Glossary & Contact

Small reference entities:

```json
{ "term": "PPSN", "definition": "Personal Public Service Number. Your unique ID for tax..." }
{ "label": "Daft.ie", "url": "https://www.daft.ie", "taskTag": "accommodation", "trustTier": "community", "lastChecked": "2026-06-08" }
{ "name": "Samaritans", "phone": "116 123", "category": "wellbeing" }
```

`trustTier` enum: `official | university | community` — sort official first.

## Relationships (summary)

- `UserProfile` → drives → `TimelineItem[]` (filtered by `appliesTo`) → each references a `TaskGuide`.
- `TaskGuide` ←→ `ForumPost[]` via `taskTag`; ←→ `PrefillTemplate[]` via `relatedGuide`; ←→ `CuratedLink[]` via `taskTag`.
- `Glossary`/`Contact` are global, surfaced as tooltips/panels.

## Import pipeline

1. Parse each `.txt` on the documented `FIELD:` keys (caps prefix) into the schemas above.
2. Validate every entity has `lastVerified`; fail the build if missing.
3. Emit JSON the frontend loads statically (no DB needed for the hackathon demo).
4. Post-MVP: move to Postgres with the same shapes; add auth and an admin editor.
