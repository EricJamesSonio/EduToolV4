========================================
SUBJECT CREATION IMPROVEMENTS
========================================

1. MAJOR SUBJECT CREATION
----------------------------------------
Issue:
- When creating a new major subject, the system does NOT ask for:
  - Course
  - Strand
- This happens even when the selected program (e.g. College, SHS) supports them.

Fix:
- The form SHOULD require:
  - Course (for College)
  - Strand (for SHS or similar programs)

Reason:
- Major subjects must be tied to a specific course or strand
- Ensures proper organization and avoids misclassification

Expected Behavior:
- If program supports course/strand → require selection
- Subject is created under that specific course/strand


2. MINOR SUBJECT CREATION
----------------------------------------
Current Behavior:
- Does not require course or strand ✅ (this is correct)

Clarification:
- Minor subjects are usually shared across programs
- They should NOT be tightly coupled to a single course/strand

Requirement:
- Minor subjects MUST require a Level

Example:
- MAPEH 1 → applies only to 1st Year

Reason:
- Even shared subjects are still level-specific


3. EDUCATOR ASSIGNMENT (SUBJECT CREATION)
----------------------------------------
Issue:
- Subjects currently allow assigning educators during creation ❌

Fix:
- REMOVE educator assignment from subject creation

Reason:
- Educator assignment should be handled in:
  → Class Management

- Subjects = definition only
- Classes = execution (who teaches it)


4. UX IMPROVEMENTS (SMART DEFAULTS)
----------------------------------------
Goal:
- Make the creation flow more intuitive and faster

Current Behavior:
- User manually selects:
  - Program
  - Level
  - Type (Major/Minor)

Improvement:
- Use current filters as default input

Example Scenario:
- User is viewing:
  → College → 1st Year → Major Subjects

- When clicking "Create New Subject":
  - Automatically prefill:
    - Program = College
    - Level = 1st Year
    - Type = Major

Reason:
- Matches user intent
- Reduces repetitive input
- Improves speed and usability

Expected Behavior:
- Form adapts based on current filter context
- User can still override if needed

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
SUMMARY
========================================

✔ Major subjects → Require Course/Strand (if applicable)
✔ Minor subjects → No Course/Strand, but Level is required
✔ Remove educator assignment from subject creation
✔ Use filter-based smart defaults for better UX