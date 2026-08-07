# Phase 1 — Audit + Schema

## Goal
Add only the schema changes the enrollment portal actually needs. Nothing here should duplicate a model or field that already exists.

## Step 1 — Audit before writing any migration
Read these before touching `schema.prisma`:
- `prisma/schema.prisma` — full file. Confirm the *current* shape of `Organization`, `Account`, `Profile`, `Otp`, `Section`, `Program`, `Course`, `Strand`, `Level`, `StudentSchoolYear`, `StudentProgramEnrollment`, `Notification`, and whatever audit-log entity backs `modules/audit-log`.
- `prisma/commands.md` — the project's actual migration workflow and naming convention.
- The most recent migration folder (`20260728020607_add_org_logo`) — style reference for a small additive migration.

Do not assume any field exists — verify it in the file.

## Step 2 — Reuse before adding
For each item below, check the audit first. Only implement the fallback if the audit confirms nothing usable exists.

| Need | Check first | Fallback if missing |
|---|---|---|
| Public-safe org identifier for the portal link | Does `Organization` already have a slug/handle-like field? | Add `slug String @unique` |
| Distinguish OTP purpose (org registration vs enrollment) | Does `Otp` already have a `purpose`/`context`/scoping field? | Add `purpose` enum (`org_registration`, `enrollment_verification`) + nullable `org_id` |
| Deterministic section fill order | Does `Section` already expose a usable order (e.g. `createdAt`, an existing sort field)? | Add `order_index Int @default(0)` |
| Registrar-level admin permission | Is there already a finer-grained permission/role system beyond `role` enum? | Add `is_registrar Boolean @default(false)` to `Account`, meaningful only when `role = admin` |
| Personal email as applicant identity | `Profile.personal_email` already exists — confirm it, no change needed |

If the audit shows a better existing mechanism than what's listed here (e.g. Otp already supports arbitrary metadata), use that instead and note the deviation in your response — don't force the table above if a cleaner path exists.

## Step 3 — New models
Add these only if Step 1 confirms no equivalent exists:

```prisma
model EnrollmentPeriod {
  id             String   @id @default(uuid())
  org_id         String
  school_year_id String
  name           String
  token          String   @unique
  start_date     DateTime
  end_date       DateTime
  lock_date      DateTime
  created_by     String
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt

  // relations to Organization / SchoolYear / Account per existing relation conventions
  @@index([org_id, school_year_id])
}

enum EnrollmentApplicationStatus {
  pending
  locked
  approved
  rejected
}

model EnrollmentApplication {
  id                  String   @id @default(uuid())
  org_id              String
  school_year_id      String
  enrollment_period_id String
  application_code    String
  personal_email      String

  first_name          String
  middle_name         String?
  last_name           String
  age                 Int?
  address             String?
  contact_number      String?
  last_school_graduated String?

  program_id          String
  course_id           String?
  strand_id           String?
  level_id            String
  section_id          String?

  status              EnrollmentApplicationStatus @default(pending)
  rejection_reason    String?
  reviewed_by         String?
  reviewed_at         DateTime?
  locked_at           DateTime?
  unlocked_by         String?
  unlocked_at         DateTime?
  resulting_account_id String?

  submitted_at        DateTime @default(now())
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  @@unique([org_id, school_year_id, personal_email])
  @@unique([org_id, school_year_id, application_code])
}
```

Adjust field types/relations to match the exact conventions already used in `schema.prisma` (e.g. how other models reference `Organization`/`SchoolYear` — mirror that, don't invent a new relation style).

## Step 4 — Migration
Follow the workflow in `prisma/commands.md` exactly. Name the migration consistently with existing history (e.g. `add_enrollment_portal`).

## Acceptance
- Every added field/model was preceded by a documented "checked X, not present" note — no silent duplication.
- Before altering `Otp` or `Section`, grep the codebase for all existing usages so the additive changes don't break current callers.
- `prisma validate` and `migrate dev` succeed with no unrelated schema drift.