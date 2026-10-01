# TICK-CLASS-003 — Automated class generator, phases 5-8

Status: ready-for-review
Priority: high
Created: 2026-09-30
Created by: agent
Assigned to: agent
Started: 2026-09-30
Branch: development (owner-directed; no feature worktree)
Plans: auto-class/phase-5..8
Commits: 123dbfb1 (p5), 9711a3bd (p6), a29ac96c (p7), 7228a146 + 28445124 (p8)

## Goal

Finish the generator: a shared conflict engine, a planner that previews before
writing, an admin button on the Classes page, and a seeded org that can use it.

## Owner decisions taken (2026-09-30, disclosed rather than blocking)

- **D2 conflict scope:** school-year remains the DEFAULT, unchanged from manual
  creation, but it is now a PARAMETER ('school-year' | 'semester'). Not flipped
  silently.
- **D6 hard vs warn:** structural conflicts are hard; missing optional config
  is a warning. A school with no teachable subjects still generates, falling
  back to any available educator with a per-item warning. This is what makes
  the feature usable on day one, matching "optional to use".
- **Default weekdays:** all seven (from TICK-ORG-002). Consequently the seeder's
  Sun-Thu `SCHEDULE_WEEKDAYS` is valid as-is and needed no change.

## Acceptance Criteria

- [x] Conflict rules extracted and shared by manual creation and the generator
- [x] One occupancy query per scope instead of one per resource per slot
- [x] `preview` writes nothing
- [x] `commit` writes through `ClassService.create`, inheriting every invariant
- [x] Placement never uses a non-school day or crosses a break
- [x] Items in one batch cannot collide with each other
- [x] Unplaceable items are reported, never silently dropped
- [x] Commit requires explicit confirmation and re-checks org ownership
- [x] Readiness report shown while configuring, before any write
- [x] Auto-generate button on the admin Classes page
- [x] Seeded orgs have teachable-subject links
- [x] Nest DI graph boots

## Confidence

- Score: 90%
- Measured:
  - backend `tsc --noEmit`: 0 errors; `nest build` compiles (610 files)
  - backend unit: 1087 passing (baseline at Phase 1 start was 964, so +123)
  - failing set unchanged throughout: same 7 pre-existing suites / 24 tests
  - frontend `tsc`: unchanged at its 20-error pre-existing baseline; 270/270
  - Nest DI graph boots and `ClassGeneratorService` resolves
  - eslint clean on all touched files

## Tests

- `class-conflict.util.spec.ts` (11): overlap semantics incl. adjacency, day and
  break rules, all three booking conflicts, excludeClassId, no-section case,
  ALL conflicts returned not just the first
- `class-generator.service.spec.ts` (24): readiness blockers vs warnings,
  distinct-day placement, never a non-school day, never across a break,
  educator availability respected, subject preference preferred, fallback
  warning, existing-booking avoidance, no self-collision between items,
  unplaced reason, item cap, level matching, preview writes nothing, commit
  routes through ClassService, HH:mm shape, per-item failure isolation

## Blocker

None.

## Activity Log

2026-09-30 — Phases 5-8 implemented.

2026-09-30 — Three real defects found and fixed during verification:
- `OrgScheduleConfigProvider` was consumed via `import type`, so
  `emitDecoratorMetadata` emitted an `Object` token and Nest could not resolve
  it at boot. **Neither `tsc` nor any unit test caught this** — only booting
  the Nest application context did. It is now an abstract class bound with
  `useExisting`. This is why the DI check is now part of the verification set.
- A generator test asserted no slot could land on a day with an existing
  booking. That was MY test being wrong, not the code: 07:00-08:00 does not
  overlap an 08:00-16:00 booking. Rewritten to assert non-overlap.
- The "no educator is set to teach this subject" warning only fired when
  placement FAILED. It now fires whenever the fallback was used, so an admin
  always knows the assignment ignored their subject preferences.

## Commits

- 123dbfb1 — refactor(class): extract a shared conflict engine
- 9711a3bd — feat(class-generator): plan, preview and commit automated class generation
- a29ac96c — feat(classes): Auto-generate button and dialog on the admin classes page
- 7228a146 — feat(seeds): teachable subject links so a seeded org can generate
- 28445124 — chore(class-generator): drop two unused DTO imports

## Notes

**Greedy placement, not optimal.** The planner is greedy: it walks subjects and
sections in order and takes the first viable slot, preferring distinct days and
the scarcest eligible educator. That is deterministic and fast, and produces
good results for realistic inputs, but it is not a solver — a pathological input
could place later items worse than an optimal assignment would. Worth knowing
before anyone treats the output as "the best possible timetable".

**Rooms are not auto-assigned.** The plan books no rooms. Rooms stay optional
and best-effort per the auto-class plan's decision D5, so room conflicts cannot
block generation.

**Not done:** the manual class dialog still does not show a "suggested"
educator from teachable subjects, even though `useSubjectEducators` exists for
it. It shares the same dialog the generator UI would extend, so it belongs with
that work rather than here.
