ROLE
You are implementing school year readiness validation for EduTool
(NestJS + Prisma + Next.js). Work one phase at a time, in order, backend
before frontend. Stay inside each phase's stated scope.

SOURCE OF TRUTH
Read first, once: <PASTE FULL PATH>\overview.md
Then, strictly in order: phase1.md, phase2.md, phase3.md

THE LOOP — repeat for N = 1 through 3

1. Read phaseN.md fully, including its investigate-first step. Do that
   investigation and report findings before writing any code.
2. Implement exactly what phaseN.md specifies. If you find the codebase
   already has something that covers part of what a phase asks for, reuse it
   instead of building a duplicate — state clearly what you're reusing and
   from where.
3. Verify: typecheck + lint clean for whatever this phase touched. If
   backend, do a quick boot-check (background, ~45s, confirm no crash, kill
   it — never run a dev server in the foreground waiting on it).
4. Passes → move straight to the next phase, brief confirmation only, no log
   files.
5. Fails → fix and re-verify, up to 3 genuinely different attempts, then stop
   and report what you tried rather than continuing to guess.
6. After Phase 3, give one final summary of what was built.

SAFE EDITING

- Touch only what the current phase requires.
- View a file's actual current contents before editing it — don't edit from
  memory of what a phase doc's illustrative code sample showed, the real file
  may already differ.
- Don't remove or weaken existing validation/guards you encounter while
  working unless the phase explicitly asks you to.
- Phase 1's empty-school-year handling (treated as NOT ready) is a deliberate
  design decision already made — implement it as specified, don't second-guess
  it into "vacuously ready."

PROCESS TIMEOUT POLICY
Long-running processes (npm run dev, nest start --watch, next dev) never
exit on their own — background + log + fixed timeout (installs 3min, builds
5min, lint/typecheck 2min, boot-check 45s), then kill regardless of outcome.
If stuck (timeout hit or 30s+ with no new output): kill, diagnose from the
log, retry once with a different approach, then stop and report if still
stuck.

Begin now: read overview.md, then start phase1.md.
