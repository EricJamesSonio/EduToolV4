# Late-Enrollment Grading Exclusion — Phase 0: Investigation

## Feature summary (context only — do not implement yet)

We are adding a grading rule: **assessments dated before a student's enrollment
into a class are excluded from that student's grade by default, and remaining
weights are renormalized.** Educators can override this per student/assessment
to force-include it (e.g. when they assign it as make-up work).

This phase is investigation only. Produce a written report. Do not write or
modify any code, do not create migrations, do not touch the schema.

## Mandatory files to read before reporting anything

Read these in full before writing your findings. Do not guess their contents
from filenames — if a listed file does not exist at that path, say so
explicitly instead of assuming its shape.

Backend:

- `backend/prisma/schema.prisma` — focus on: `Assessment`, `Submission`,
  `Enrollment`, `Class`, `GradingScheme`, `GradingSchemeComponent`,
  `StudentProgramEnrollment`, `StudentSchoolYear`, `ManualScore`, `Grade`
- `backend/src/modules/grade/core/grade-core.service.ts`
- `backend/src/modules/grade/core/grade-core.repository.ts` (if it exists —
  confirm actual filename, it may live inside `grade-core.module.ts` or be
  named differently)
- `backend/src/modules/grade/grade.repository.ts`
- `backend/src/modules/grade/grade.service.ts`
- `backend/src/modules/grade/educator/grade-educator.service.ts`
- `backend/src/modules/grade/educator/grade-educator.controller.ts`
- `backend/src/modules/grade/educator/dto/grade-educator.dto.ts`
- `backend/src/modules/enrollment/enrollment.service.ts`
- `backend/src/modules/enrollment/enrollment.repository.ts`
- `backend/src/modules/assessment/core/assessment-core.service.ts`
- `backend/src/modules/assessment/core/assessment-core.repository.ts`
- `backend/src/modules/grading-scheme/grading-scheme.service.ts`
- `backend/src/modules/grading-scheme/grading-scheme.repository.ts`
- `backend/src/modules/audit-log/audit-log.service.ts` (to confirm how audit
  entries are currently written — we will reuse this pattern, not invent one)

Frontend (read only — needed to scope Phase 4 later, not to be touched now):

- `frontend/src/components/educator/grades/CleanGradeTable.tsx`
- `frontend/src/components/educator/grades/DefaultGradeTable.tsx`
- `frontend/src/components/educator/grades/StatusCell.tsx`
- `frontend/src/components/educator/grades/utils.ts`
- `frontend/src/components/educator/grades/types.ts`
- `frontend/src/hooks/educator/useGrades.ts`
- `frontend/src/api/educator/grade.api.ts`

## Report format required (no code)

For each file above, state:

1. Does it exist at that path? If not, where did you find the actual file?
2. What is the exact current logic for computing a student's grade for a
   class/term — specifically: how are per-component/per-assessment scores
   aggregated into `final_score`, and how are weights currently applied?
3. Where (if anywhere) does exclusion/inclusion of individual assessments
   already happen (e.g. `is_missed`, `is_exempted` on `Submission`)? Quote the
   exact condition.
4. What field currently represents "when did this student enroll" that is
   reachable from a grading calculation for a given `(class_id, student_id)`
   pair? Confirm whether `Enrollment.created_at` (the class-level enrollment
   record) or `StudentProgramEnrollment.enrolled_at` (the program-level
   record) is the one actually available inside `grade-core.service.ts`
   today. State the actual join path found in the repository code — do not
   assume one exists.
5. What determines an assessment's "effective date" for comparison — is
   `release_date` reliably populated, or are there assessments where it is
   null? Check `assessment-core.service.ts` / seed data for this.
6. Where are weights currently renormalized, if anywhere (e.g. when a
   component is `is_optional` and unused)? Quote the exact code path — this
   is the pattern we must mirror in Phase 2, not reinvent.
7. Confirm the exact shape of `AuditLog` writes (which service method, what
   fields are populated) so Phase 3 can reuse it verbatim.
8. List any existing tests that already cover grade computation
   (`__TEST__` folders) so Phase 5 doesn't duplicate or conflict with them.

## Guardrails

- Fixed timeout: stop and report if any single file read or search takes an
  unreasonable amount of time — do not retry indefinitely.
- Max 2 retries if a file path is wrong, each retry using a different
  discovery method (e.g. directory listing, then grep by symbol name).
- Do not propose the Phase 1 schema change yet. That comes after this report
  is reviewed and confirmed.
- End your response with: **"Investigation complete. Ready for Phase 1
  confirmation."** and nothing else after that line.
