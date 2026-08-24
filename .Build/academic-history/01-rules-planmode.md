# Plan Mode Rules

These rules apply to **every phase**, for the entire time you are in Plan Mode for that phase. You do not write, edit, or generate implementation code in Plan Mode — investigation reads only, plus the plan document you produce.

## 1. Source of truth

`overview.md` (Eric's Enrollment & Academic History planning doc) is the spec. The phase file you're working from is the implementation breakdown. If they conflict, `overview.md` wins — stop and flag it, don't silently resolve it yourself.

## 2. Investigate before planning

Read every file listed in the current phase's "Files to read" section, in full, from the actual current repo — not from memory of a prior phase, not from what earlier planning documents assumed. The codebase changes between planning sessions. If a file's shape has changed since the phase file was written, that's a normal finding to report, not an error.

## 3. Confidence grading — mandatory

For every non-trivial decision you make while planning this phase (schema shape, which existing pattern to reuse, where a new file belongs, how to resolve an ambiguity the phase file flags), state your confidence as a percentage.

- **≥ 90%**: proceed with your plan, state the assumption briefly in your human-readable summary (rule 5) so Eric can catch it if wrong, but don't block on it.
- **< 90%**: STOP. Ask Eric directly, as a specific question with your best-guess answer attached (e.g. "I think X because Y — is that right, or did you mean Z?"). Do not guess and proceed. Do not bury the question in a wall of text — ask it plainly, near the top of your response.

Confidence below 90% is common and expected, especially on:

- Anything the phase file explicitly marks as a decision point or stop condition
- Any place where two existing patterns in the codebase conflict and you'd have to pick one
- Any place where implementing the letter of the phase file would contradict something you just found in the actual code

## 4. Never assume — verify or ask

Do not invent field names, DTO shapes, enum values, or relation names. If something isn't in the files you read, either read the file that would contain it, or ask. This is a data-integrity feature (academic records) — a wrong guess here isn't cosmetic, it can silently corrupt or lose a student's history.

## 5. Produce a human-readable plan before touching Build Mode

Before ending Plan Mode for a phase, produce a plain-language summary Eric can review without reading code:

- What this phase will change, in one paragraph
- The concrete list of files that will be created/modified
- Every assumption made at ≥90% confidence, stated explicitly (so Eric can veto even a "confident" assumption)
- Every question raised at <90% confidence, with your best-guess answer
- The verification/tests planned for this phase
- Anything from the phase file's "Stop condition" that got triggered, and how you resolved it (or that it's still open)

**End your turn here.** Do not proceed into Build Mode, do not start writing code, until Eric explicitly says to proceed (e.g. "go", "build it", "approved"). If Eric asks you to change the plan instead, revise the human-readable summary and present it again — don't build a version Eric hasn't approved.

## 6. Scope discipline in planning

Plan only what the current phase file asks for. If you notice something adjacent that seems worth fixing (a bug, a missed edge case, dead code), note it separately as a suggestion for Eric to triage — don't fold it into this phase's plan without approval.
