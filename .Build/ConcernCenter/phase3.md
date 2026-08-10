# Phase 3 — Backend: Email Digest Job

## Goal

Replace Phase 2's stub with a real BullMQ delayed job that batches new-concern notifications into a single email per org, at most once per 60-second window, count-only.

## Steps

1. **Find how BullMQ queues are currently registered** in this codebase (look for existing `@nestjs/bullmq` or `bull` queue registrations — check `core/` and any module using background jobs). Mirror that exact registration pattern for a new queue named `concern-digest`.

2. **Producer** — implement `enqueueConcernDigest(orgId: string)` (the method Phase 2 stubbed):

   ```ts
   await this.concernDigestQueue.add(
     "send-digest",
     { orgId },
     { jobId: `concern-digest-${orgId}`, delay: 60_000 },
   );
   ```

   BullMQ will silently no-op the add if a job with that `jobId` is already waiting — this is the entire debounce mechanism, do not add any extra locking/counting logic on top of it.

3. **Processor/consumer** — on job execution:

   ```ts
   async handleDigest(orgId: string) {
     const setting = await this.db.orgConcernSetting.findUnique({ where: { org_id: orgId } });
     const since = setting?.last_digest_sent_at ?? new Date(0);
     const now = new Date();

     const count = await this.db.concern.count({
       where: { org_id: orgId, created_at: { gt: since } },
     });

     if (count > 0) {
       const recipients = await this.db.account.findMany({
         where: { org_id: orgId, role: 'admin', status: 'active' },
         include: { profile: true },
       });

       for (const acct of recipients) {
         const to = acct.profile?.personal_email;
         if (!to) continue;
         try {
           await this.mailService.sendConcernDigestEmail(to, count);
         } catch (err) {
           this.logger.error(`Digest email failed for ${to}`, err);
           // do not throw — one failed recipient must not block others or fail the job
         }
       }
     }

     // Always update, success or partial failure — prevents next window from
     // double-counting concerns already reported in this digest.
     await this.db.orgConcernSetting.upsert({
       where: { org_id: orgId },
       update: { last_digest_sent_at: now },
       create: { org_id: orgId, last_digest_sent_at: now },
     });
   }
   ```

   Note the `gt` (not `gte`) comparison and the fact that `now` is captured once at job start and used for the update — not derived from the counted rows. This avoids the boundary double-count described in the overview doc.

4. **Mail template** — add `sendConcernDigestEmail(to: string, count: number)` to `MailService`, following the exact visual style of `sendOtpEmail`/`sendCredentialsEmail` (same table/gradient-header structure). Body copy: _"You have {count} new concern{s} waiting in EduTool. Log in to view and respond."_ No concern content, ever — count only.

5. **Do not add a retry-with-backoff policy that re-sends old counts.** If the job itself throws before reaching the `orgConcernSetting.upsert` step (e.g. a DB connection blip), BullMQ's default retry is acceptable — but the mail-sending loop specifically must never throw (per-recipient try/catch as shown above), since a bad email address for one admin should not delay or duplicate the digest for the whole org.

## Acceptance check

- 10 concerns created within 5 seconds for the same org → exactly 1 digest email sent, ~60s later, with count reflecting all 10
- No new concerns after the digest → no further email until a new concern arrives
- An org with zero admin accounts → job completes without error, `last_digest_sent_at` still updates

---

## AI Prompt

```
Context: EduTool backend (NestJS). BullMQ + Redis are already part of the stack.
Concern/ConcernMessage/OrgConcernSetting models exist (Phase 1). Phase 2 left a
stubbed call site: enqueueConcernDigest(orgId) with a "// TODO Phase 3" comment
inside the concern module.

Step 1 — investigate: find how any existing BullMQ queue is registered in this
codebase (search for @nestjs/bullmq or similar). Report the pattern before
writing new code, and mirror it exactly for a new queue named 'concern-digest'.

Step 2: Implement the producer — replace the Phase 2 stub with a real call:
this.concernDigestQueue.add('send-digest', { orgId }, { jobId: `concern-digest-${orgId}`, delay: 60000 })
Do not add any additional debounce/locking logic — the jobId collision is the
entire mechanism.

Step 3: Implement the processor exactly as specified in the code block in this
phase doc — pay close attention to: (a) using `gt` not `gte` when counting
concerns since last_digest_sent_at, (b) capturing `now` once at job start and
using that same value for the OrgConcernSetting update rather than deriving it
from counted rows, (c) wrapping each recipient's email send in its own try/catch
so one bad address doesn't block others or fail the job, (d) always updating
last_digest_sent_at at the end regardless of email success/failure.

Step 4: Add sendConcernDigestEmail(to: string, count: number) to
backend/src/modules/mail/mail.service.ts, matching the existing visual template
style used by sendOtpEmail and sendCredentialsEmail in the same file. Message
content: count only, e.g. "You have {count} new concern(s) waiting in EduTool."
Never include actual concern text/subject in this email.

Show me the queue registration diff, the producer/processor diff, and the mail
template diff before applying.
```
