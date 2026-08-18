# Backend fix — gate enrollment writes on school-year readiness

## Scope confirmed with Eric
Gated: `StudentEnrollmentService.enrollStudent`, `enrollInProgram`, `updateProgramEnrollment`.
NOT gated (unchanged): `unenrollStudent`, `updateEnrollment` (status), `removeProgramEnrollment`,
and `ClassService.enrollStudent` (class enrollment stays open — already has its own
academic-placement gating via `EnrollmentService`, untouched here).

This is a deliberate scope decision, not an oversight — flagging so it isn't silently
expanded later. If you want removal/status-downgrade paths gated too, that's a separate
follow-up, not part of this fix.

---

## Step 0 — Investigate first

Read before editing:
- `backend/src/modules/school-year/school-year.module.ts` — confirm it exports
  `SchoolYearReadinessService` (add to `exports` if it doesn't). Confirm whether it imports
  `StudentEnrollmentModule` anywhere in its import chain — if yes, `StudentEnrollmentModule`
  must import `SchoolYearModule` via `forwardRef(() => SchoolYearModule)` to avoid a circular
  DI error; if no circular chain exists, a plain import is fine. Try the plain import first,
  only add `forwardRef` if Nest throws a circular-dependency error at boot.
- `backend/src/modules/student-enrollment/dto/student-enrollment.dto.ts` — confirm
  `UpdateProgramEnrollmentDto` doesn't already carry a `schoolYearId` field that would make
  the repository change unnecessary. (Expected: it doesn't — `updateProgramEnrollment`'s only
  ID params today are `programEnrollmentId` and `orgId` — but confirm before assuming.)

## Step 1 — `student-enrollment.repository.ts`

`findProgramEnrollmentById` currently only selects `student_id` off the `studentSchoolYear`
relation. Add `school_year_id` so the service can derive readiness scope from the record
itself rather than trusting a caller-supplied `schoolYearId` in a URL param (a URL param could
name a different school year than the one this program enrollment actually belongs to, which
would check the wrong year's readiness and reopen the exact bypass this fix closes).

```ts
// findProgramEnrollmentById — before
studentSchoolYear: { select: { student_id: true } },

// findProgramEnrollmentById — after
studentSchoolYear: { select: { student_id: true, school_year_id: true } },
```

## Step 2 — `student-enrollment.module.ts`

```ts
import { Module, forwardRef } from '@nestjs/common';
import { StudentEnrollmentController } from './student-enrollment.controller';
import { StudentEnrollmentService } from './student-enrollment.service';
import { StudentEnrollmentRepository } from './student-enrollment.repository';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { SectionModule } from '../section/section.module';
import { SchoolYearModule } from '../school-year/school-year.module';

@Module({
  imports: [
    AuditLogModule,
    SectionModule,
    // Use forwardRef only if Step 0's investigation found a circular import.
    SchoolYearModule, // or: forwardRef(() => SchoolYearModule),
  ],
  controllers: [StudentEnrollmentController],
  providers: [StudentEnrollmentService, StudentEnrollmentRepository],
  exports: [StudentEnrollmentService],
})
export class StudentEnrollmentModule {}
```

## Step 3 — `student-enrollment.service.ts`

Add the import and constructor dependency:

```ts
import { SchoolYearReadinessService } from '../school-year/school-year-readiness.service';

@Injectable()
export class StudentEnrollmentService {
  constructor(
    private readonly repo: StudentEnrollmentRepository,
    private readonly auditLogService: AuditLogService,
    private readonly sectionService: SectionService,
    private readonly readinessService: SchoolYearReadinessService,
  ) {}
```

### 3a. `enrollStudent` — add as the FIRST line of the method body

```ts
async enrollStudent(
  schoolYearId: string,
  orgId: string,
  dto: EnrollStudentDto,
  actorId: string,
  tx?: Prisma.TransactionClient,
) {
  await this.readinessService.assertReady(orgId, schoolYearId);

  const existing = await this.repo.findByStudentAndSchoolYear(
    // ...unchanged from here down
```

Note: `bulkEnrollStudents` calls `enrollStudent` once per student via `Promise.allSettled`, so
this correctly gates every bulk call too — at the cost of one redundant `assertReady` DB round
trip per student in the batch. That's correct but not optimal; leave as-is unless Eric wants a
single upfront check added to `bulkEnrollStudents` itself as a follow-up optimization.

### 3b. `enrollInProgram` — add as the FIRST line of the method body

```ts
async enrollInProgram(
  schoolYearId: string,
  studentId: string,
  orgId: string,
  dto: EnrollStudentProgramDto,
  actorId: string,
  tx?: Prisma.TransactionClient,
) {
  await this.readinessService.assertReady(orgId, schoolYearId);

  // Student must be enrolled in the school year first
  const schoolYearEnrollment = await this.repo.findByStudentAndSchoolYear(
    // ...unchanged from here down
```

### 3c. `updateProgramEnrollment` — add immediately after the not-found guard

```ts
async updateProgramEnrollment(
  programEnrollmentId: string,
  orgId: string,
  dto: UpdateProgramEnrollmentDto,
  actorId: string,
) {
  const record = await this.repo.findProgramEnrollmentById(programEnrollmentId);
  if (!record || record.org_id !== orgId) {
    throw new NotFoundException('Program enrollment not found.');
  }

  await this.readinessService.assertReady(orgId, record.studentSchoolYear.school_year_id);

  if (dto.section_id !== undefined) {
    // ...unchanged from here down
```

This gates the whole method (section reassignment AND any other field update on the same
endpoint), not just the `section_id` branch — since both are writes on the same enrollment-state
resource. Flagging this choice explicitly: if Eric wants level/course/strand-only updates to stay
ungated while only section changes are blocked, that's a narrower version of 3c and should be
called out before implementing.

## Step 4 — Verify

```
cd backend
npm run test        # unit suite must still pass unchanged
npm run test:e2e     # backend/test/*.e2e-spec.ts — none of these currently exercise
                      # student-enrollment against an unready school year, so none should
                      # newly fail; report immediately if any do — that means a hidden
                      # dependency on this bypass exists elsewhere and needs to be found,
                      # not worked around.
```

Do not touch the frontend e2e spec in this pass — that's Step 2 of the overall fix, gated
on Eric confirming the backend change is correct first.