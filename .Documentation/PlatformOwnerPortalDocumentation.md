# Platform Owner Portal Documentation

Platform-level super-admin for the multi-tenant system. Not tied to any organization – manages schools and their admin accounts across the whole platform. Frontend under `/platform`, backend under `backend/src/modules/platform/*`.

**Auth:** Single env password `PLATFORM_SECRET_PASSWORD`. `POST /platform/login` (`backend/src/modules/platform/platform.controller.ts:25`) returns JWT `{ role: "platform_owner" }`. All other routes guarded by `AuthGuard + PlatformOwnerGuard` (`backend/src/modules/platform/guards/platform-owner.guard.ts:14`).

---

## Pages

| Page | Route | What it does |
|------|-------|--------------|
| **Admins** | `/platform/admins` | Paginated, searchable list of all `role=admin` accounts. Create admin (`POST /platform/admins` – email + optional fullName → generates one-time password), view detail (`/platform/admins/[id]`), **Block/Unblock** (suspends/reactivates), **Reset Password** (new one-time password). |
| **Schools** | `/platform/schools` | Paginated directory of `Organization` records with logo, name, email extension, linked admin (name/email/status). Read-only, searchable by name/extension, click row for detail dialog. (`GET /platform/schools`) |
| **Registration Requests** | `/platform/requests` | Schools requesting onboarding. Filter by status (All/Pending/Approved/Rejected). **Approve** (requires admin email input → creates school + admin credentials) or **Reject**. Credentials dialog shows one-time password after approval. |
| **Profile** | `/platform/profile` | Platform owner account settings. |

> `/platform` itself redirects to `/platform/admins` (`frontend/src/app/platform/page.tsx:7`).

---

## Workflows

**Onboard a school:** Requests → open pending row → Approve → enter admin email → confirm → copy/distribute one-time credentials.

**Moderate admins:** Admins → search → open row → Block (suspended, cannot log in) / Unblock / Reset Password (copy new password – shown once).

**Audit:** All platform actions logged to `auditLog` with `org_id = "platform"` (e.g. `CREATE_ADMIN`, `BLOCK_ADMIN`, `RESET_ADMIN_PASSWORD` – `backend/src/modules/platform/platform.service.ts:262`).

> Note: Platform owner has **no** org context – cannot access `/admin`, `/educator`, or `/student` features. Admin operations are the only way to provision school access.
