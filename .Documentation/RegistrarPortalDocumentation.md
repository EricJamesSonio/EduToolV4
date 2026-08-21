# Registrar Portal Documentation

Registrar is an **org-scoped sub-role of admin** for admissions. Shares the `/admin` layout but sees a filtered sidebar and is gated by an extra decorator.

**Auth & Provisioning:**
- Created by an admin at **Admin → Registrars** (`/admin/registrars`, `backend/src/modules/registrar/registrar.controller.ts:28` – `@Roles('admin')`). Requires org email extension; email generated as `username@registrar.<domain>` (`backend/src/modules/registrar/registrar.service.ts:130` – isolated subdomain so it never collides with student/educator).
- Login via normal `/login` – JWT carries `role=admin, is_registrar=true, org_id`. Backend additionally requires `@Registrar()` (`backend/src/commons/decorators/roles.decorator.ts:14`) on enrollment-portal routes.
- Admin can **suspend/activate**, **reset password** (one-time), and **soft-delete** registrars. Registrars cannot create other registrars or edit periods (read-only there).

---

## Accessible Pages

Registrars use the same frontend as admins but with a reduced nav (checked via `useRole().isRegistrar`):

| Page | Route | Access | What it does |
|------|-------|--------|--------------|
| **Enrollment Portal – Dashboard** | `/admin/enrollment-portal` | Full | Period selector + stats (total/in-review/enrolled/rejected) + department/course/level breakdown + find-by-code. Share button copies ` /enroll/[orgSlug]/[periodToken]` link. |
| **Periods** | `/admin/enrollment-portal/periods` | Read-only | Lists periods (token, overflow action, SY, dates). Create/edit/delete is **admin-only** (hidden when `isRegistrar`). |
| **Applications** | `/admin/enrollment-portal/applications` | Full | Search by code/email, filter by status (pending/locked/approved/rejected) & period, paginated. Row click → detail. Approve/Reject (pending only), **Unlock** (locked → pending). |
| **Application Detail** | `/admin/enrollment-portal/applications/[id]` | Full | Full applicant data + approve/reject/unlock actions. Approve creates a student account and enrolls them (credentials emailed). |
| **Enrollment (manual)** | `/admin/enrollment` | Read/limited | View manual enrollment stepper; primary admissions flow is via the portal. |

All other admin pages (Dashboard, Organization, Students, Educators, Sections, etc.) are **not** shown to registrars – sidebar filters them out.

---

## Core Concepts

**Enrollment Period** (`backend/src/modules/enrollment-portal/registrar/enrollment-registrar.service.ts:49`): `name, school_year_id, start_date, end_date, lock_date, section_overflow_action` with rules `start < lock`, `start < end`, `end < SY start`. Token auto-generated (7 chars, unique per org). Lifecycle: `upcoming → open → locked → ended`. Cannot delete if applications exist.

**Application Statuses:** `pending` (awaiting review) → `approved` (student created) / `rejected` (with reason) / `locked` (auto-locked after `lock_date`, must unlock to review).

---

## Workflows

**Share enrollment link:** Dashboard/Periods → Copy application link → send to applicants (`/enroll/[orgSlug]/[token]` – public portal).

**Review applicant:** Applications → filter/search → open row → **Approve** (confirm → student enrolled) or **Reject** (enter reason) or **Unlock** (if locked).

> Audit: period/application actions logged via `AuditLogService.logAdminAction` with `entityType=enrollment_application` (`enrollment-registrar.service.ts:633`).
