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

