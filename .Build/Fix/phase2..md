# Phase 2 — Backend: Remove Org Auto-Creation on Admin Approval

## Goal

Approving an admin request creates the `Account` + `Profile` only. No `Organization` gets created automatically — the admin creates it themselves after logging in.

## Steps

1. **Investigate first.** Re-read the current approval logic in `platform-registration.service.ts` (built in the Admin Account Request feature's Phase 3) — find exactly where `Organization` creation happens in that flow.

2. **Remove** the `Organization`-creation step from approval. The created `Account` should have `org_id: null` (already nullable in the schema — no schema change needed here).

3. **Confirm the existing org-setup trigger works off this state.** Investigate `OrganizationSetupForm.tsx` / `OrganizationRequiredDialog.tsx` and whatever currently checks for `org_id: null` to decide when to show it (likely `OrganizationGuardContext.tsx`, given its name). Confirm this will naturally fire for a freshly-approved admin without any additional wiring — if it won't (e.g. it's currently only reachable from a specific route rather than a global guard), report that gap rather than silently building a workaround.

## Acceptance check

- Approving an admin request creates exactly one `Account` (`org_id: null`) and one `Profile` — no `Organization` row
- Logging in as that new admin triggers the existing org-setup flow without needing new frontend code in this phase (confirmed by investigation, not assumed)

---

## AI Prompt

```
Context: EduTool backend (NestJS). The Admin Account Request feature's
approval flow currently auto-creates an Organization on approval — this needs
to stop.

Step 1 — investigate: read the current approval logic in
platform-registration.service.ts. Find exactly where Organization gets
created in that flow. Report the exact code location.

Step 2: Remove that Organization-creation step. The Account created on
approval should have org_id: null (already nullable, no schema change here).

Step 3 — investigate: read frontend/src/context/OrganizationGuardContext.tsx
and components/shared/OrganizationSetupForm.tsx / OrganizationRequiredDialog.tsx.
Report whether the existing mechanism already triggers org-setup for any
admin account with org_id: null regardless of how they got there, or whether
it's currently only reachable from specific existing routes. This is a
report-only step for this phase — do not modify frontend files yet, just
confirm whether Phase 5 (frontend) will need actual wiring work or whether
this already works automatically.

Show me your Step 1 findings, the diff for Step 2, and your Step 3 report.
```
