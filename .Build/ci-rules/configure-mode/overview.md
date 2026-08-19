# School Profile / Configuration Mode — Overview (v2)

> Supersedes the earlier "blueprint SchoolYear + ConfigModeProvider" plan from
> earlier in this project. That design is no longer accurate — do not use it
> as a reference. This document reflects the current, agreed architecture.

## What changed since the first plan

The original plan proposed a hidden draft `SchoolYear` row that the real
admin pages would be pointed at during a guided "configuration mode," with a
separate promotion step copying its data into new tables.

That approach is replaced. Configuration Mode is now a **second mode of the
existing Data Seeder**, not a wrapper around the real CRUD admin pages. The
Data Seeder's predefined data (`org-seeder/data/*.data.ts` on the backend,
`data-seeder/constants/*.ts` on the frontend) already encodes "what a school
of this type typically has" — Configuration Mode lets an admin turn that
generic library into an accurate, editable, persisted description of what
_their specific school_ actually has.

## The core idea: School Profile

The **School Profile** is the org's single source of truth for its academic
structure: which departments it runs, what courses/strands and levels exist
in each, what sections and subjects those levels have, and what grading
scale / grading scheme / semester template setup it uses. Once configured,
this profile is:

1. **Used to speed up future school year creation** — Seeder Mode can apply
   a saved profile instead of walking every predefined-data screen from
   scratch.
2. **Displayed as the org's real overview** — replacing free-text admin
   claims ("we support College and SHS") with system-derived truth.

## Two categories of editable data — this is the key architectural split

### Category A — Structural data (Department, Course/Strand, Level, Section, Subject)

No org-global home exists for this today; every real row (`Program`,
`Course`, `Strand`, `Level`, `Section`, `Subject`) is tied to a specific
`school_year_id`. This category needs **new, persisted, org-scoped tables**
representing the profile itself, decoupled from any particular year.

- **Department**: select/toggle only, against the fixed system list
  (`daycare`, `kinder`, `elementary`, `jhs`, `shs`, `college`). No rename, no
  delete, no invented departments — the system only supports what it
  supports.
- **Course / Strand / Level / Section / Subject**: free editing, but
  **scoped to selected departments only**. Selecting a department seeds the
  profile's editable copy from that department's predefined data
  (`courses.data.ts`, `levels.data.ts`, per-program `subjects/*.ts`, etc.).
  From there the admin can rename, delete, or add freely — this is now the
  org's own data, fully diverged from the predefined library.
- **An unselected department's predefined data is never touched or copied.**
  It remains available, unmodified, in the Data Seeder's normal (non-profile)
  flow at all times.

### Category B — Global entities (Grading Scale, Grading Scheme Template, Semester Template)

These already exist as real, persisted, org-global rows with real CRUD
(`GradingScaleService`, `GradingSchemeTemplateService`, semester template
service — all confirmed and hardened earlier in this project with
name-based dedup guards). Configuration Mode does **not** create a parallel
profile copy of these — it is a differently-chromed entry point into the
**same real data and the same real mutations**, reusing the existing form
components (`GradingScaleRangeEditor`, the grading scheme component editor,
the semester template item/term editor) inside new page/container chrome
built for Configuration Mode's flow.

- **Semester Template in Configuration Mode has no calendar to derive from.**
  The admin sets the semester count and term names/counts directly (a plain
  count input, defaulting to 2), rather than the count being computed from
  break periods the way Seeder Mode does it. This does not auto-register
  anything to a department/program — Configuration Mode never touches
  `ProgramSemesterAssignment`, only the template's own structure.

## Explicitly excluded from Configuration Mode

- **Academic Calendar** — inherently year-specific, never part of a
  reusable profile.
- **Auto-registration of Semester Template to a department** — that only
  happens in real Seeder Mode, once an actual calendar exists.
- **Class-level readiness** (classes, educators, enrollment) — out of scope,
  same as the original plan.

## Relationship between the two modes

Seeder Mode (today's full flow: departments → levels/sections/subjects →
grading → calendar → semester template → apply to a real school year) is
**untouched and remains fully independent** — a school year can still be
seeded from scratch with zero profile involvement. Configuration Mode is
additive: a second entry point on the same page, editing/saving the profile
instead of seeding a year. How exactly a saved profile later accelerates
Seeder Mode (pre-fill vs. auto-apply) is deferred to a later phase, per your
direction — this plan focuses on getting Configuration Mode to a working,
saved state first.

## Phases

| Phase | Name                                                 | Output                                                                                   |
| ----- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 0     | Investigation                                        | Confirms schema/component assumptions before writing code                                |
| 1     | Schema — School Profile tables                       | Prisma models for Category A profile data                                                |
| 2     | Backend — Profile CRUD services                      | Services/controllers for selecting departments, editing structural data                  |
| 3     | Frontend — Mode switch + Department/Structural steps | Toggle on Data Seeder page; profile-aware Department/Course/Level/Section/Subject steps  |
| 4     | Frontend — Global entity editing shell               | Configuration-mode chrome around existing Grading Scale/Scheme/Semester Template editors |
| 5     | Save / Load profile flow                             | Persisting and resuming profile edits; readiness/completeness surfacing                  |
| 6     | Polish + tests                                       | E2E coverage, edge cases, cleanup                                                        |

See `rules.md` for constraints that apply across every phase, and each
`phaseN.md` for the detailed step-by-step plan.
