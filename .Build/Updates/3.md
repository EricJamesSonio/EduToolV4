========================================
EDU SYSTEM FIX PLAN (BY MODULE / PAGE)
========================================


========================================
1. ORGANIZATION PAGE
========================================
Goal: Prevent duplicate seeding + enforce program rules

[Seeding Logic]
- Before seeding:
  - Check if data already exists per:
    - School Year (e.g. 2026-2027)
    - Program (e.g. Daycare, College)
    - Sections
    - Subjects

- If already seeded:
  - Mark as: "Already Exists"
  - Disable reseeding for:
    - Sections
    - Subjects

- Allow:
  - Program selection remains enabled
  - Only NON-existing data can be seeded

- Result:
  - No duplication
  - Partial seeding allowed (missing only)


[Grading Scale Scope]
- Enforce: ONE grading scale per program
  Example:
    - College → only 1 grading scale allowed

- Add validation:
  - Prevent multiple grading scales for same program


[Grading Scale Templates]
- Add reusable templates
- Scope: Program-based
- Purpose:
  - Faster setup
  - Standardization


========================================
2. DASHBOARD
========================================
Goal: Accurate overview

- Only display data for:
  → ACTIVE SCHOOL YEAR

- Remove:
  - Any data from inactive/ended school years


========================================
3. GRADING SCALE PAGE
========================================
Goal: Better filtering + consistency

[School Year Selector]
- Add global selector
- Behavior:
  - Filters displayed grading scales

[Create Form]
- Auto-use selected school year
- Show school year (READ-ONLY)
- Do NOT allow manual editing

[Validation]
- Respect program scope rule (1 per program)


========================================
4. GRADING SCHEME (IMPORTANT REFACTOR)
========================================
Current Problem:
- Scoped by School Year ❌

Target:
- Scoped by CLASS ✅

[New Behavior]
- Each class can have its own grading scheme

[Admin Workflow]
- Admin selects:
  - Program (e.g. College)
  - Grading Scheme Template

- System behavior (behind the scenes):
  - Apply template to ALL classes under that program
  - Bulk operation

[Frontend UX Trick]
- Show as:
  → "Apply to Program"
- But internally:
  → Applies per class

[Result]
- Flexible grading per class
- Still easy bulk setup


========================================
5. CLASSES PAGE
========================================
Goal: Simplify filtering

- REMOVE:
  - School Year filter

- USE:
  - Global school year selector instead


========================================
6. SUBJECT PAGE
========================================
Goal: Fix incorrect responsibility

Current:
- Subjects assign educators ❌

Fix:
- REMOVE educator assignment from subject

- MOVE responsibility to:
  → Classes

Reason:
- Educators are class-based, not subject-based


========================================
7. SCHOOL YEARS MODULE
========================================
Issue:
- Auto unenroll unclear behavior

[Check Behavior]
- Currently:
  - Likely triggers ONLY when end date is reached

[Fix Options]
Option A:
- Keep automatic (date-based)

Option B:
- Add manual trigger:
  → "End School Year" button

- When triggered:
  - Force unenroll students
  - Mark school year as ended

[Recommended]
- Support BOTH:
  - Auto (date reached)
  - Manual override


========================================
8. UI / UX IMPROVEMENTS
========================================
Current Issues:
- Too many tabs
- Confusing navigation

Planned Fix:
- Reduce page fragmentation
- Consolidate related features
- Improve flow:
  - Organization → Setup
  - Classes → Execution
  - Grading → Evaluation

- Add:
  - Clear hierarchy
  - Better grouping
  - Fewer clicks


========================================
SUMMARY OF KEY ARCHITECTURE CHANGES
========================================

✔ Prevent duplicate seeding (idempotent seeding)
✔ Program-scoped grading scale (1 per program)
✔ Class-scoped grading scheme (flexible grading)
✔ Global school year selector (shared state)
✔ Move educator assignment → Classes
✔ Bulk apply templates via frontend abstraction
✔ Dashboard = Active school year only


========================================
OPTIONAL NEXT STEP (IF YOU WANT)
========================================
- I can convert this into:
  → Jira tickets
  → Trello cards
  → Database design changes (Prisma)
  → Backend tasks (NestJS services)
  → Frontend task breakdown (React)

Just tell me 👍