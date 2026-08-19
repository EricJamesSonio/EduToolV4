# Rules — School Profile / Configuration Mode Build

Applies across every phase, in addition to the repo-wide TypeScript & ESLint
rules already in force (real types, no unjustified `any`, narrow `unknown`
in catches, `prefer-const`, no `eslint-disable` without cause, scope
discipline, `tsc --noEmit` + `npm run lint` must pass clean).

## 1. Investigate before building

No schema, service, or component code is written before reading the actual
current source of every file it touches. This project has already hit real
bugs from guessing at seeder/service behavior instead of reading it
first — do not repeat that.

## 2. Category A and Category B are architecturally distinct — do not blur them

Structural data (Department/Course/Strand/Level/Section/Subject) gets new,
persisted, org-scoped tables. Global entities (Grading Scale, Grading
Scheme Template, Semester Template) get **no new tables and no new
services** — Configuration Mode is a new UI surface over their existing,
already-hardened CRUD. Do not create a "profile copy" of a Grading Scale or
Semester Template; edit the real row directly, exactly as the real admin
pages already do.

## 3. Predefined seed data is read-only and untouched by Configuration Mode

`org-seeder/data/*.data.ts` and `data-seeder/constants/*.ts` are the
factory-default library. Configuration Mode reads from them once, at the
moment a department is first selected, to seed the profile's editable copy.
It never mutates these files or their in-memory constants. An unselected
department's predefined data must remain fully available and unmodified in
ordinary (non-profile) Seeder Mode at all times.

## 4. Department selection is the only non-editable structural choice

Department toggle is select/deselect only, against the fixed system program
types. No rename, no delete, no admin-invented department types. Every
other structural entity in Category A (Course, Strand, Level, Section,
Subject) is freely rename/add/delete-able once its parent department is
selected.

## 5. Reuse real components for Category B editing

`GradingScaleRangeEditor`, the grading scheme template component editor, and
the semester template item/term editor are reused as-is inside new
Configuration Mode container/page chrome. Do not fork or duplicate their
internal form logic or validation. If a real limitation prevents reuse
(e.g. a component assumes a calendar-derived semester count that
Configuration Mode doesn't have), fix that assumption at its source so both
modes share the same corrected logic — do not branch into two parallel
implementations.

## 6. Semester Template in Configuration Mode never auto-registers

Configuration Mode's semester template editing sets structure only (name,
semester count, term names/counts). It must never write to
`ProgramSemesterAssignment` or `ProgramSemesterTermDate` — those only exist
once a real school year and calendar exist, which is Seeder Mode's job, not
Configuration Mode's.

## 7. Name-based dedup guards apply here too

Any Category B creation flowing through Configuration Mode must go through
the same `findByName`-backed guards already built for Grading Scale, Grading
Scheme Template, and Semester Template. Configuration Mode is not exempt
from the duplication-prevention work already done — it is one more entry
point into the same guarded services.

## 8. Real error messages surface to the admin

As already fixed in the seeder's `onError` handling: never collapse a
backend validation error into a generic "failed" toast. Extract and display
the actual message, narrowing `unknown` safely, with a generic fallback only
for genuinely unexpected error shapes.

## 9. Atomic, reviewable saves

Saving profile edits (Category A) must not leave partial state on failure —
wrap multi-row structural writes in a transaction. Category B edits are
already atomic by virtue of reusing the real single-entity update endpoints.

## 10. Scope discipline

Academic Calendar, class generation, and "how a saved profile accelerates
Seeder Mode" (pre-fill vs. auto-apply) are explicitly deferred. Do not
implement them as part of this plan unless a phase doc says otherwise.

## 11. Real CLI/test output is the only verification that counts

No phase is done until it has been run and produced actual output — agent
self-assessment does not count as proof, per the project's standing
convention.
