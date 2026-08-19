# Phase 2 — Config Mode Shell (Frontend)

## Step 0 — Investigate

Read `frontend/src/app/admin/layout.tsx`, `AdminSidebar.tsx`, and
`frontend/src/context/*` to confirm the cleanest place to mount a provider that wraps
all admin routes without disrupting existing layout/auth logic.

## Step 1 — Step registry (single source of truth)

```ts
// frontend/src/config/school-config-steps.ts
export const SCHOOL_CONFIG_STEPS = [
  {
    key: "department",
    route: "/admin/programs",
    note: "Create your departments here. Click into a department to add courses/strands, levels, and sections — see the buttons on that page.",
  },
  {
    key: "subject",
    route: "/admin/subjects",
    note: "Add subjects for your levels here.",
  },
  {
    key: "gradingScale",
    route: "/admin/grading-scales",
    note: "Create a grading scale and assign it to your departments.",
  },
  {
    key: "gradingScheme",
    route: "/admin/grading-schemes",
    note: "Set up grading scheme templates for later use.",
  },
  {
    key: "semesterTemplate",
    route: "/admin/semester-settings",
    note: "Create a semester template and assign it to your departments.",
  },
] as const;
```

This array is the only place step order, routes, and copy live. Nothing else hardcodes
step order.

## Step 2 — `ConfigModeProvider`

- Context holds: `isActive`, `blueprintSchoolYearId`, `currentStepIndex`,
  `tutorialEnabled` (fetched from org settings), `exit()` (opens confirm modal),
  `advance()` (Done/Skip → next step, or finish flow at last step).
- `currentStepIndex` is **client-only, session state** — not persisted, since resuming
  always restarts at step 0 per the agreed design (rule 4). Completed/skipped-step data
  used for the Done/Skip label comes from live readiness checks (Phase 3), not from a
  stored pointer.
- Mounted once in the admin layout; renders children normally when `isActive` is false
  (zero visual/behavioral change to any page outside config mode).

## Step 3 — Route guard

- A hook (`useConfigModeRouteGuard`) run at the top of the admin layout: if
  `isActive` and the current pathname doesn't match `SCHOOL_CONFIG_STEPS[currentStepIndex].route`
  (allowing for nested detail routes under it, e.g. `/admin/programs/[id]`), redirect back
  to the step's route and show a toast ("Finish this step first, or exit configuration").
- Sidebar links outside the current step's section are visually disabled (not removed)
  while config mode is active, matching existing patterns for disabled nav (check
  `AdminSidebar.tsx` for an existing disabled-state pattern before inventing one).

## Step 4 — Floating step widget

A single fixed-position component, rendered by `ConfigModeProvider` above page content:

- Step indicator (e.g. "Step 2 of 5 — Subjects").
- Tutorial note text (only rendered if `tutorialEnabled`), static copy from the registry.
- One button, label computed by Phase 3's readiness check: "Skip" or "Done".
- "Exit configuration" control, opening a confirm modal with the single message agreed:
  progress is saved, resumable later. On confirm, exits config mode and navigates to
  `/admin/school-years`.
- No back-button-in-flow control (rule 7) — natural in-page navigation only.

## Step 5 — Org-level tutorial toggle

- Backend: single `tutorial_mode_enabled` boolean field on whatever model Phase 0
  determined is cleanest (likely `OrgEnrollmentSetting` or a new minimal org-settings
  row), default `true`.
- Frontend: a toggle exposed somewhere sensible (e.g. inside the floating widget itself,
  or the school-years empty-state entry screen) that calls a simple update endpoint.
  Toggling it only hides note text — verify it does not affect route guard or Done/Skip
  logic (rule 10).

## Verification

- Enter config mode, confirm every non-step route is blocked with a toast.
- Confirm exiting mid-flow and re-entering always lands back on Department (step 0),
  with previously created data visible on that page (this comes for free since the
  blueprint's real rows already exist — just confirm nothing clears them).
- Confirm tutorial toggle hides only the note text, nothing else.

Stop and report before Phase 3.
