# Changelog

<!-- Newest entries at the top. -->

## 2026-09-26

### Performance (8 tickets merged to development, each validated: unit suite at 25 pre-existing failures / same 5 suites, tsc pre-existing set, builds green)

- Perf observability (TICK-INFRA-003, merge 05e6778a): env-gated Prisma query logging, error-inclusive request timing, request-id wiring, DB-ping health check.
- Hot-path indexes (TICK-INFRA-004, merge 72a787a1): 21 indexes incl. Enrollment unique (dup-free); CONCURRENTLY script for prod.
- Grade batching, pure overwrite (TICK-GRADE-003, merge 35f4fab2): parallel terms, Map lookups, chunked batch writes. Locked-skip behavior split to TICK-GRADE-004 (held).
- Mechanical N+1 batching (TICK-INFRA-005, merge e16965a6): 9 modules; email-domain merge conflicts resolved to development's role-prefix rule.
- Pagination + SQL aggregation (TICK-INFRA-006, merge ea66ee99): server-paged logs/notifications, analytics groupBy/aggregate; fixed pre-existing broken educator activity-log unwrapping.
- Eligibility batching (TICK-CLASS-001, merge 8995b2fb): batched structures/scales/prereqs + memoization; EXPLAIN ANALYZE clean on scratch volume (dropped after).
- In-memory read cache (TICK-INFRA-007, merge a84deeae): org/scales/settings/calendar TTLs. Redis/BullMQ parked (no Redis provisioned).
- Frontend cleanup (TICK-INFRA-008, merge 1ae40a1e): overfetch tracker wired, 30s timeout, memoized tables, list-default freshness.

### Held / flagged (not merged)

- TICK-GRADE-004 — bulk compute skips locked grades: ready-for-review, needs human sign-off (behavior change).
- Redis/BullMQ queues: parked pending Redis provisioning + topology/policy decisions (no ticket yet).
- Pre-existing: `next build` red on src/app/admin/page.tsx (server component using client hooks); backend e2e hooks time out in this environment.

## 2026-09-01

### Fixed

- Admin Students filter controls (hierarchy cascade, search + status, review + warning) stacked vertically one-per-row on small screens — now flexible `flex-1 min-w-*` items that line up 2–3 per row on mobile and snap back to the original fixed widths at `sm+` (TICK-STUDENT-001.
- Pre-existing flaky API client overfetch test: `trackCall`/dedup guard only ran when `process.env.NODE_ENV === 'development'`, but Jest locks it to `'test'` (silent no-op,, so the test never exercised the warn path — now also enabled under `'test'` (production unaffected`, fixing the failing `client.test.ts` "warns on overfetch" (same ticket,.

### Tickets

- TICK-STUDENT-001 — Admin Students filter responsive mobile layout — merged (merge 28570e45, commits 6c244e4e fix(admin:…), 28570e45 fix(api:…)..

 See also TICK-ORG-001 (below,) TICK-INFRA-002, TICK-PLATFORM-001.



## 2026-08-27

### Added

- Organization schedule settings as tab on Organization page: global 07:00-17:00/30 (durations 15,20,25,30,45,60), preview slots, strict blocking on update if any ClassSchedule out-of-bounds/misaligned, ClassSchedulePicker now drives grid from config (TICK-ORG-001).

### Tickets

- TICK-ORG-001 — Organization schedule time-range settings (global) — merged (merge 4d0d8f51, commit 3b1996c0)
- TICK-PLATFORM-001 — Fix missing React Query invalidations — ready-for-review (4ce84a30)

### Commits

- 3b1996c0 feat(org): add global schedule time-range settings as Organization tab
- 4d0d8f51 merge(agent): TICK-ORG-001 org schedule settings

## 2026-08-26

### Fixed

- Frontend mojibake normalization: corrected UTF-8 double-encoded glyphs (— U+2014, – U+2013, … U+2026, → U+2192, − U+2212, ─ U+2500) across 5 files (SolutionSection, ResourcesSection, ProgramLevelsSection, SchoolProfileCard, SeederCard) — 30 hits, 0 remaining `â` (TICK-INFRA-002).

### Tickets

- TICK-INFRA-002 — Fix frontend mojibake (em dash, en dash, ellipsis, arrow) — completed (merge 00dfabe0 + fdad3e40)

### Commits

- fdad3e40 fix(frontend): normalize mojibake glyphs to correct UTF-8 (5 files, 30 insertions, 30 deletions)
- 00dfabe0 merge(agent): TICK-INFRA-002 fix frontend mojibake

## YYYY-MM-DD

### Added

-

### Fixed

-

### Changed

-

### Tickets

-

### Commits

-
