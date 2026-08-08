# Registrar Portal Access & Permissions — Project Overview

## What this feature is

EduTool now has two ways students get enrolled:
1. **Online Enrollment Portal** (already built — `enrollment-portal` module, `registrar` module, `enroll/[orgSlug]/[periodToken]` public route)
2. **Manual Enrollment** (pre-existing `enrollment` module, admin-side)

This feature is **not** new enrollment logic. It's about defining what a **registrar account** — a staff member whose job is enrollment, not full school administration — can see and do inside the existing `/admin/*` shell, and closing the one real data-integrity gap that surfaced while scoping it (section capacity floor).

## Identity model (already decided, not re-litigated here)

- Registrar is **not** a new `Role` enum value.
- Registrar = an `Account` with `role: admin` **and** `is_registrar: true`.
- This means a registrar account technically has full admin API access. That's a **deliberate, deferred tradeoff** — enforcement is UI-only for now, not backend-enforced. Leave a marker comment wherever this matters:
  ```
  // TODO: registrar accounts are currently trusted at the API level — access is scoped in the UI only.
  ```

## Final permission matrix

| Area | Registrar |
|---|---|
| Enrollment Portal dashboard | View stats |
| Enrollment Periods | **View only** — create/edit/delete is admin-only (generates a public-facing link, treated as sensitive) |
| Applications | Full — review, approve, reject, unlock |
| Manual Enrollment | Full — enroll, unenroll, view students |
| Students | View + limited edit (contact info, status only — not full profile) |
| Sections | Full — create, edit capacity (up or down), **move students between sections** — no delete |

## New data-integrity rule (applies to everyone, not just registrar)

**A section's capacity can never be set below its current enrolled student count.**
Example: a section has 30 enrolled students. Nobody — admin or registrar — can set capacity to 20, because there's no defined behavior for where the other 10 go. This is enforced once, server-side, in `SectionService`, so it protects against the mistake regardless of who makes it.

## Explicitly deferred / out of scope for this pass

- API-level lockdown of registrar accounts (UI-only for now, revisit later)
- Registrar-specific audit log view
- Standalone nav items for Programs/Courses/Strands/Levels/School Years/Academic Calendar — these stay as read-only embedded context inside Applications/Sections pages, not top-level nav

## Section-move validation rules

When any user moves a student to a different section:
- Target section must match the student's current `level_id` (and `course_id`/`strand_id` if applicable) — no moving a BSCS-4 student into a Grade 7 section
- Target section must have room: `enrolled_count < capacity`
- Updates `StudentProgramEnrollment.section_id`
- Logged via existing `AuditLogService`

## Phase map

| Phase | Layer | What it delivers |
|---|---|---|
| 1 | Backend | Expose `is_registrar` through auth (`getMe`) |
| 2 | Backend | Section capacity floor validation |
| 3 | Backend | Student section-reassignment endpoint (find-or-build) |
| 4 | Frontend | Auth context + registrar-scoped nav |
| 5 | Frontend | Sections page: create/edit-capacity/move for registrar |
| 6 | Frontend | Students, Manual Enrollment, Enrollment Periods scoping + QA pass |

Each phase file below is self-contained and includes an "AI Prompt" block meant to be pasted directly into your coding assistant.