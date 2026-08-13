# School Year Readiness Validation — Overview

## What this is

A stricter, structured checklist that must fully pass before a school year can be marked ready/active. All checks are **hard blocks** — no override.

## The checklist (all must pass)

1. **Every `Subject`** scoped to this school year (via its `Program`/`Course`/`Strand`/`Level`, all of which carry `school_year_id`) has **at least one `Class`**
2. **Every `Section`** with `school_year_id` = this year has **at least one `Class`** (`Class.section_id` pointing to it)
3. **Every `Program`** in this school year has a `ProgramCalendar` set up
4. **Every `Program`** has a `ProgramSemesterAssignment` **and** every term in that assignment's template has a corresponding `ProgramSemesterTermDate` with actual start/end dates filled in — template-assigned-but-dates-empty does not pass
5. **Every `Program`** has a `GradingScaleAssignment`
6. **Every `Class`** in this school year has **at least one `GradingScheme`**
7. **Every `Class`** has an educator assigned — `Class.educator_id` is already a required (non-nullable) field in the schema, so this should already be structurally guaranteed. Phase 1 confirms this rather than building new logic for something the database already enforces.

## Behavior

Hard block, not a warning — if any check fails, the school year cannot be marked ready, full stop. The result surfaces as a structured checklist (reusing the visual pattern of the existing `ReadinessDialog.tsx` used for grades), listing exactly what's failing and how many items are affected, not just a generic "not ready" message.

## Phase map

| Phase | Delivers                                                                                                                |
| ----- | ----------------------------------------------------------------------------------------------------------------------- |
| 1     | Backend: the readiness-check service itself (investigate existing mark-ready logic first, extend rather than duplicate) |
| 2     | Backend: wire the check as a hard block into the actual mark-ready endpoint                                             |
| 3     | Frontend: checklist UI, reusing `ReadinessDialog.tsx`'s pattern                                                         |
