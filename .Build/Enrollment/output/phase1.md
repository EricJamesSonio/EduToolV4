Phase 1 complete. Everything verified: prisma validate ✅, migration applied ✅, no schema drift ✅, backend recompiled and serving on :5000 ✅.
Audit findings (documented, no silent duplication)
Need Checked Result
Org public identifier Organization had no slug/handle field Added slug
OTP purpose scoping Otp had no purpose/context field Added purpose enum + nullable org_id
Section fill order Section has no createdAt/sort field Added order_index Int @default(0)
Registrar permission Account only has role enum Added is_registrar Boolean @default(false)
Personal email identity Profile.personal_email (schema.prisma:121) Already exists — no change
Enrollment portal models No EnrollmentPeriod/EnrollmentApplication anywhere in code Added both
Audit-log entity AuditLog exists with log_type No change needed
Schema changes (backend/prisma/schema.prisma)

- Organization.slug String? @unique — nullable deliberately (deviation): OrganizationService.create/organization.repository.ts:30 don't supply a slug, so a non-null field would break org creation. The migration backfills unique slugs for all 10 existing orgs (verified: 0 missing, 0 duplicates). A later phase assigns slugs when enabling the portal.
- Otp.purpose OtpPurpose @default(org_registration) + org_id String? — additive; existing auth flow (auth.repository.ts:69) unaffected (defaults to org_registration).
- Section.order_index Int @default(0) — additive; all 1331 existing sections + all db.section.create() callers unaffected.
- Account.is_registrar Boolean @default(false) — additive.
- EnrollmentPeriod + EnrollmentApplication + EnrollmentApplicationStatus enum. Relations mirror existing conventions: org_id stays a scalar (matching Program/Section), FKs to SchoolYear/Program/Course/Strand/Level/Section follow the StudentProgramEnrollment pattern, and actor IDs (created_by, reviewed_by, unlocked_by) are scalars matching AuditLog.actor_id/GradeLock.locked_by. Unique constraints [org_id, school_year_id, personal_email] and [org_id, school_year_id, application_code] implement the "one application per email per org per school year" rule.
  Migration
  20260807210646_add_enrollment_portal (applied via migrate deploy). I used migrate diff + manual folder creation because migrate dev requires a TTY unavailable here; the resulting migration is functionally identical to what migrate dev would produce (confirmed migrate status = up to date, no drift).
  Note: the ./prisma/commands.md migrate dev workflow can't run non-interactively in this shell — the manual migrate deploy route is the safe equivalent, and I left a shadow DB (edutool_shadow) for future migrate diff runs. Both backend and frontend dev servers were restarted (they were holding the Prisma DLL lock).
