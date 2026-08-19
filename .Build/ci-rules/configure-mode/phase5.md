# Phase 5 — Save / Load Profile Flow

## Step 0 — Investigate

Confirm whether Phase 2/3's design already makes every edit immediately
persisted (each mutation hits the backend directly, no local-only draft
state) — if so, "save" may not be a distinct action at all, and this phase
is mostly about surfacing completeness/status rather than an explicit save
button. Confirm this against how Phase 3 was actually implemented before
assuming a save step is needed.

## Step 1 — Resume behavior

Since Category A profile data is persisted per-mutation (per Phase 2),
reopening Configuration Mode should always show current real state — no
separate "resume a draft" mechanism needed, unlike the earlier
blueprint-based plan. Confirm this is the actual behavior once Phase 3 is
built, and adjust this phase's scope down if a save/resume mechanism turns
out to be unnecessary.

## Step 2 — Completeness / readiness surfacing

Reuse `school-year-readiness.service.ts`'s existing per-level checks
(department → course/strand-or-level → level → section → subject),
adapted to run against the profile tables instead of real year data, so
the admin can see "College has no courses yet" style feedback while
configuring — mirrors the pattern already used elsewhere in this project
rather than inventing new completeness logic.

## Step 3 — Deselect-department confirmation

Per Phase 2's flag: deselecting a department is destructive (cascades
delete). Add a confirm dialog (reusing `ConfirmDialog.tsx`, matching the
existing pattern from `SeederCard.tsx`'s short-duration school year
confirm) before calling the deselect endpoint if the department has any
edited/added data beyond its original predefined seed.

## Verification

- Confirm reopening Configuration Mode in a new session shows exactly the
  previously edited state, with no data loss.
- Confirm the completeness indicator correctly reflects an intentionally
  partial profile (e.g. College selected but no courses yet) without
  blocking further editing — partial profiles are valid, matching the
  original project's stance on partial config being acceptable.

Stop and report before Phase 6.
