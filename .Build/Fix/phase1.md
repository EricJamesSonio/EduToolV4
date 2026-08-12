# Phase 1 — Backend: Shared Uniqueness Service + DB Constraint

## Goal

One reusable check for "is this Gmail already tied to an account," plus a database-level guarantee underneath it. This phase includes a manual step for you (not the AI agent) before the migration can safely run.

## Steps

1. **STOP — manual step, do this yourself before running the AI agent on this phase.** Query `Profile` for the current duplicate `personal_email` (the one from your admin + student account test). Decide which account should keep that value, and either clear it (`personal_email: null`) or change it on the account that should NOT keep it. The migration in this phase adds a unique constraint and **will fail if any duplicate non-null value still exists** — this is intentional, it's a safety check, not a bug in the migration.

2. Once cleaned up, have the AI agent add:

   ```prisma
   model Profile {
     // ...existing fields
     personal_email String? @unique
   }
   ```

   Migration: `add_unique_personal_email`.

3. **Shared service**: `backend/src/commons/services/personal-email-registry.service.ts` (or wherever this codebase keeps small cross-module shared services — check for a precedent before deciding the exact location):

   ```ts
   @Injectable()
   export class PersonalEmailRegistryService {
     constructor(private readonly db: DatabaseService) {}

     async isPersonalEmailInUse(
       email: string,
       excludeAccountId?: string,
     ): Promise<boolean> {
       const existing = await this.db.profile.findFirst({
         where: {
           personal_email: email,
           ...(excludeAccountId
             ? { account_id: { not: excludeAccountId } }
             : {}),
         },
         select: { id: true },
       });
       return !!existing;
     }
   }
   ```

   Export this from whatever module makes sense for cross-module injection (check how other genuinely shared services, if any exist, are structured — e.g. is there a `commons` module that already exports providers this way, or does each consuming module need its own provider registration pointing at the same service class).

## Acceptance check

- Migration fails cleanly with a clear Postgres error if duplicates weren't cleaned up first (expected, not a bug)
- After cleanup, migration succeeds
- `isPersonalEmailInUse('someone@gmail.com')` returns `true`/`false` correctly; passing `excludeAccountId` for the account that legitimately owns that email returns `false`

---

## AI Prompt

```
Context: EduTool backend (NestJS + Prisma). Fixing a data-integrity gap: the
same Gmail was able to become personal_email on two different accounts. This
phase adds a shared uniqueness check and a DB constraint.

IMPORTANT: Before running any part of this phase, confirm with me that the
existing duplicate personal_email value in the Profile table has already been
manually resolved. Do NOT attempt to resolve it yourself (e.g. by picking one
row to null out) — that's a decision for a human, not something to infer. If
you query the table and still find a duplicate non-null personal_email across
more than one row, STOP and tell me, do not proceed to the migration.

Once confirmed clean:

Step 1: Add @unique to Profile.personal_email in backend/prisma/schema.prisma
(it should remain optional/nullable — Postgres unique indexes allow multiple
nulls, only non-null duplicates are blocked, so this is compatible with
accounts that haven't set a personal email at all). Generate migration
add_unique_personal_email.

Step 2: Add a shared PersonalEmailRegistryService with a single method
isPersonalEmailInUse(email: string, excludeAccountId?: string): Promise<boolean>
that checks Profile.personal_email, excluding the given account_id if
provided (matching the code in this phase doc). Find the right home for a
genuinely cross-module shared service in this codebase's existing structure —
report where you're placing it and why before creating it.

Show me the migration result and the service location/reasoning before
finishing this phase.
```
