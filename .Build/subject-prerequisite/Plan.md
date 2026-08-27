# Planning — Subject Prerequisites (Soft Warning + Admin Override)

**Mode:** plan → phased implementation (single worktree, phases executed sequentially — not separate tickets unless Phase 3 proves too large, see note at bottom)
**Wiring:** AGENTS.md:1 → CORE.md:1 (Part 0 wiring verified, Part 1 always-active, Part 2 routing: database/MUST-HAVES §Grading, architecture.md, testing/MUST-HAVES). Codebase read is source of truth.

**Worktree:** `../EduToolV4-worktrees/TICK-PREREQ-001`
**Branch:** `agent/TICK-PREREQ-001` from `development`

---

## 1. Problem framing

Subjects currently have no prerequisite relationship. For irregular students especially, some subjects should warn the student and admin when a required prior subject was never taken or was failed — but this must never hard-block. The student can still request the class; the admin reviews the warning and can approve as an override. This is new functionality, not a fix to existing broken behavior — no existing code assumes prerequisites exist today.

## 2. Decisions locked (do not re-litigate)

1. Prerequisites are managed independently of subject/class creation — assigned afterward via their own screen, not part of the create flow.
2. Soft warning only. Never blocks a class request. Admin approval on a flagged request is the override — no separate "override" flag needed beyond the normal approve action.
3. "Unmet" = student never took the prerequisite subject OR failed it. Both treated identically — no need to distinguish "never taken" vs "failed" in the check logic or in the warning message.
4. Multiple prerequisites on one subject = must pass ALL of them (AND, not OR).
5. Immediate-only checking. Math 3 checks only Math 2. No recursive chain walk.
6. "Passed" is resolved through the **existing grading/scheme logic** (`GradingScale`/`SchemeTemplate` or whatever the current grade-resolution service exposes) — never a separate hardcoded pass/fail flag. This is the single source of truth; do not duplicate grading logic inside the prerequisite feature.
7. Warnings are visible to both the student (on the class browsing view, before they submit) and the admin (on the request queue, after submission) — not admin-only.
8. What gets frozen at request-submission time is the **outcome** (which subjects were unmet), not the underlying grade data — so the audit trail survives later grade corrections without needing to snapshot grading internals.

## 3. Phase 0 — Discovery (read-only, mandatory before any code)

Do not write any implementation code until this phase's findings are written up. Locate and document:

- The current pass/fail resolution path: how does the codebase currently determine whether a student passed a subject? Find the service/method (e.g. something like `hasPassed(studentId, subjectId)` or a computed field on an academic-record model) that resolves a final grade through the applicable `GradingScale`/`SchemeTemplate`. If no single method exists and it's inline/scattered, note where, and propose the minimal method to extract so the prerequisite feature has one clean call site — do not invent grading logic, only wrap what already exists.
- The current Subject model in `schema.prisma` — full field list and existing relations, to confirm where `SubjectPrerequisite` attaches cleanly.
- The current student "available classes" browsing flow (the BSCS-1-style view) — which component renders class cards, and where a warning badge would slot in.
- The current class-request submission flow — request DTO/model, service method that creates a request, and where a frozen warnings field would attach.
- The current admin request-review queue — component and backend list/detail endpoints, to confirm where a warning filter/badge fits.

Output: a short findings note (can be a comment block in the PR description or a `NOTES.md` in the worktree) listing exact file paths/line numbers for each of the above, before Phase 1 begins.

## 4. Phase 1 — Schema

```prisma
model SubjectPrerequisite {
  id                     String   @id @default(cuid())
  org_id                 String
  subject_id             String   // the subject being taken, e.g. Math 2
  prerequisite_subject_id String  // the one required first, e.g. Math 1
  created_at             DateTime @default(now())

  @@unique([org_id, subject_id, prerequisite_subject_id])
}
```

- Add a DB-level or application-level check that `subject_id != prerequisite_subject_id` (no self-reference).
- Extend the existing class-request model with a way to store frozen warnings — either a boolean `has_prerequisite_warning` plus a small child table (`ClassRequestPrerequisiteWarning: id, request_id, prerequisite_subject_id`), or a JSON column if the codebase already uses JSON columns elsewhere for similar frozen-snapshot data — match whatever pattern Phase 0 finds already in use, don't introduce a new pattern if one exists.
- Migration name per `database-migrations.md` convention, e.g. `add_subject_prerequisites`.

## 5. Phase 2 — Backend services

**Prerequisite management (admin-facing CRUD):**

- Create/list/delete `SubjectPrerequisite` rows, scoped to `org_id` from `CurrentUser`, never from body/param.
- On create, reject self-reference and reject the immediate mutual case (A requires B while B already requires A directly) — immediate-only cycle check, not a full graph walk, consistent with immediate-only checking elsewhere in this feature.

**Prerequisite check service:**

- Given a subject and a student, fetch its `SubjectPrerequisite` rows, call the Phase-0-identified pass/fail resolver for each `prerequisite_subject_id`, and return the list of unmet subject ids (empty list = no warning).
- This service has exactly one job: translate "prerequisites + grade resolver" into "unmet list." It must not contain any grading logic itself.

**Wiring into existing flows:**

- Available-classes endpoint (or whatever currently backs the student browsing view): for each class, run the check service and include the unmet list in the response so the frontend can badge it — computed live, not stored.
- Request-submission service: run the check service once at submission time, persist the frozen result onto the new request warning field(s) from Phase 1.
- Request-list/detail endpoint (admin): include the frozen warnings so the admin queue can filter/badge without recomputing.

## 6. Phase 3 — Frontend

**Admin — Manage Prerequisites:**

- New screen or tab on the subject's existing settings/edit view (per Phase 0 findings on where Subject editing currently lives) — multi-select of other subjects to mark as prerequisites, add/remove, no need to touch the subject creation dialog at all.

**Student — available classes view:**

- Warning badge/icon on any class card with unmet prerequisites, tooltip or expandable detail listing which subject(s) are unmet (e.g. "Not yet passed: Math 1"). Request button remains enabled regardless.

**Admin — request queue:**

- Filter/badge for "has prerequisite warning" on the request list.
- Detail view shows the frozen unmet-subjects list for that request.
- Approve/reject controls are the existing ones — approving a flagged request is the override, no new UI state needed for "override."

_Note: if Phase 3 (touching two separate frontend surfaces) turns out to be large enough to be its own review unit, it's fine to split it into a second ticket/branch after Phases 0–2 are merged — but attempt it in the same worktree first and only split if it's genuinely unwieldy, not by default._

## 7. Tests required

- Service: subject with 0/1/multiple prerequisites; student who passed all, failed one, never took one; AND-semantics — passing 2 of 3 still yields a warning.
- Service: immediate-only — student who failed Math 1 but passed Math 2 does not produce a warning on Math 3 (only Math 2 is checked).
- Service: cycle rejection when assigning A→B while B→A already exists.
- Controller: available-classes response includes per-class unmet list; tenant-scoped (org_id from CurrentUser only).
- Controller: request submission freezes warnings correctly; a later grade change does not retroactively alter a submitted request's stored warnings.
- Frontend: class card renders warning badge when unmet list is non-empty; request button stays enabled either way.
- Frontend: admin queue filters by warning flag and detail view lists the correct unmet subjects.

## 8. Out of scope

- Recursive/chained prerequisite checking.
- Hard-blocking a request based on prerequisites.
- Any change to how grades themselves are computed or scaled — this feature only _reads_ pass/fail, never modifies grading logic.
