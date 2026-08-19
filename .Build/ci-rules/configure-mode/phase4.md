# Phase 3 — Frontend: Mode Switch + Structural Steps

## Step 0 — Investigate

Confirm Phase 0's finding on where the mode switch mounts, and re-read
`SeederCard.tsx`'s current top-level structure fresh before editing it.

## Step 1 — Mode switch

A simple toggle/tab control on `data-seeder/page.tsx` or at the top of
`SeederCard.tsx` — "Seed a School Year" vs. "Configure School Profile".
Switching modes swaps which set of steps/state renders; it does not unmount
in a way that loses in-progress Seeder Mode selections carelessly — confirm
UX expectation (likely fine to reset Seeder Mode's ephemeral selections
when switching away, since nothing is persisted there until "Apply Seed"
anyway, matching how the existing `NavigationGuardContext` already treats
in-progress seeder state as abandonable-with-warning).

## Step 2 — Profile-aware hook

New `useSchoolProfile.ts` hook (mirroring `useSeederCard.ts`'s shape but
backed by the Phase 2 endpoints instead of `useSeedState`'s local-only
state): fetches the current profile tree, exposes select/deselect
department, and CRUD mutations for course/strand/level/section/subject,
each invalidating the profile query on success.

## Step 3 — Department step (profile variant)

Reuses `ProgramStep.tsx`'s presentation but wires selection directly to
Phase 2's select/deselect endpoints instead of local `Set` state — matches
rule 4 (toggle-only, no rename/delete).

## Step 4 — Course/Strand/Level/Section/Subject steps (profile variant)

These need real add/rename/delete UI, not just the seeder's
select-from-predefined-list UX. Reuse as much of `LevelStep.tsx`'s
existing rename/count-adjustment interaction pattern as fits (per Phase 0's
findings on reuse feasibility), but wire mutations to the Phase 2 CRUD
endpoints instead of local state setters. Only render for departments that
are currently selected in the profile.

## Verification

- Manually walk: switch to Configuration Mode → select a department →
  confirm its predefined courses/levels/subjects appear editable → rename
  one → refresh the page → confirm the rename persisted (this is the real
  test that Category A data is now truly persisted, not local seeder
  state).
- Confirm Seeder Mode is completely unaffected — run through a normal seed
  end-to-end to confirm no regression.

Stop and report before Phase 4.
