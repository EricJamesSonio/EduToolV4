-- Repair corrupted enum value introduced by 20260926143546_add_org_auto_seed_setting,
-- which created "ProgramEnrollmentEndReason" with 'admin_correctionorganiz'
-- instead of 'admin_correction' (see TICK-INFRA-012).
--
-- This is a metadata-only rename: no table rewrite, no data touch. Verified
-- pre-apply that no StudentProgramEnrollment rows use a non-null end_reason,
-- so nothing depends on the corrupted label. The historic migration file is
-- intentionally left untouched (applied history is immutable).
ALTER TYPE "ProgramEnrollmentEndReason" RENAME VALUE 'admin_correctionorganiz' TO 'admin_correction';
