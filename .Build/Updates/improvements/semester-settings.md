========================================
SEMESTER TEMPLATE ISSUES & FIX PLAN
========================================

1. CURRENT ISSUE (MISMATCH BUG)
----------------------------------------
Scenario:
- Creating a Semester Template for:
  → College → Works correctly ✅
  → Senior High School → Has issue ❌

Error Message:
- "Assign to Programs"
- Shows:
  → "No Senior High School programs in this year"

Problem:
- This is incorrect because:
  → Senior High School programs DO exist for that school year

- Same issue also occurs with:
  → Elementary
  → Custom programs
  → Other program types

Conclusion:
- There is a mismatch between:
  → Program Type (SHS, Elementary, etc.)
  AND
  → Actual Programs fetched from the School Year

Likely Cause:
- Filtering logic is wrong or too strict
- Possibly checking wrong field or relation
- Programs are not being fetched correctly per school year


========================================
2. PROGRAM SELECTION LIMITATION
----------------------------------------
Issue:
- Program selection in Semester Template:
  → Does NOT support all programs

- Missing:
  → Custom programs
  → Some existing program types

Problem:
- System currently relies on:
  → Program TYPE (e.g. college, shs)

- But actual system supports:
  → Custom programs with their own types

Conclusion:
- Selection logic is incomplete
- Not aligned with real data structure


========================================
3. REQUIRED FIX (DATA SOURCE)
----------------------------------------
Fix Strategy:
- Fetch ALL programs from the selected School Year

Source:
- School Year → Programs relation

Requirement:
- Every program under a school year must be selectable

Includes:
✔ College programs
✔ SHS programs
✔ Elementary programs
✔ Custom programs (with custom types)

Result:
- No program should be excluded
- No false "No programs found" errors


========================================
4. NEW APPROACH (RECOMMENDED)
========================================
OPTION 2: PROGRAM-LEVEL SCOPING

Instead of:
❌ Scoping templates by Program Type (college, shs, etc.)

Use:
✅ Scoping templates by ACTUAL PROGRAM

----------------------------------------
Example:

Program Name   | Type     | Template
----------------------------------------
College        | college  | CollegeTemplate
TechVoc        | customs  | TechVocTemplate
Daycare        | customs  | DaycareTemplate
Kinder         | customs  | KinderTemplate


========================================
5. BENEFITS
----------------------------------------
✔ Highly flexible
✔ Each program can have its own semester setup
✔ Supports custom programs naturally
✔ No need for overrides or hacks
✔ Cleaner data modeling


========================================
6. TRADEOFFS
----------------------------------------
- Slightly more setup initially
- May create many templates if many programs exist

Note:
- This is acceptable because:
  → Templates are reusable
  → Flexibility is more important than limiting count


========================================
7. FINAL REQUIREMENTS
----------------------------------------
✔ Fix incorrect "No programs found" issue
✔ Fetch programs from School Year directly
✔ Support ALL program types (including custom)
✔ Change selection from:
    Program Type → Actual Program
✔ Update UI to reflect real program list


========================================
SUMMARY
========================================

Problem:
- Program mismatch + incomplete selection

Solution:
- Use School Year → Programs as source of truth
- Scope templates per actual program (not type)

Result:
- Accurate, flexible, and scalable system