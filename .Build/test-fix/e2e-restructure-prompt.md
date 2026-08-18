# Task: restructure admin-setup.spec.ts so enrollment writes run after readiness is met

## Do NOT start this until backend-fix.md has been implemented, verified, and confirmed working.

This restructuring assumes `POST /school-years/:id/enrollments`,
`POST /school-years/:id/enrollments/students/:studentId/programs`, and
`PATCH /school-years/:id/enrollments/programs/:programEnrollmentId` now 400 with
`SCHOOL_YEAR_NOT_READY` when the school year isn't fully ready. If that isn't live yet,
every test below that calls those endpoints will fail for the wrong reason.

## Step 0 — Investigate first

Read `frontend/e2e/admin-setup.spec.ts` in full — it's referenced throughout this prompt
by test title, not reproduced here. Confirm the test titles below match exactly what's in
the file; if any have drifted, stop and report before editing.

## Why this reorder is necessary (context, not something to re-derive)

`assertReady` checks ORG-WIDE readiness: every program's calendar, grading scale, semester
assignment with complete term dates; every section has a class; every subject has a class.
That checklist isn't satisfied until the JHS-levels-2/3 setup AND the full elementary
department setup (both currently embedded inside the "Phase 7b" test) have run. Three other
tests call the now-gated endpoints BEFORE that point in the current file order:

- "Phase 2 — students enrolled in the school year with program + section (API)"
- "Phase 2 — class enrollment is gated on academic placement (API)" (depends on the one above)
- "Phase 7 — class enrollment lifecycle..." (calls `placeJhsStudent`, which enrolls via the
  gated endpoints, for student4/student5)
  All three must move to run after readiness is complete.

## Step 1 — Split "Phase 7b" into three pieces, don't duplicate its setup logic

The current single test titled
`"Phase 7b — enrollment locked until SY ready; wizard places student dept → level → section → class (UI)"`
contains 11 `test.step` blocks. Split them as follows — this is a cut/move, not a rewrite;
preserve each step's body exactly as written.

**New test A** — insert immediately after the existing `"Phase 6 — JHS semester template
created and assigned with term dates"` test:

```ts
test("Phase 6b — readiness gate: school year not ready before full setup", async ({
  page,
  request,
}) => {
  // body = step 1 from the original Phase 7b test, VERBATIM:
  // "readiness gate: school year not ready, wizard locked in the UI"
});
```

**New test B** — immediately after Phase 6b:

```ts
test("Phase 6c — complete school-year readiness (JHS levels 2-3 + elementary department)", async ({
  page,
  request,
}) => {
  // body = steps 2, 3, and 4 from the original Phase 7b test, VERBATIM, in order:
  // "readiness: add sections/subjects/classes for JHS levels 2 and 3"
  // "readiness: complete the elementary department setup"
  // "readiness gate: the school year is now ready"
});
```

Both new tests need their own copies of the helper functions `unwrapList`, `createSection`,
`createSubject`, `createClass` (currently defined once at the top of the original Phase 7b
test and shared by closure across all its steps). Since Phase 6c's steps use these helpers
and the remaining Phase 7b content (Step 2 below) also still needs `createSubject` and
`createClass`, hoist these four functions out of the test body to **module scope** (top of
the file, alongside the existing `openDialog` helper) rather than duplicating them. They
already take `request`/`headers` implicitly via closure in the original — refactor them to
accept `request: APIRequestContext` and `headers: { Authorization: string }` as explicit
parameters so they work as free functions called from any test:

```ts
const unwrapList = async <T>(res: APIResponse): Promise<T[]> => {
  /* unchanged body */
};

const createSection = async (
  request: APIRequestContext,
  headers: { Authorization: string },
  levelId: string,
  baseName: string,
): Promise<string> => {
  /* unchanged body, request/headers now params not closure */
};

const createSubject = async (
  request: APIRequestContext,
  headers: { Authorization: string },
  baseName: string,
  opts: { programId?: string; levelId?: string } = {},
): Promise<{ id: string; title: string }> => {
  /* unchanged body */
};

const createClass = async (
  request: APIRequestContext,
  headers: { Authorization: string },
  subjectId: string,
  sectionId?: string,
): Promise<string> => {
  /* unchanged body */
};
```

Update every call site (inside Phase 6c and inside the remaining Phase 7b content) to pass
`request, headers` as the first two arguments instead of relying on closure. Do NOT merge
these with Phase 7's own local `createClass`/`createSubject` — those have a different
signature (explicit `weekday` param) and are staying local per the existing convention of not
force-unifying helpers across unrelated tests.

**Phase 7b keeps its title and content for steps 5–11** (`"wizard fixtures..."` through
`"verify: student6 is placed..."`), unchanged internally — only its position in the file
moves. It no longer needs its own setup because Phase 6c already did it.

## Step 2 — Move two Phase 2 tests to after Phase 6c

Cut these two tests entirely from their current position inside the Phase 2 block:

- `"Phase 2 — students enrolled in the school year with program + section (API)"`
- `"Phase 2 — class enrollment is gated on academic placement (API)"`

Paste them, in the same relative order, immediately after Phase 6c and immediately before
Phase 7. Rename their titles to reflect the new position (content unchanged):

- `"Phase 6d — students enrolled in the school year with program + section (API)"`
- `"Phase 6e — class enrollment is gated on academic placement (API)"`

Update their `console.log` tag prefixes to match (`[Phase 6d]` / `[Phase 6e]`) if they log
anything — check both bodies for a trailing `console.log` call and update the bracket tag,
not the message content.

## Step 3 — Final file order (top to bottom)

```
Phase 0 — smoke
Phase 1 — platform → admin → org → school year
Phase 2 — email extension (UI)
Phase 2 — department + generated levels (UI), readiness ordering (API)
Phase 2 — section for the generated JHS level (UI)
Phase 2 — educator account with extension-derived email (UI)
Phase 2 — subject, semester, and class created and linked (API + UI)
Phase 2 — educator role cannot create classes (RBAC)
Phase 3 — grading scale created (UI) and assigned to the JHS department
Phase 4 — grading scheme template created (UI) and applied to the JHS program
Phase 5 — JHS department calendar with two semester breaks
Phase 6 — JHS semester template created and assigned with term dates
Phase 6b — readiness gate: school year not ready before full setup          [NEW]
Phase 6c — complete school-year readiness (JHS levels 2-3 + elementary dept) [NEW]
Phase 6d — students enrolled in the school year with program + section      [MOVED]
Phase 6e — class enrollment is gated on academic placement                  [MOVED]
Phase 7 — class enrollment lifecycle: gating, duplicates, capacity, year-end
Phase 7b — wizard places student dept → level → section → class (UI)       [TRIMMED]
```

Check every test after Phase 2's remaining tests for references to `run.student1`,
`run.programEnrollmentId`, or `run.classItem` fields that used to be populated by the
now-moved Phase 2 tests — confirm nothing between the OLD position of those tests and their
NEW position tries to read fields they set. (Phase 2's "class + subject" test and the RBAC
test don't touch student1's enrollment state, so this should be clean — but verify, don't
assume.)

## Step 4 — Verify

```
cd frontend
npm run test:e2e:headed
```

All 16 (now still 16 — same test count, just reordered/retitled/split into 3 where 7b was 1)
must pass in the new order. Confirm the console log lines print in the new sequence
(`[Phase 1]` → `[Phase 2]` → `[Phase 3]` → `[Phase 4]` → `[Phase 5]` → `[Phase 6]` →
readiness-not-ready assertion → readiness-setup → `[Phase 6d]`/`[Phase 6e]` output →
`[Phase 7]` → `[Phase 7b]`).

Report back:

1. Whether the circular-DI check in backend-fix.md Step 0 required `forwardRef`
2. Full order of test titles as they now appear in the file (paste the `describe`/test list)
3. Full `npm run test:e2e:headed` output
4. Any test that needed changes beyond what's specified here — do not silently patch and
   move on; report what broke and why before fixing it, since an unexpected break here
   likely means a dependency this prompt didn't account for.
