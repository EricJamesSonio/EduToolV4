/**
 * playground-assessment-grading.ts
 *
 * REAL end-to-end playground (no mocks, real Nest module graph, real DB):
 *
 *   1. Seeds a fresh org + school year (SY 2026-2027) with the org-seeder.
 *   2. Configures the academic calendar + semester SETTINGS so the FIRST
 *      SEMESTER ENDED on 2026-08-15 ("now" = 2026-08-16), matching the
 *      "semester settings from the past" requirement.
 *   3. Creates a MAPEH Grade 1 class in that semester, applies the elementary
 *      grading scheme, creates a MANUAL assessment for Term 1, has a student
 *      submit, the educator grades the essay, then grades are computed.
 *
 * Usage (from backend/):
 *   npx ts-node -r tsconfig-paths/register src/seeds/playground-assessment-grading.ts
 *   npx ts-node -r tsconfig-paths/register src/seeds/playground-assessment-grading.ts --keep
 *
 * Default cleans up every row created for the playground org; --keep preserves
 * the data for inspection.
 */

import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

import { AppModule } from '@/app.module';
import { DatabaseService } from '@/core/database/database.provider';
import { OrgSeederService } from '@/modules/org-seeder/org-seeder.service';
import { SemesterTemplateService } from '@/modules/semester-template/semester-template.service';
import { ClassService } from '@/modules/class/class.service';
import { EnrollmentService } from '@/modules/enrollment/enrollment.service';
import { GradingSchemeService } from '@/modules/grading-scheme/grading-scheme.service';
import { AssessmentEducatorService } from '@/modules/assessment/educator/assessment-educator.service';
import { SubmissionService } from '@/modules/submission/submission.service';
import { GradeEducatorService } from '@/modules/grade/educator/grade-educator.service';
import { CreateAssessmentDto, GradeEssayDto, GradingMode } from '@/modules/assessment/dto/assessment.dto';

// ── Config ────────────────────────────────────────────────────────────────────

if (!process.env.DATABASE_URL) {
  loadEnv({ path: path.join(__dirname, '..', '.env') });
  console.log('[playground] DATABASE_URL loaded from backend/.env');
}

const SALT_ROUNDS = 10;
const SEED_PASSWORD = 'seed123';
const KEEP_ORG = process.argv.includes('--keep');

const SY_START = '2026-08-01';
const SY_END = '2027-06-30';
const SY_NAME = 'SY 2026-2027';

// First semester ENDED 2026-08-15 (past); second semester opened 2026-08-16.
const SEM1_TERMS = [
  ['2026-08-01', '2026-08-05'],
  ['2026-08-06', '2026-08-10'],
  ['2026-08-11', '2026-08-15'],
];
const SEM2_TERMS = [
  ['2026-08-16', '2026-12-31'],
  ['2027-01-01', '2027-03-31'],
  ['2027-04-01', '2027-06-30'],
];

const log = (msg: string) => console.log(`[playground] ${msg}`);

async function step(label: string, fn: () => Promise<unknown> | unknown): Promise<void> {
  try {
    await fn();
    log(`PASS ${label}`);
  } catch (err) {
    log(`FAIL ${label} — ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }
}

function fmt(d: unknown): string {
  if (!d) return '-';
  return new Date(String(d)).toISOString().slice(0, 10);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  let app: INestApplication;
  let db: DatabaseService;

  // `--cleanup <orgId>` only runs cleanup for an existing org (e.g. a leftover
  // from a previously interrupted run) and exits.
  const cleanupArgIdx = process.argv.indexOf('--cleanup');
  const cleanupOrgId = cleanupArgIdx >= 0 ? process.argv[cleanupArgIdx + 1] : undefined;

  const orgId = `pg-${uuid()}`;
  const schoolYearId = `pg-sy-${uuid()}`;
  const actorId = `pg-actor-${uuid()}`;
  const short = orgId.slice(3, 9);

  log('--- BOOTING FULL AppModule (real module graph) ---');
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = moduleFixture.createNestApplication();
  await app.init();

  db = app.get(DatabaseService);

  if (cleanupOrgId) {
    log(`--- CLEANUP-ONLY: deleting all rows for org ${cleanupOrgId} ---`);
    const schoolYears = await db.schoolYear.findMany({
      where: { org_id: cleanupOrgId },
      select: { id: true },
    });
    for (const sy of schoolYears) {
      await cleanup(db, cleanupOrgId, sy.id);
    }
    if (schoolYears.length === 0) {
      await cleanup(db, cleanupOrgId, '');
    }
    await app.close();
    log('Cleanup-only complete.');
    return;
  }

  // moduleFixture.get() resolves ANY provider in the container (exports don't matter).
  const orgSeeder = moduleFixture.get(OrgSeederService);
  const semesterTemplateService = moduleFixture.get(SemesterTemplateService);
  const classService = moduleFixture.get(ClassService);
  const enrollmentService = moduleFixture.get(EnrollmentService);
  const gradingSchemeService = moduleFixture.get(GradingSchemeService);
  const assessmentService = moduleFixture.get(AssessmentEducatorService);
  const submissionService = moduleFixture.get(SubmissionService);
  const gradeEducatorService = moduleFixture.get(GradeEducatorService);

  let educatorId = '';
  let studentId = '';
  let classId = '';
  let termId = '';
  let assessmentId = '';
  let submissionId = '';

  try {
    // ── 1. org + school year fixture ─────────────────────────────────────────
    await step('create org + school year rows', async () => {
      await db.organization.create({
        data: { id: orgId, name: `Playground ${orgId}` },
      });
      await db.schoolYear.create({
        data: {
          id: schoolYearId,
          org_id: orgId,
          name: SY_NAME,
          status: 'active',
          start_date: new Date(`${SY_START}T00:00:00.000Z`),
          end_date: new Date(`${SY_END}T00:00:00.000Z`),
        },
      });
    });

    // ── 2. seed domain data (elementary only) + academic calendar ─────────────
    await step('seedOrg (elementary, first sem ends 2026-08-15)', async () => {
      await orgSeeder.seedOrg({
        orgId,
        schoolYearId,
        actorId,
        programs: ['elementary'],
        seedGradingScales: true,
        seedGradingSchemes: true,
        seedSemesterTemplates: true,
        seedProgramCalendars: true,
        programCalendars: {
          elementary: {
            startDate: SY_START,
            endDate: SY_END,
            notes: 'Playground calendar — 2 semesters, first ends Aug 15',
            breaks: [
              { label: 'Semester 1', startDate: SY_START, endDate: '2026-08-15' },
              { label: 'Semester 2', startDate: '2026-08-16', endDate: SY_END },
            ],
          },
        },
      });
    });

    // ── 3. resolve structure ─────────────────────────────────────────────────
    let programId = '';
    let grade1LevelId = '';
    let subjectId = '';
    let schemeTemplateId = '';

    await step('resolve program / level / subject / scheme template', async () => {
      const program = await db.program.findFirst({
        where: { org_id: orgId, type: 'elementary' },
      });
      if (!program) throw new Error('elementary program not seeded.');
      programId = program.id;

      const grade1 = await db.level.findFirst({
        where: { org_id: orgId, program_id: programId, name: 'Grade 1' },
      });
      if (!grade1) throw new Error('Grade 1 level not seeded.');
      grade1LevelId = grade1.id;

      const mapeh = await db.subject.findFirst({
        where: {
          org_id: orgId,
          program_id: programId,
          level_id: grade1LevelId,
          name: 'MAPEH',
        },
      });
      if (!mapeh) throw new Error('MAPEH Grade 1 subject not seeded.');
      subjectId = mapeh.id;

      const schemeTpl = await db.gradingSchemeTemplate.findFirst({
        where: { org_id: orgId, program_type: 'elementary' },
      });
      if (!schemeTpl) throw new Error('elementary grading scheme template not seeded.');
      schemeTemplateId = schemeTpl.id;
    });

    // ── 4. accounts ──────────────────────────────────────────────────────────
    await step('create educator + student accounts', async () => {
      const hash = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);
      const educator = await db.account.create({
        data: {
          org_id: orgId,
          role: 'educator',
          email: `pg.educator.${short}@test.local`,
          password: hash,
          status: 'active',
        },
      });
      educatorId = educator.id;
      await db.profile.create({
        data: {
          account_id: educator.id,
          full_name: 'Playground Educator',
        },
      });

      const student = await db.account.create({
        data: {
          org_id: orgId,
          role: 'student',
          email: `pg.student.${short}@test.local`,
          password: hash,
          status: 'active',
        },
      });
      studentId = student.id;
      await db.profile.create({
        data: {
          account_id: student.id,
          full_name: 'Playground Student',
        },
      });
      log(`educator (${educator.id}) / student (${student.id}) created — password "${SEED_PASSWORD}"`);
    });

    // ── 5. academic placement (studentSchoolYear → program enrollment) ───────
    await step('student academic placement (Grade 1, elementary)', async () => {
      const ssy = await db.studentSchoolYear.create({
        data: {
          org_id: orgId,
          student_id: studentId,
          school_year_id: schoolYearId,
          status: 'active',
        },
      });
      await db.studentProgramEnrollment.create({
        data: {
          org_id: orgId,
          student_school_year_id: ssy.id,
          program_id: programId,
          level_id: grade1LevelId,
          status: 'active',
        },
      });
    });

    // ── 6. semester settings (term dates) — first sem fully in the past ─────
    let sem1Id = '';

    await step('saveTermDates (semester settings from the past)', async () => {
      const assignment = await db.programSemesterAssignment.findUnique({
        where: { program_id: programId },
        include: {
          template: {
            include: {
              semesters: {
                orderBy: { order_index: 'asc' },
                include: { terms: { orderBy: { order_index: 'asc' } } },
              },
            },
          },
        },
      });
      if (!assignment) throw new Error('No semester template assigned to elementary program.');

      const termDates: Array<{ termId: string; startDate: string; endDate: string }> = [];
      assignment.template.semesters.forEach((sem, si) => {
        const per = si === 0 ? SEM1_TERMS : SEM2_TERMS;
        sem.terms.forEach((t, ti) => {
          termDates.push({ termId: t.id, startDate: per[ti][0], endDate: per[ti][1] });
        });
      });

      await semesterTemplateService.saveTermDates(orgId, programId, termDates);

      const sem1 = await db.semester.findFirst({
        where: { org_id: orgId, school_year_id: schoolYearId, name: '1st' },
      });
      if (!sem1) throw new Error('First semester row was not created by saveTermDates.');
      sem1Id = sem1.id;
      termId = assignment.template.semesters[0].terms[0].id;

      log(`term dates set — Semester 1 runs ${fmt(sem1.start_date)} → ${fmt(sem1.end_date)} (ENDED)`);
      log(`class will use template term id ${termId}`);
    });

    // ── 7. class (MAPEH Grade 1, first semester) ─────────────────────────────
    await step('create MAPEH Grade 1 class (semester ended 2026-08-15)', async () => {
      const cls = await classService.create(
        orgId,
        {
          subjectId,
          educatorId,
          schoolYearId,
          semesterId: sem1Id,
          capacity: 40,
          schedules: [{ weekday: 1, startTime: '08:00', endTime: '09:00' }],
        },
        actorId,
      );
      if (!cls) throw new Error('Class creation returned null.');
      classId = cls.id;
      log(`class ${classId} created`);
    });

    // ── 8. apply grading scheme to the class ─────────────────────────────────
    await step('apply Elementary Scheme to class', async () => {
      await gradingSchemeService.applyTemplateToClass(orgId, {
        classId,
        templateId: schemeTemplateId,
        name: 'Elementary Scheme (Playground)',
      });
    });

    // ── 9. enroll student (prerequisite gate must pass for MAPEH Gr 1) ───────
    await step('enroll student in the class', async () => {
      await enrollmentService.enroll(classId, subjectId, sem1Id, 40, studentId, orgId);
    });

    // ── 10. create MANUAL assessment for Term 1 ──────────────────────────────
    let manualQuestionId = '';
    await step('create manual assessment (Term 1, type activity)', async () => {
      const dto: CreateAssessmentDto = {
        termId,
        type: 'activity',
        title: 'MAPEH Activity 1 — Shapes and Sounds',
        totalItems: 10,
        gradingMode: GradingMode.MANUAL,
        manualMaxScore: 10,
        showBreakdown: true,
        manualInstructions: 'Perform and describe the activity. Show your work clearly.',
        releaseDate: SY_START, // released Aug 1 (past)
        endDate: '2026-12-31', // still open so the student can submit "now"
      };
      const assessment = await assessmentService.create(classId, orgId, educatorId, dto);
      assessmentId = assessment.id;
      const questions = (assessment as any).questions ?? [];
      if (!questions.length) throw new Error('No questions created for manual assessment.');
      manualQuestionId = questions[0].id;
      log(`assessment ${assessmentId} created (manual, 1 question)`);
    });

    // ── 11. student submits ──────────────────────────────────────────────────
    await step('student start → save draft → finish', async () => {
      await submissionService.startOrResume(assessmentId, orgId, studentId);
      await submissionService.saveDraft(assessmentId, orgId, studentId, {
        answers: [{ questionId: manualQuestionId, answer: 'My answer draft.' }],
      });
      const finished = await submissionService.finish(assessmentId, orgId, studentId, {
        answers: [{ questionId: manualQuestionId, answer: 'My final answer.' }],
      });
      submissionId = finished.submissionId;
      log(`submitted (${submissionId})`);
    });

    // ── 12. educator grades the essay ────────────────────────────────────────
    await step('educator gradeEssay (8/10)', async () => {
      const dto: GradeEssayDto = { score: 8 };
      await assessmentService.gradeEssay(assessmentId, submissionId, orgId, educatorId, dto);
    });

    // ── 13. compute grades for Term 1 ────────────────────────────────────────
    const computed = { grade: null as { final_score: number; final_grade: string } | null };
    await step('computeGrades(Term 1)', async () => {
      const result = await gradeEducatorService.computeGrades(classId, termId, orgId, educatorId);
      log(`computeGrades → ${JSON.stringify(result)}`);
      computed.grade = await db.grade.findFirst({
        where: { org_id: orgId, student_id: studentId, class_id: classId, term_id: termId },
        select: { final_score: true, final_grade: true },
      });
    });

    const scheme = await db.gradingScheme.findFirst({
      where: { class_id: classId, org_id: orgId },
      include: { components: true },
    });
    const scale = await db.gradingScaleAssignment.findFirst({
      where: { org_id: orgId, program_id: programId, school_year_id: schoolYearId },
      include: { grading_scale: true },
    });

    log('');
    log('================== PLAYGROUND RESULT ==================');
    log(`org            : ${orgId}`);
    log(`school year    : ${SY_NAME} (${SY_START} → ${SY_END})`);
    log(`semester 1     : 2026-08-01 → 2026-08-15 (ENDED)`);
    log(`assessment     : ${assessmentId} (manual, type=activity)`);
    log(`grading scheme : ${scheme?.name ?? '-'}`);
    log(`  components   : ${scheme?.components.map((c) => `${c.name}(${c.type},${c.weight})`).join(', ') ?? '-'}`);
    log(`grading scale  : ${scale?.grading_scale?.name ?? '-'}`);
    log(`TERM 1 GRADE   : score=${computed.grade?.final_score ?? '?'}  grade=${computed.grade?.final_grade ?? '?'}`);
    log('======================================================');
    log('Students should be able to see this grade in the app.');
  } finally {
    if (!KEEP_ORG) {
      log(`--- CLEANUP: deleting rows for ${orgId} ---`);
      await cleanup(db, orgId, schoolYearId);
      log('Cleanup complete. (Use --keep to preserve the data.)');
    } else {
      log(`--- --keep set: preserved org ${orgId} (school year ${schoolYearId}) ---`);
    }
    await app.close();
  }
}

async function cleanup(db: DatabaseService, orgId: string, schoolYearId: string): Promise<void> {
  const common = { org_id: orgId };
  const attempts: Array<[string, () => Promise<unknown>]> = [
    ['audit logs', () => db.auditLog.deleteMany({ where: common })],
    ['concern categories', () => db.concernCategory.deleteMany({ where: common })],
    ['org concern settings', () => db.orgConcernSetting.deleteMany({ where: common })],
    ['org enrollment settings', () => db.orgEnrollmentSetting.deleteMany({ where: common })],
    ['submission answers', () => db.submissionAnswer.deleteMany({ where: common })],
    ['submissions', () => db.submission.deleteMany({ where: common })],
    ['questions', () => db.question.deleteMany({ where: common })],
    ['assessments', () => db.assessment.deleteMany({ where: common })],
    ['grade lock events', () => db.gradeLockEvent.deleteMany({ where: common })],
    ['grade locks', () => db.gradeLock.deleteMany({ where: common })],
    ['grade lock settings', () => db.gradeLockSetting.deleteMany({ where: common })],
    ['manual scores', () => db.manualScore.deleteMany({ where: common })],
    ['grades', () => db.grade.deleteMany({ where: common })],
    ['attendance records', () => db.attendanceRecord.deleteMany({ where: common })],
    ['attendance sessions', () => db.attendanceSession.deleteMany({ where: common })],
    ['class ownership logs', () => db.classOwnershipLog.deleteMany({ where: common })],
    ['enrollments', () => db.enrollment.deleteMany({ where: common })],
    ['class schedules', () => db.classSchedule.deleteMany({ where: common })],
    // GradingScheme references class_id, so it must go before Class rows.
    ['grading scheme components', () => db.gradingSchemeComponent.deleteMany({ where: common })],
    ['grading schemes', () => db.gradingScheme.deleteMany({ where: common })],
    ['classes', () => db.class.deleteMany({ where: common })],
    ['student program enrollments', () => db.studentProgramEnrollment.deleteMany({ where: common })],
    ['student school years', () => db.studentSchoolYear.deleteMany({ where: common })],
    ['terms', () => db.term.deleteMany({ where: common })],
    ['semesters', () => db.semester.deleteMany({ where: common })],
    ['program semester term dates', () => db.programSemesterTermDate.deleteMany({ where: common })],
    ['program semester assignments', () => db.programSemesterAssignment.deleteMany({ where: common })],
    ['semester template terms', () => db.semesterTemplateTerm.deleteMany({ where: common })],
    ['semester template items', () => db.semesterTemplateItem.deleteMany({ where: common })],
    ['semester templates', () => db.semesterTemplate.deleteMany({ where: common })],
    ['grading scale assignments', () => db.gradingScaleAssignment.deleteMany({ where: common })],
    ['grading scales', () => db.gradingScale.deleteMany({ where: common })],
    ['grading scheme template components', () => db.gradingSchemeTemplateComponent.deleteMany({ where: common })],
    ['grading scheme templates', () => db.gradingSchemeTemplate.deleteMany({ where: common })],
    ['program calendar holidays', () => db.programCalendarHoliday.deleteMany({ where: common })],
    ['program calendar terms', () => db.programCalendarTerm.deleteMany({ where: common })],
    ['program calendar breaks', () => db.programCalendarBreak.deleteMany({ where: common })],
    ['program calendars', () => db.programCalendar.deleteMany({ where: common })],
    ['subject prerequisites', () => db.subjectPrerequisite.deleteMany({ where: common })],
    ['subject sharings', () => db.subjectSharing.deleteMany({ where: common })],
    ['subjects', () => db.subject.deleteMany({ where: common })],
    ['sections', () => db.section.deleteMany({ where: common })],
    ['levels', () => db.level.deleteMany({ where: common })],
    ['strands', () => db.strand.deleteMany({ where: common })],
    ['courses', () => db.course.deleteMany({ where: common })],
    ['programs', () => db.program.deleteMany({ where: common })],
  ];

  // Child rows FIRST, so parent rows can be removed without FK violations.
  for (const [label, fn] of attempts) {
    try {
      await fn();
    } catch (err) {
      log(`cleanup skip ${label}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const accountIds = (await db.account.findMany({ where: { org_id: orgId }, select: { id: true } })).map((a) => a.id);
  if (accountIds.length) {
    await db.profile.deleteMany({ where: { account_id: { in: accountIds } } });
    await db.account.deleteMany({ where: { id: { in: accountIds } } });
  }
  await db.schoolYear.deleteMany({ where: { id: schoolYearId } });
  await db.organization.deleteMany({ where: { id: orgId } });
}

main().catch((err) => {
  console.error('[playground] FATAL:', err);
  process.exit(1);
});