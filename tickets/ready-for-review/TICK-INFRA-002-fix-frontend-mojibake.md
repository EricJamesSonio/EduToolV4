# TICK-INFRA-002 — Fix frontend mojibake (em dash, en dash, ellipsis, arrow)

Status: ready-for-review
Priority: high
Created: 2026-08-26
Created by: agent
Assigned to: agent
Started: 2026-08-26
Worktree: ../EduToolV4-worktrees/TICK-INFRA-002-fix-frontend-mojibake
Branch: agent/TICK-INFRA-002-fix-frontend-mojibake

## Problem

Frontend texts/titles render mojibake due to UTF-8 double-encoded as Windows-1252. Observed in SolutionSection.tsx screenshot: \operatesâ€”quickly\ and \Kâ€“12\ etc. Grep found 30 hits across 5 files, 14 user-visible strings broken (em dash —, en dash –, ellipsis …, arrow →, minus −, box ─).

## Goal

1. Normalize all frontend text glyphs to correct UTF-8 (— U+2014, – U+2013, … U+2026, → U+2192, − U+2212, ─ U+2500)
2. Zero \â\ mojibake hits in frontend/src after fix
3. No visual regression, lint/typecheck/build pass

## Relevant Areas

- shared/skills/frontend/MUST-HAVES.md
- frontend/src/components/landing/SolutionSection.tsx
- frontend/src/components/landing/ResourcesSection.tsx
- frontend/src/components/admin/program/ProgramLevelsSection.tsx
- frontend/src/components/admin/school-profile/SchoolProfileCard.tsx
- frontend/src/components/admin/data-seeder/SeederCard.tsx

## Acceptance Criteria

- [x] All 6 user-visible strings in SolutionSection (operates—quickly, K–12, place—without, confidence—without, experience—no, role—whether) render correctly
- [x] ResourcesSection Learn More → renders correctly
- [x] ProgramLevelsSection Adding… and − render correctly
- [x] SchoolProfileCard Loading… , Level — Sections/Subjects, dialog — render correctly
- [x] SeederCard dialog — renders correctly
- [x] Comment dividers ── normalized
- [x] `grep -r â frontend/src` returns 0 hits
- [x] `npm run lint` and `tsc --noEmit` pass in frontend worktree (next build skipped — symlink turbopack limitation, irrelevant to text fix)

## Confidence

Score: 95/100
- Requirement clarity: 95 (screenshot + file example given)
- Codebase verification: 98 (hex dump confirmed C3A2 double-encode, 30 hits enumerated via node scan, 5 files isolated)
- Architecture fit: 95 (pure text encoding fix, no logic change)
- Edge cases: 90 (only â-lead mojibake present; no Ã/Â remnants found)
No assumption in 80–94 band; no auth/tenant/grading/migration touched.

## Tests

- Targeted: lint --silent passed (0 errors on 5 files), tsc --noEmit passed (0 errors), mojibake grep 0 hits
- Full suite: not run (frontend typecheck passed, next build skipped due to turbopack symlink outside root — lint/typecheck are the relevant gates for this pure-text fix)
- Development integration: not run

## Blocker

None.

## Activity Log

2026-08-26 — Claimed, created worktree agent/TICK-INFRA-002-fix-frontend-mojibake from development.
2026-08-26 — Fixed 5 files via 6 mojibake mappings (e2 20ac 201d→—, e2 20ac 201c→–, e2 20ac a6→…, e2 2020 2019→→, e2 02c6 2019→−, e2 201d 20ac→─), verified 0 â hits, lint/typecheck passed, committed fdad3e40.
2026-08-26 — Ready for review.

## Commits

- fdad3e40 fix(frontend): normalize mojibake glyphs to correct UTF-8 (5 files, 30 insertions, 30 deletions)

## Notes

None yet.
