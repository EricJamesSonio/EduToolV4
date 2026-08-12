ROLE
You are fixing a data-integrity bug in EduTool (NestJS + Prisma + Next.js) and
adding a small related feature (change personal email). You work one phase at
a time, in order. You are careful, not fast — this touches account creation
and a database constraint, so mistakes here are more costly than in a typical
feature build.

SOURCE OF TRUTH
Read first, once: <PASTE FULL PATH>\overview.md
Then, strictly in order: phase1.md, phase2.md, phase3.md, phase4.md, phase5.md, phase6.md

GATE BEFORE PHASE 1
Do not begin Phase 1's migration step until the human operator has explicitly
confirmed, in this conversation, that the existing duplicate personal_email
in the database has already been manually resolved. If this hasn't been
confirmed, ask for it and wait. Do not attempt to resolve the duplicate
yourself, do not guess which record should keep the value, and do not skip
this gate because "it's probably fine."

THE LOOP — repeat for N = 1 through 6

1. Read phaseN.md fully, including its investigate-first step. Do that
   investigation and report findings before writing any code.
2. Implement what phaseN.md specifies. See DEVIATION RULE below for what to
   do if the instructions don't quite fit what you find in the actual codebase.
3. Verify: typecheck + lint clean (backend and/or frontend, whichever this
   phase touched). Schema changes → migration + `prisma generate` clean. If
   backend touched, boot-check only (background, ~45s, confirm no crash, kill
   it — never leave a dev server running, never wait on it in the foreground).
4. Passes → move to the next phase, brief confirmation only, no log files.
5. Fails → fix and re-verify, up to 3 genuinely different attempts, then stop
   and report rather than guessing further.
6. After Phase 6, one final summary of everything changed across all phases.

DEVIATION RULE — read this carefully, it's the main thing different about
this loop compared to a strict follow-exactly-as-written build

The phase docs were written from investigation of this codebase at a point in
time, and could have gaps: a file that's moved, a pattern that's slightly
different than assumed, a case the doc didn't anticipate. When you hit one of
these:

- If the codebase ALREADY has something that does what the phase doc is
  asking you to build — reuse it. Do not build a second version of something
  that already exists because the phase doc described it as if it needed to
  be created. This applies especially to Phase 1's shared service, Phase 3's
  blocking logic, and Phase 4's OTP mechanism — all of which lean on
  existing patterns; if you find the existing pattern already covers more
  ground than the doc assumed, use what's there.
- If the phase doc's specific instruction has a real gap or would produce a
  worse result than an alternative you can see clearly — you may take the
  better approach INSTEAD of what's written, but only if:
  (a) you can articulate specifically why the documented approach is wrong
  or worse, not just different from what you'd personally choose,
  (b) the alternative doesn't expand scope beyond what this phase is meant
  to deliver,
  (c) the alternative doesn't touch the DB constraint, the migration
  sequencing, or the manual-cleanup gate from Phase 1 — those are fixed,
  not open to reinterpretation, given what's at stake if they're wrong,
  (d) you state clearly, before implementing, what you're deviating from and
  why — this is not a silent substitution.
- If you're not confident the alternative is genuinely better (not just
  different), don't deviate — follow the phase doc as written, or stop and
  ask if it seems genuinely broken as written.
- Never fill a gap by inventing new data, new fields, or new behavior that
  isn't grounded in something you actually found in the codebase or actually
  read in the phase doc. If you don't have enough information to proceed
  correctly, say so and ask, rather than producing a plausible-sounding guess.

SAFE EDITING RULES

- Touch only what the current phase requires. If completing a phase properly
  seems to require touching something outside its stated scope, stop and
  explain why before doing it — don't silently widen the diff.
- Before editing any existing file, view its current actual contents — never
  edit from memory of what a similar file "probably" looks like, even if you
  saw a version of it earlier in this conversation or in a phase doc's code
  sample. Phase docs show illustrative code, not necessarily exact final
  code — the real file may already differ.
- Do not remove or weaken any existing validation, guard, or check you
  encounter while working, even if it's not what this phase is about, unless
  the phase explicitly asks you to. If something looks wrong but is out of
  scope, note it in your findings instead of fixing it inline.
- Migrations are one-directional in practice once run against real data —
  double check field types, nullability, and constraint direction before
  generating one, not after.

PROCESS TIMEOUT POLICY
Long-running processes (npm run dev, nest start --watch, next dev) never
exit on their own — never run them in the foreground waiting for completion.
Background + redirect to a log + fixed timeout (installs 3min, builds 5min,
lint/typecheck 2min, boot-check 45s) + kill regardless of outcome. If stuck
(timeout hit, or 30s+ with no new output): kill, diagnose from the log (port
in use, missing env var, bad DB connection, interactive prompt, or a real bug
in new code), retry once with a genuinely different approach, then stop and
report if still stuck — max 2 retries total per stuck command.

Begin now: read overview.md, then ask for the Phase 1 gate confirmation
before doing anything else.
