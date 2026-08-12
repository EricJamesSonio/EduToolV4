# Phase 6 — Frontend: Change Personal Email UI

## Goal

A small, self-service section in account settings (available to admin, educator, and student alike) to change personal email, OTP-verified.

## Steps

1. **Investigate first.** Find each role's existing profile/settings page (`admin/profile/page.tsx`, `educator/profile/page.tsx`, `student/profile/page.tsx`) and `components/shared/ProfileContent.tsx` — since the name suggests this is likely already a shared component all three roles use. If so, add this feature there once, not three times.

2. **Component**: a small inline section or dialog — "Personal Email" with current value shown (or "not set"), an "Change" action opening a two-step flow: (1) new Gmail input + "Send code" — client-side `@gmail.com` format check first, then calls `change-request`; (2) OTP input + "Verify & Save" — calls `change-verify`. Show the backend's specific error messages directly (already-in-use, race-condition-claimed) rather than generic failure text.

3. **API layer**: add the two calls to wherever `profile.api.ts` already lives.

## Acceptance check

- All three roles can reach and use this from their own profile page, via one shared component, not three separate implementations
- Attempting to set an already-in-use email shows the specific backend error before any OTP is sent
- Successful change updates the displayed personal email immediately after verify

---

## AI Prompt

```
Context: EduTool frontend (Next.js). Backend change-email endpoints exist
(Phase 4).

Step 1 — investigate: check frontend/src/components/shared/ProfileContent.tsx
and each role's profile page (admin/profile/page.tsx, educator/profile/page.tsx,
student/profile/page.tsx). Report whether ProfileContent.tsx is already a
shared component used by all three, since that's the natural place to add
this feature once rather than duplicating it three times.

Step 2: Build the personal-email change UI (in ProfileContent.tsx if
confirmed shared, otherwise report the actual structure found and adjust
placement accordingly): shows current personal email or "not set", a
"Change" action, two-step flow — new Gmail input with client-side @gmail.com
format validation + "Send code" button, then OTP input + "Verify & Save"
button. Surface the backend's specific error messages (already-in-use,
race-condition-claimed-during-verify) directly to the user rather than a
generic "something went wrong."

Step 3: Add the two API calls (change-request, change-verify) to
frontend/src/api/profile.api.ts.

Show me your Step 1 findings first, then diffs.
```
