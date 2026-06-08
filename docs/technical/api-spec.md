# API Spec (lightweight)

For the hackathon demo, content is **static JSON** — no API needed for guides, timeline, or prefill. This spec defines (a) the read shape of the static content bundle, and (b) the small REST API the production app needs for the parts that write: profile and forum. Keep it small; grow later.

Base URL (production): `/api/v1`. All responses JSON. Auth via bearer token (post-MVP).

## A. Static content (no server)

Served as files, loaded once on app start.

```
GET /content/guides.json        → TaskGuide[]
GET /content/timeline.json      → TimelineItem[]
GET /content/templates.json     → PrefillTemplate[]
GET /content/forum-seed.json    → ForumPost[]   (isSeed: true)
GET /content/glossary.json      → Glossary[]
GET /content/links.json         → CuratedLink[]
GET /content/contacts.json      → Contact[]
```

Schemas: see `data-model.md`. These are read-only and cacheable (long TTL + content hash in filename).

## B. Profile API (post-MVP)

Profile can live entirely client-side for the demo. When persisted:

```
POST   /profile            create profile           body: UserProfile.core + extended
GET    /profile/:id        fetch profile
PATCH  /profile/:id        update fields
DELETE /profile/:id        delete all data (GDPR)
POST   /profile/:id/derive recompute derived flags  → { derived }
```

Rules: encrypt `passportNumber`/`dateOfBirth`; never return them in logs; `DELETE` is a hard delete.

## C. Timeline (derived, optional server)

The engine is client-side, but expose it server-side too if you want shareable links:

```
POST /timeline/compute
  body: { arrivalDate, courseStart, nationalityClass, visaStamp, willWork }
  →     TimelineItem[] with computed { dueDate, hardDeadline, blockedBy }
```

## D. Forum API (post-MVP)

```
GET    /forum/posts?tag=irp&sort=top      → ForumPost[]   (paginated)
GET    /forum/posts/:id                   → ForumPost
POST   /forum/posts                       create post     body: { taskTag, title, body }
POST   /forum/posts/:id/upvote            toggle upvote   → { upvotes }
POST   /forum/posts/:id/report            flag post       body: { reason }
PATCH  /forum/posts/:id   (moderator)     set status      body: { status }
```

- New posts default to `status: "pending"` if you pre-moderate, or `"published"` with post-hoc moderation (decide in the moderation policy).
- `report` feeds the moderation queue.

## E. Content feedback (optional)

Lets users flag stale guide info — feeds the content-governance verify queue:

```
POST /guides/:id/flag    body: { field, note }   → { received: true }
```

## Conventions
- Errors: `{ "error": { "code": "...", "message": "..." } }` with standard HTTP status codes.
- Pagination: `?page=1&pageSize=20`, response `{ items, page, total }`.
- Dates: ISO-8601 UTC.
- Versioning: path-based (`/v1`).

## What to build for the demo
Nothing here is required to demo the three pillars — static JSON + client-side engines cover it. Implement **C (compute)** only if you want shareable timelines, and **D (forum)** with an in-memory store to make posting feel live. Profile (B) and persistence come after the hackathon.
