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
