# School Configuration Preset — Overview

## Problem

Every EduTool school year is built from scratch: departments, courses/strands, levels,
sections, subjects, grading scale assignments, and semester template assignments are all
re-created manually per `SchoolYear`. For a school whose structure doesn't change year to
year, this is pure repetition. The existing Org Data Seeder solves this for demo/dev orgs
with predefined data, but it doesn't reflect what a _real_ school actually has.

## Goal

Let an admin configure their school's structure **once**, using the real admin UI (not a
new parallel form), and reuse it to generate new school years automatically. The
configuration also becomes the source of truth for a future "School Profile" overview
page (deferred, not in this build).

## Core Mechanism

1. **Blueprint School Year** — a single hidden `SchoolYear` row per org
   (`is_config_draft: true`), excluded from every normal school-year query. The admin
   configures their structure by using the _real_ Program/Subject/Grading
   Scale/Semester Template pages, scoped to this blueprint via the existing
   `SchoolYearSelector`. No new CRUD UI is built.
2. **Config Mode Shell** — a thin, page-independent overlay (`ConfigModeProvider` +
   floating step widget) that turns the existing pages into a guided, gated,
   linear flow: Department → Subject → Grading Scale → Grading Scheme (deferred logic,
   navigation only) → Semester Template. It does not modify any existing page component.
3. **Promotion** — an explicit "Save Configuration" action that walks the blueprint's
   real rows (Program/Course/Strand/Level/Section/Subject, GradingScaleAssignment,
   ProgramSemesterAssignment) and copies them into permanent `SchoolConfig*` tables. The
   blueprint itself is never deleted — it persists as the always-available editing
   surface, refreshed (wipe-and-rewrite) on every save.
4. **Generation** — when creating a new real `SchoolYear` with "use preset" enabled, a
   transactional service clones the `SchoolConfig*` tree into real rows under the new
   `school_year_id`, and re-applies grading scale / semester template assignments against
   the (already-existing, never-duplicated) global entities.

## What Is NOT In Scope For This Build

- Academic Calendar (changes every year — excluded from config entirely).
- Grading Scheme _rule logic_ (default-template-by-subject-type). The step exists in the
  guided flow for navigation/tutorial purposes only; actual per-class grading scheme
  application is unchanged and not captured in config yet.
- Class generation (classes need an assigned educator + semester + section — out of scope
  for a structural preset).
- School Profile overview page (reads from config later, in a separate phase).
- Multiple named presets per org (exactly one draft/config per org).

## Guiding Principles

See `rules.md`.

## Phases

| Phase | Name                                          | Output                                                                             |
| ----- | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| 0     | Investigation                                 | Confirms assumptions about existing components/services before any code is written |
| 1     | Schema + Blueprint Infrastructure             | Prisma migration, blueprint get-or-create, repository-level exclusion              |
| 2     | Config Mode Shell (Frontend)                  | `ConfigModeProvider`, step registry, route guard, floating step widget             |
| 3     | Readiness-Based Step Gating                   | Shared readiness logic reused for Done/Skip button + note text                     |
| 4     | Promotion Service ("Save Configuration")      | Blueprint → `SchoolConfig*` copy, delete/start-fresh action                        |
| 5     | Generation Service (Apply Preset to New Year) | `SchoolConfig*` → real year clone, transactional                                   |
| 6     | Polish, Entry Points, Tests                   | Empty-state entry point, partial/complete badge, e2e coverage                      |

Each phase has its own `phaseN.md` with Step 0 (investigate) / Step 1 (implement) /
confirm-before-proceeding gates, per your standard agent process.
