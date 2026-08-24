# Phase 0 — Investigation

No code changes. Output is a written findings report reviewed before Phase 1.

## Category A — structural data shape

- Re-read `backend/src/modules/org-seeder/data/programs.data.ts`,
  `courses.data.ts`, `levels.data.ts`, `strands.data.ts`, and every file
  under `subjects/` — confirm the exact shape of predefined data (field
  names, per-program-type keying) so the profile's editable copy schema
  mirrors it precisely instead of guessing.
- Re-read `frontend/src/components/admin/data-seeder/constants/programs.ts`,
  `sections.ts`, and the level/course/subject-related constants — confirm
  parity with the backend files (same lesson learned as the semester
  template name-drift issue earlier in this project: check, don't assume,
  that frontend and backend predefined data actually match).
- Re-read `ProgramStep.tsx`, `LevelStep.tsx`, `SectionStep.tsx`,
  `StrandStep.tsx`, `CourseStep.tsx`, `SubjectStep.tsx` and
  `useSeedState.ts`'s `setLevelCount`/`renameLevelAt`/`renameLevelSections`
  functions — these already implement rename/add/remove UX for seeder
  selections; confirm how much of this can be reused directly for profile
  editing versus needing a persisted-backed variant.

## Category B — confirm reuse boundaries

- Re-read `GradingScaleRangeEditor.tsx`, `CreateGradingScaleDialog.tsx`,
  and `grading-scale.service.ts` — confirm the editor component is cleanly
  separable from the dialog chrome around it (so Configuration Mode can
  reuse the editor inside different chrome).
- Locate and read the Grading Scheme Template component editor (referenced
  earlier as `GradingSchemeComponentRow.tsx` / `GradingSchemeEditor.tsx` or
  the template-specific equivalent) — same separability check.
- Locate and read the Semester Template item/term editor used by the real
  Semester Settings page (`TemplateFormDialog.tsx` /
  `SemesterTermEditor.tsx` or equivalent) — confirm whether it currently
  assumes a calendar-derived semester count anywhere, since Configuration
  Mode needs a direct-count-entry variant. Per rule 5, if the assumption is
  hardcoded, fix it at the source rather than forking.

## Data Seeder page structure

- Re-read `frontend/src/app/admin/data-seeder/page.tsx` — confirm where a
  mode-switch control fits without disrupting `SeederCard`'s existing
  layout.
- Re-read `useSeederCard.ts` in full (already read once earlier in this
  project, but re-confirm) to identify exactly which pieces of its state
  and query wiring are Seeder-Mode-specific (school year selection, calendar
  config, `seedMutation`) versus reusable for Configuration Mode.

## Deliverable

A findings report covering:

1. Confirmed predefined-data shapes for Category A, with any
   frontend/backend drift flagged explicitly.
2. Confirmed reuse boundaries for the three Category B editors, and whether
   the semester template editor needs a source-level fix for calendar
   assumptions.
3. Recommended mount point for the mode-switch control.
4. Any assumption in `overview.md` that turned out wrong, with the
   correction.

Do not proceed to Phase 1 until this is reviewed.
