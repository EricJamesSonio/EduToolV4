# Phase 1 — Backend: Schema

## Goal

Add `GroupyMessage`, `GroupyReaction`, `GroupyPoll`, `GroupyPollOption`, `GroupyPollVote` to the schema.

## Steps

1. Add to `prisma/schema.prisma`:

   ```prisma
   enum GroupyMessageType {
     text
     gif
     sticker
     poll
     system
   }

   enum GroupyReactionType {
     like
     love
     laugh
     wow
     sad
   }

   model GroupyMessage {
     id                String            @id @default(uuid())
     org_id            String
     class_id          String
     sender_account_id String
     sender_role       Role
     sender_name       String
     type              GroupyMessageType
     body              String?
     gif_url           String?
     sticker_id        String?
     poll_id           String?           @unique
     created_at        DateTime          @default(now())

     class     Class          @relation(fields: [class_id], references: [id])
     poll      GroupyPoll?    @relation(fields: [poll_id], references: [id])
     reactions GroupyReaction[]
   }

   model GroupyReaction {
     id          String             @id @default(uuid())
     org_id      String
     message_id  String
     account_id  String
     reaction_type GroupyReactionType
     created_at  DateTime           @default(now())

     message GroupyMessage @relation(fields: [message_id], references: [id], onDelete: Cascade)

     @@unique([message_id, account_id])
   }

   model GroupyPoll {
     id         String    @id @default(uuid())
     org_id     String
     class_id   String
     created_by String
     question   String
     closes_at  DateTime?
     is_closed  Boolean   @default(false)
     created_at DateTime  @default(now())

     message GroupyMessage?
     options GroupyPollOption[]
     votes   GroupyPollVote[]
   }

   model GroupyPollOption {
     id          String @id @default(uuid())
     poll_id     String
     label       String
     order_index Int

     poll  GroupyPoll       @relation(fields: [poll_id], references: [id], onDelete: Cascade)
     votes GroupyPollVote[]
   }

   model GroupyPollVote {
     id         String   @id @default(uuid())
     poll_id    String
     option_id  String
     account_id String
     voted_at   DateTime @default(now())

     poll   GroupyPoll       @relation(fields: [poll_id], references: [id], onDelete: Cascade)
     option GroupyPollOption @relation(fields: [option_id], references: [id], onDelete: Cascade)

     @@unique([poll_id, account_id])
   }
   ```

   Match existing conventions for the `Role` enum reference and `Class` relation if this draft differs from actual file structure — check before applying verbatim.

2. Add the reverse relation field on `Class` (e.g. `groupyMessages GroupyMessage[]`) following how other relations are added to that model.

3. Migration: `add_groupy`.

## Acceptance check

- `npx prisma generate` and migration both run clean
- Deleting a `GroupyMessage` cascades to delete its `GroupyReaction` rows (via `onDelete: Cascade` on the reaction's relation) — confirm this in the schema, not just assumed
- Deleting a `GroupyPoll` cascades to its options and votes

---

## AI Prompt

```
Context: EduTool backend (NestJS + Prisma). Building Groupy — a per-class group
chat feature (educator + enrolled students only, no admin visibility).

Task: Add the models in this phase doc to backend/prisma/schema.prisma exactly
as specified — GroupyMessageType enum, GroupyReactionType enum, GroupyMessage,
GroupyReaction, GroupyPoll, GroupyPollOption, GroupyPollVote. Before applying,
check the existing Class model and Role enum to confirm field/relation naming
matches this codebase's conventions (adjust only naming/style, not the
structure or cascade behavior described).

Add the reverse relation on Class following the pattern used for its other
relations (e.g. how `enrollments Enrollment[]` or similar is already declared).

Generate a migration named add_groupy.

Show me the schema diff before applying, and confirm explicitly that the
cascade behavior (deleting a message removes its reactions; deleting a poll
removes its options and votes) is correctly set via onDelete: Cascade.
```
