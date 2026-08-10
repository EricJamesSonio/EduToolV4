# EduTool — Admin Account Request: Implementation Loop Prompt

Save the seven planning docs into one folder first, renamed to:
`overview.md`, `phase1.md`, `phase2.md`, `phase3.md`, `phase4.md`, `phase5.md`, `phase6.md`

Paste the block below into your AI coding tool.

```
ROLE
You are implementing the Admin Account Request feature for EduTool
(NestJS + Prisma + Next.js) — an upgrade of an existing registration flow, not
a new system. Work one phase at a time, in order, and do not skip ahead.

SOURCE OF TRUTH
Read this first, once: .Build\AdminRequest\overview.md (basically within this same folder path)
Then work through, strictly in order: phase1.md, phase2.md, phase3.md,
phase4.md, phase5.md, phase6.md (same folder).

THE LOOP — repeat for N = 1 through 6
1. Read phaseN.md fully, including its "investigate first" step — every phase
   in this feature has one. Do that investigation and report what you found
   before writing any new code.
2. Implement exactly what phaseN.md specifies. Don't build ahead into the next
   phase, even if it looks convenient.
3. Verify: `npx tsc --noEmit` and `npm run lint` clean (backend and/or
   frontend, whichever this phase touched). If Prisma schema changed, run the
   migration and `npx prisma generate` clean. If backend touched, do a quick
   boot-check — start it in the background, give it 45 seconds, confirm no
   crash, kill it. Never leave a dev server running.
4. If verification passes: briefly say what you built and move straight to
   the next phase. No log files, no separate report — just continue.
5. If verification fails: fix it and re-check, up to 3 attempts, each a
   genuinely different fix. Still broken after 3 → stop, explain what you
   tried, and wait for input instead of guessing further or moving on.
6. If a phase's "investigate first" step finds the codebase doesn't match
   what the phase doc assumed (e.g. approval doesn't currently create an
   Organization the way Phase 3 expects) — stop, report the mismatch, and
   wait for input rather than improvising a workaround.
7. After Phase 6 passes, give one final summary of everything built across
   all six phases, then stop.

RULES
- Long-running commands (npm run dev, nest start --watch, next dev) never run
  them in the foreground waiting for them to "finish" — they don't. Background
  + timeout + kill, as described in step 3.
- Don't touch files outside what the current phase specifies without saying
  so and why.
- This feature reuses a lot of existing code (Otp, RegistrationRequest,
  platform-registration module, the Enrollment Portal's session mechanism,
  MailService templates) — if you find yourself about to write something that
  duplicates existing logic instead of reusing/extending it, stop and
  reconsider, that's very likely a sign you skipped the investigate step.

Begin now: read overview.md, then start phase1.md.
```
