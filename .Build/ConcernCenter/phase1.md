# Phase 1 — Backend: Schema + Default Category Seeding

## Goal

Add the four new tables and wire default `ConcernCategory` rows into whatever hook already creates `OrgEnrollmentSetting`/`OrgHolidayConfig` when an org is created.

## Steps

1. **Investigate first.** Find where `OrgEnrollmentSetting` (and/or `OrgHolidayConfig`) gets created when a new `Organization` is created — likely `organization.service.ts` or the org-seeder flow. Report what you find before writing new code; the category seeding must hook into the same place, not a new/parallel one.

2. **Add to `prisma/schema.prisma`**:

   ```prisma
   enum ConcernStatus {
     open
     resolved
   }

   model ConcernCategory {
     id         String   @id @default(uuid())
     org_id     String
     label      String
     is_default Boolean  @default(false)
     is_active  Boolean  @default(true)
     created_at DateTime @default(now())
     updated_at DateTime @updatedAt

     concerns Concern[]

     @@unique([org_id, label])
   }

   model Concern {
     id               String        @id @default(uuid())
     org_id           String
     category_id      String
     sender_account_id String
     sender_role      Role
     subject          String
     status           ConcernStatus @default(open)
     created_at       DateTime      @default(now())
     updated_at       DateTime      @updatedAt
     last_message_at  DateTime      @default(now())
     resolved_by      String?
     resolved_at      DateTime?

     category ConcernCategory  @relation(fields: [category_id], references: [id])
     messages ConcernMessage[]
   }

   model ConcernMessage {
     id          String   @id @default(uuid())
     org_id      String
     concern_id  String
     sender_account_id String
     sender_role Role
     sender_name String
     body        String
     created_at  DateTime @default(now())

     concern Concern @relation(fields: [concern_id], references: [id])
   }

   model OrgConcernSetting {
     id                  String    @id @default(uuid())
     org_id              String    @unique
     last_digest_sent_at DateTime?
     created_at          DateTime  @default(now())
     updated_at          DateTime  @updatedAt
   }
   ```

   Adjust field types only if the existing `Role` enum name or `Organization` relation conventions differ from this draft — match whatever's actually in the file.

3. **Migration**: `add_concern_center`.

4. **Seeding hook**: wherever `OrgEnrollmentSetting` gets created for a new org, add: create one `OrgConcernSetting` row (org_id, no `last_digest_sent_at` yet), and four `ConcernCategory` rows (`Account Problem`, `Grade Problem`, `Technical Issue`, `Other`), all with `is_default: true`.

## Acceptance check

- Creating a new org produces exactly 4 `ConcernCategory` rows and 1 `OrgConcernSetting` row automatically.
- `npx prisma generate` runs clean, migration applies clean.

---

## AI Prompt

```
Context: EduTool backend (NestJS + Prisma). Building the Concern Center feature —
students submit concerns, admin/registrar reply in a shared inbox.

Step 1 — investigate: find where OrgEnrollmentSetting (or OrgHolidayConfig) gets
auto-created when a new Organization is created. Report the exact file/method
before writing anything.

Step 2: Add these four things to backend/prisma/schema.prisma — ConcernStatus enum
(open, resolved), ConcernCategory model, Concern model, ConcernMessage model,
OrgConcernSetting model. [paste the schema block from this doc]. Match existing
naming/relation conventions in the file rather than following this draft verbatim
if something differs (e.g. how other org-scoped settings tables are shaped).

Step 3: Generate a migration named add_concern_center.

Step 4: In the exact hook point found in Step 1, add creation of:
- One OrgConcernSetting row per new org (org_id only, last_digest_sent_at left null)
- Four ConcernCategory rows: "Account Problem", "Grade Problem", "Technical Issue",
  "Other" — all with is_default: true, is_active: true

Show me the schema diff and the seeding hook diff before applying.
```
