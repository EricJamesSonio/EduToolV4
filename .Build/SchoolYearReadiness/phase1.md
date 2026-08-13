# Phase 1 — Backend: Readiness Check Service

## Goal

The actual validation logic — one service method returning a structured checklist result, covering all seven criteria from the overview.

## Steps

1. **Investigate first.** Read `school-year.service.ts` and `school-year.controller.ts` in full. Find whether a "mark ready"/status-transition action already exists (e.g. `pending` → `active`) and whether any validation already runs there. Report exactly what exists before adding anything — this phase extends or builds fresh depending on what's found, not a guaranteed net-new build.

2. **Method**: `checkSchoolYearReadiness(schoolYearId: string, orgId: string): Promise<ReadinessResult>` in `school-year.service.ts` (or a new `school-year-readiness.service.ts` if the existing file is already large — check its current size/structure before deciding).

   ```ts
   interface ReadinessIssue {
     code: string; // e.g. 'subjects_without_classes'
     message: string; // human-readable summary
     count: number; // how many entities are affected
     entities?: { id: string; name: string }[]; // optional detail list, capped reasonably (e.g. first 10)
   }

   interface ReadinessResult {
     ready: boolean;
     issues: ReadinessIssue[];
   }
   ```

3. **Implement each check** as its own private method, each contributing zero or one `ReadinessIssue` to the result:
   - `checkSubjectsHaveClasses` — subjects belonging (via program/course/strand/level) to this school year, with zero `Class` rows
   - `checkSectionsHaveClasses` — sections with `school_year_id` = this year, with zero `Class` rows referencing them
   - `checkProgramCalendars` — programs in this school year missing a `ProgramCalendar`
   - `checkSemesterSettings` — programs missing a `ProgramSemesterAssignment`, OR whose assignment's template terms don't all have a corresponding `ProgramSemesterTermDate` with non-null `start_date`/`end_date`
   - `checkGradingScaleAssignments` — programs missing a `GradingScaleAssignment`
   - `checkClassesHaveGradingSchemes` — classes in this school year with zero `GradingScheme` rows
   - `checkClassesHaveEducators` — this should always pass given `Class.educator_id` is non-nullable in the schema; implement it as a defensive query anyway (cheap, and catches any future schema drift), but don't build elaborate handling around a case that shouldn't be reachable

4. Use efficient queries — for each check, one query that finds the _missing_ set directly (e.g. `Section` where no related `Class` exists), not "fetch everything then filter in JS." Check `section.repository.ts` or similar for how existing queries in this codebase express "entity with no related X" (`none: {}` in Prisma, or a raw count comparison) and follow that convention.

## Acceptance check

- A school year with every check passing returns `{ ready: true, issues: [] }`
- A school year missing e.g. grading schemes on 3 classes returns an issue with `count: 3` and the specific class ids/names (capped list)
- Running this on a school year with zero programs/sections/subjects doesn't crash — decide and document whether an empty school year counts as "ready" (no violations because there's nothing to violate) or as failing (nothing has been set up at all) — default to **not ready**, since a school year with nothing configured yet clearly isn't ready for use even though it technically has zero violations of each rule; call this out explicitly as a deliberate design choice in your implementation, not an oversight

---

## AI Prompt

```
Context: EduTool backend (NestJS + Prisma). Building a school year readiness
validator with 7 checks, all hard-block (no override).

Step 1 — investigate: read school-year.service.ts and school-year.controller.ts
in full. Find whether a mark-ready/status-transition action already exists and
whether it has any existing validation. Report findings before writing code.

Step 2: Implement checkSchoolYearReadiness(schoolYearId, orgId): Promise<ReadinessResult>
per the interfaces and seven checks in this phase doc, in school-year.service.ts
or a new school-year-readiness.service.ts (decide based on the existing file's
size — report your choice and why).

Each check should use a direct "find the missing set" query (e.g. Prisma's
`none: {}` relation filter), not fetch-everything-then-filter-in-JS. Check
how existing repositories in this codebase express similar "entity with no
related X" queries and follow that convention.

Explicitly handle the empty-school-year edge case: a school year with zero
programs/sections/subjects should be treated as NOT ready (nothing has been
configured), not vacuously ready just because there are no rule violations —
implement this deliberately and note it in your response.

The educator-assignment check (checkClassesHaveEducators) should be a simple
defensive query — Class.educator_id is already non-nullable in the schema, so
this is confirming an existing guarantee, not building new enforcement.

Show me your Step 1 findings, then your planned file structure, then diffs.
```
