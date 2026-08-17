# Late-Enrollment Grading Exclusion — Orchestrator (Run All Phases)

You have six phase files in this folder:

1. `PHASE_0_INVESTIGATION.md`
2. `PHASE_1_SCHEMA.md`
3. `PHASE_2_CORE_GRADING_LOGIC.md`
4. `PHASE_3_EDUCATOR_OVERRIDE_API.md`
5. `PHASE_4_FRONTEND_UI.md`
6. `PHASE_5_TESTS.md`

Execute them **in order, back to back, without stopping to ask for
confirmation between phases.** Each phase file's "wait for confirmation"
line at the end is superseded by this orchestrator — treat that line as
"proceed automatically to the next phase" instead. Everything else in each
phase file (guardrails, verification steps, retry limits, no-guessing rules)
still applies exactly as written.

## How to move between phases

After finishing a phase's own "Verification" section:

- **If verification passes** → immediately continue to the next phase file.
  Do not pause, do not summarize back to the user, do not ask "should I
  proceed?" Just keep going.
- **If verification fails after that phase's stated retry limit** → STOP.
  Do not continue to the next phase. Report exactly which phase failed,
  what was tried, and the actual vs expected result. Wait for the user.
- **If a phase file references something Phase 0 was supposed to confirm
  and Phase 0 flagged it as unconfirmed/missing** (e.g. the enrollment join
  path doesn't actually exist as assumed) → STOP at that point, do not
  guess a substitute and continue. Report the mismatch.

This means the only two ways this run stops before Phase 5 is done are: (a)
a genuine blocking gap surfaced by investigation, or (b) a verification step
that fails repeatedly. A phase completing successfully is never itself a
reason to pause.

## Progress log

Keep a running checklist as you go and print it after each phase completes,
in this exact compact form — nothing more verbose:

```
[x] Phase 0 — Investigation — done
[x] Phase 1 — Schema — done
[ ] Phase 2 — Core Grading Logic — in progress
[ ] Phase 3 — Educator Override API
[ ] Phase 4 — Frontend UI
[ ] Phase 5 — Tests
```

This is for the user's visibility only, printed between phases — it is not
a checkpoint you wait on. Print it, then immediately keep working.

## Global rules across the whole run

- Never skip a phase's mandatory file-reading step, even if a previous phase
  already touched the same file. Re-read it fresh, since your own prior
  edits in this run change its contents.
- Never invent code, imports, or schema fields that weren't confirmed to
  exist. If Phase 0 didn't confirm something a later phase needs, that later
  phase must stop rather than assume.
- Never modify or delete an existing passing test to make a new one pass.
- Never touch files outside what each phase explicitly scopes.
- If you hit the same failure twice across different phases (e.g. the same
  missing file both times), stop immediately rather than repeating the same
  guess a third time somewhere else.

## Final report (only after Phase 5's own completion line)

Once Phase 5 reports its own completion, produce one final summary:

- Full list of files created or modified across all six phases, one line
  each: path → what changed.
- Any deviations from the phase files you were forced to make (e.g. a
  different join path or file location than assumed), clearly flagged.
- Confirmation that the full backend and frontend test/lint suites pass.

Do not produce per-phase narrative logs beyond the compact checklist above —
this final report is the only long-form output expected from the whole run.

okay so now. read .Build\FixIssues\loop.md then proceed! that is a loop so just go phases fixes.
