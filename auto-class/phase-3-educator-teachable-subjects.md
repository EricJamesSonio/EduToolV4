# Phase 3: Educator teachable subjects

## Goal
Record which subjects each educator can teach, before any class exists. The generator only assigns educators from this list. Manual class creation uses it to suggest educators.

## Read first
Backend: `prisma/schema.prisma` (`Account`, `Subject`, `Class`), `educator/` (controller, service, repository, dto, module), `subject/` (service, repository, controller), `class/class.service.ts` (`create`, `reassignEducator`), `program/program-type-resolver.ts`.
Frontend: `app/admin/educators/[id]/page.tsx`, `components/admin/educator/*`, `hooks/admin/useEducators.ts`, `hooks/admin/useSubject.ts`, `api/admin/educator.api.ts`, `components/admin/class/CreateClassDialog.tsx`, `CreateClassFormFields.tsx`, `hooks/useCreateClassData.ts`, `EditClassDialog.tsx`.

## Data model
New table `EducatorSubject`:
- `id`, `org_id`, `educator_id` (Account.id, role educator), `subject_id`, `created_at`.
- `@@unique([educator_id, subject_id])`, `@@index([org_id, subject_id])`, `@@index([org_id, educator_id])`.
- Relations to `Account` and `Subject` (cascade on subject delete is not needed if subjects are only soft-managed. Use restrict-safe behavior consistent with the rest of the schema).
- Do NOT use the existing unused `Subject.educator_id` column.

## Backend (new submodule, e.g. `educator-subject/`, or inside `educator`)
Endpoints (admin only, org-scoped):
- `GET /educators/:id/subjects?schoolYearId=`: subjects the educator can teach (with program/level/course/strand names).
- `PUT /educators/:id/subjects`: body `{ subjectIds: string[] }`, replaces the set. Validate every subject belongs to the org and the educator exists, is an educator and is not deleted.
- `GET /subjects/:id/educators`: educators who can teach that subject (used by manual create and readiness).
- `POST /educator-subjects/carry-over`: body `{ fromSchoolYearId, toSchoolYearId, educatorIds? }`. For each link in the old year, find the equivalent subject in the new year: same normalized name, same program `type`, same level name, course/strand name where applicable. Insert if it does not exist. Return `{created, unmatched[]}` so the admin sees what could not be matched.
- Bulk fetch for the generator: `getEligibleEducatorsBySubject(orgId, subjectIds)` returning `Map<subjectId, educatorId[]>` in one query. Exclude deleted or suspended educators.

Rules:
- Assigning a class to an educator who does not teach the subject is NOT blocked in manual creation (see D6). It returns/labels a warning.
- Deleting or suspending an educator does not delete links, but the queries above filter them out.
- Audit log entries for set/carry-over.

## Frontend
1. Educator detail page: new "Teachable subjects" card. It offers a multi-select grouped by program then level (searchable) for the selected school year, a chip list of current subjects, and a "Copy from previous year" button that calls carry-over and shows the unmatched list.
2. Subject detail page (`subjects/[id]`): read-only "Educators who can teach this" list with a quick add.
3. Optional: an "Assign subjects" step in `CreateEducatorDialog` (skippable). Do not add it to bulk create.
4. `CreateClassDialog` and `EditClassDialog`: once a subject is picked, load `GET /subjects/:id/educators` and show "Suggested" educators first in the educator select. Selecting a non-matching educator shows a non-blocking warning ("X is not set to teach this subject"). Do not remove the ability to pick anyone.
5. Query keys, API, types, hooks following the existing patterns.

## Edge cases
- Educator with no subjects set: they simply are not eligible for generation. Readiness lists them.
- Subject in new school year with no counterpart: shown as unmatched in carry-over.
- Same subject name across levels: match level name too, otherwise carry-over could attach the wrong level.

## Tests
- Replace-set semantics, cross-org rejection, carry-over matching and unmatched reporting, batched eligible-educators query (assert single query).

## Acceptance
- Admin can define teachable subjects for every educator, copy them to a new year, and see suggestions when creating a class manually.
