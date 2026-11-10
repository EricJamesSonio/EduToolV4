/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */

// backend/test/school-year-lifecycle.e2e-spec.ts
//
// One school, one school year, from the platform owner creating the admin to the grade
// lock. Everything is driven through the real HTTP API with the real guards, validation
// and services. The JavaScript clock is controlled so the school year can start and
// end inside a single test run.
//
// The school year is 3 days long and the clock never moves more than ~4.5 days ahead.
// The school-year expiry sweep is global, so do not run this against a database that
// holds real active school years ending inside that window.
//
// The last steps (regrading after the year ended, the lock finalising grades, the
// subject completion record, the academic history outcome) describe behaviour the
// application does not have yet and are expected to fail until it is built.

import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SchedulerRegistry } from '@nestjs/schedule';

import { AppModule } from '@/app.module';
import { DatabaseService } from '@/core/database/database.provider';
import { HttpExceptionFilter } from '@/commons/filters/http-exception.filter';
import { AllExceptionFilter } from '@/commons/filters/all-exception.filter';
import { ResponseInterceptor } from '@/commons/interceptors/response.interceptor';
import { hashPassword } from '@/commons/utils/hash.util';
import { ComponentType } from '@/modules/grading-scheme/dto/grading-scheme.dto';

import { genShortId } from './utils/id.util';
import { isDatabaseReachable } from './utils/net.util';
import { ApiClient } from './support/e2e-http';
import { e2eClock } from './support/e2e-clock';
import { cleanupOrganization } from './support/e2e-cleanup';

if (!process.env.DATABASE_URL) {
  loadEnv({ path: path.join(__dirname, '..', '.env') });
}

const dbUp =
  !!process.env.DATABASE_URL && isDatabaseReachable(process.env.DATABASE_URL);
if (!dbUp) {
  console.log('[lifecycle e2e] SKIPPED: database not reachable.');
}
const runSuite = dbUp ? describe : describe.skip;

jest.setTimeout(600000);

const HOUR_MS = 60 * 60 * 1000;
const SUBJECT_NAME = 'Data Structures';
const MAX_SCORE = 10;
const FIRST_SCORES = [9, 6];
const REGRADED_SCORE = 8;
const OWNER_PASSWORD = 'Owner#12345';

interface Login {
  id: string;
  email: string;
  password: string;
}

interface Ctx {
  platformOwnerId: string;
  admin: Login;
  orgId: string;
  schoolYearId: string;
  programId: string;
  programType: string;
  courseId: string;
  levelId: string;
  sectionId: string;
  subjectId: string;
  semesterTemplateId: string;
  termId: string;
  educator: Login;
  students: Login[];
  classId: string;
  lockSettingId: string;
  assessmentId: string;
  questionId: string;
  submissionIds: Record<string, string>;
}

function dayStart(base: Date, offsetDays: number, hour = 0): Date {
  return new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + offsetDays,
    hour,
  );
}

function ymd(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const settle = (ms = 1500): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const log = (message: string): void =>
  console.log(`[lifecycle e2e] ${message}`);

runSuite('School year lifecycle (real HTTP, controlled clock)', () => {
  let app: NestExpressApplication;
  let db: DatabaseService;
  let api: ApiClient;

  let t0: Date;
  let syStart: Date;
  let syEnd: Date;
  let lockDeadline: Date;
  let yearEndedAt: Date;
  let lockedAt: Date;

  const rand = genShortId(8);
  const ctx = {} as Ctx;

  async function login(
    account: Pick<Login, 'email' | 'password'>,
  ): Promise<string> {
    const data = await api.call<{ accessToken: string }>(
      'post',
      '/auth/login',
      { body: { email: account.email, password: account.password } },
    );
    return data.accessToken;
  }

  function stopBackgroundJobs(): void {
    try {
      const registry = app.get(SchedulerRegistry);
      registry.getCronJobs().forEach((job) => job.stop());
    } catch (err) {
      log(`could not stop cron jobs: ${String(err)}`);
    }
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.set('trust proxy', true);
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter(), new AllExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    stopBackgroundJobs();

    db = app.get(DatabaseService);
    api = new ApiClient(app);

    e2eClock.start(new Date());
    t0 = new Date();
    syStart = dayStart(t0, 0);
    syEnd = dayStart(t0, 3);
    lockDeadline = dayStart(t0, 4);
    yearEndedAt = dayStart(t0, 3, 12);
    lockedAt = dayStart(t0, 4, 12);

    ctx.students = [];
    ctx.submissionIds = {};
  }, 240000);

  afterAll(async () => {
    e2eClock.stop();
    if (!db) return;

    if (process.env.E2E_KEEP === '1') {
      log(`E2E_KEEP=1, kept organization ${ctx.orgId ?? '(none)'}`);
    } else {
      await cleanupOrganization(
        db,
        {
          orgId: ctx.orgId,
          accountIds: [ctx.platformOwnerId, ctx.admin?.id].filter(
            (id): id is string => !!id,
          ),
        },
        log,
      );
    }
    await app.close();
  }, 180000);

  // ── 1. Organization ───────────────────────────────────────────────────────

  it('1. platform owner creates the school admin account', async () => {
    const ownerEmail = `owner.${rand}@e2e.test`;
    const owner = await db.account.create({
      data: {
        role: 'platform_owner',
        email: ownerEmail,
        password: await hashPassword(OWNER_PASSWORD),
        status: 'active',
        profile: { create: { full_name: 'E2E Platform Owner' } },
      },
    });
    ctx.platformOwnerId = owner.id;

    const ownerToken = await login({
      email: ownerEmail,
      password: OWNER_PASSWORD,
    });
    const created = await api.call<any>('post', '/platform/admins', {
      token: ownerToken,
      body: { email: `admin.${rand}@e2e.test`, fullName: 'E2E School Admin' },
    });

    expect(created.password).toBeTruthy();
    ctx.admin = {
      id: created.id,
      email: created.email,
      password: created.password,
    };
  });

  it('2. admin creates the organization and sets its email extension', async () => {
    const token = await login(ctx.admin);

    const org = await api.call<any>('post', '/organization', {
      token,
      body: {
        name: `E2E School ${rand}`,
        description: 'Lifecycle e2e school',
        address: 'Urdaneta, Pangasinan',
      },
    });
    ctx.orgId = org.id;

    await api.call('patch', '/organization', {
      token,
      body: { emailExtension: `@e2e${rand}.test` },
    });

    const own = await api.call<any>('get', '/organization', { token });
    expect(own.id).toBe(ctx.orgId);
    expect(own.emailExtension).toBe(`@e2e${rand}.test`);
  });

  // ── 2. School profile: college, BSCS, one level, one section, one subject ──

  it('3. admin sets up the school profile with only BSCS, 1st Year, one section and Data Structures', async () => {
    const token = await login(ctx.admin);

    await api.call('post', '/school-profile/save', {
      token,
      body: {
        departments: [
          {
            type: 'college',
            courses: [
              {
                name: 'Bachelor of Science in Computer Science',
                code: 'BSCS',
                levels: [
                  {
                    name: '1st Year',
                    orderIndex: 0,
                    sections: [{ name: 'A', capacity: 40 }],
                    subjects: [
                      { name: SUBJECT_NAME, subjectType: 'major' },
                    ],
                  },
                ],
              },
            ],
            strands: [],
            levels: [],
            subjects: [],
          },
        ],
      },
    });

    const profile = await api.call<any>('get', '/school-profile', { token });
    const serialized = JSON.stringify(profile);
    expect(serialized).toContain('BSCS');
    expect(serialized).toContain(SUBJECT_NAME);

    const where = { org_id: ctx.orgId };
    expect(await db.schoolProfileDepartment.count({ where })).toBe(1);
    expect(await db.schoolProfileCourse.count({ where })).toBe(1);
    expect(await db.schoolProfileLevel.count({ where })).toBe(1);
    expect(await db.schoolProfileSection.count({ where })).toBe(1);
    expect(await db.schoolProfileSubject.count({ where })).toBe(1);
  });

  // ── 3. School year, then seed it ──────────────────────────────────────────

  it('4. admin creates the school year and seeds it from the profile', async () => {
    const token = await login(ctx.admin);

    const created = await api.call<any>('post', '/school-years', {
      token,
      body: {
        start_date: syStart.toISOString(),
        end_date: syEnd.toISOString(),
        confirm_short_duration: true,
      },
    });
    ctx.schoolYearId = created.data.id;
    expect(created.data.status).toBe('pending');

    await api.call('post', '/organization/seed', {
      token,
      body: {
        schoolYearId: ctx.schoolYearId,
        programs: ['college'],
        seedGradingScales: false,
        seedGradingSchemes: false,
        seedSemesterTemplates: false,
        seedProgramCalendars: false,
      },
    });

    const scope = { org_id: ctx.orgId, school_year_id: ctx.schoolYearId };
    const programs = await db.program.findMany({ where: scope });
    const courses = await db.course.findMany({ where: scope });
    const levels = await db.level.findMany({ where: scope });
    const sections = await db.section.findMany({ where: scope });
    const subjects = await db.subject.findMany({
      where: { org_id: ctx.orgId },
    });

    expect(programs).toHaveLength(1);
    expect(courses.map((c) => c.code)).toEqual(['BSCS']);
    expect(levels.map((l) => l.name)).toEqual(['1st Year']);
    expect(sections).toHaveLength(1);
    expect(subjects.map((s) => s.name)).toEqual([SUBJECT_NAME]);

    ctx.programId = programs[0].id;
    ctx.programType = programs[0].type;
    ctx.courseId = courses[0].id;
    ctx.levelId = levels[0].id;
    ctx.sectionId = sections[0].id;
    ctx.subjectId = subjects[0].id;
  });

  // ── 4. Semester settings, grading scale, grading scheme ───────────────────

  it('5. admin configures the semester settings (template, calendar, term dates)', async () => {
    const token = await login(ctx.admin);

    const template = await api.call<any>('post', '/semester-templates', {
      token,
      body: {
        name: `E2E Semester ${rand}`,
        programType: ctx.programType,
        semesters: [
          {
            name: '1st Semester',
            orderIndex: 1,
            terms: [{ name: 'Term 1', orderIndex: 1 }],
          },
        ],
      },
    });
    ctx.semesterTemplateId = template.id;

    await api.call('post', '/program-calendars', {
      token,
      body: {
        schoolYearId: ctx.schoolYearId,
        programId: ctx.programId,
        startDate: ymd(syStart),
        endDate: ymd(syEnd),
        notes: 'E2E lifecycle calendar',
        breaks: [
          {
            label: 'Semester 1',
            startDate: ymd(syStart),
            endDate: ymd(syEnd),
          },
        ],
      },
    });

    const termDates = await api.call<any[]>(
      'get',
      `/semester-templates/assignments/${ctx.programId}/default-term-dates`,
      { token, query: { templateId: ctx.semesterTemplateId } },
    );
    expect(termDates).toHaveLength(1);

    await api.call('post', '/semester-templates/assignments', {
      token,
      body: {
        programId: ctx.programId,
        templateId: ctx.semesterTemplateId,
        termDates,
      },
    });

    const semesters = await db.semester.findMany({
      where: { org_id: ctx.orgId, school_year_id: ctx.schoolYearId },
    });
    expect(semesters).toHaveLength(1);

    const term = await db.semesterTemplateTerm.findFirstOrThrow({
      where: {
        org_id: ctx.orgId,
        semester: { template_id: ctx.semesterTemplateId },
      },
    });
    ctx.termId = term.id;
  });

  it('6. admin creates a grading scale and assigns it to the department', async () => {
    const token = await login(ctx.admin);

    const scale = await api.call<any>('post', '/grading-scales', {
      token,
      body: {
        name: `E2E Scale ${rand}`,
        programType: ctx.programType,
        ranges: [
          {
            minPercent: 0,
            maxPercent: 74,
            gradeValue: 'F',
            remark: 'Failed',
            isPassing: false,
          },
          {
            minPercent: 75,
            maxPercent: 100,
            gradeValue: 'P',
            remark: 'Passed',
            isPassing: true,
          },
        ],
      },
    });

    await api.call(
      'post',
      `/grading-scales/programs/${ctx.programId}/grading-scale`,
      { token, body: { scaleId: scale.id, schoolYearId: ctx.schoolYearId } },
    );

    expect(
      await db.gradingScaleAssignment.count({
        where: { org_id: ctx.orgId, school_year_id: ctx.schoolYearId },
      }),
    ).toBe(1);
  });

  it('7. admin creates a grading scheme template and applies it to the department', async () => {
    const token = await login(ctx.admin);

    const template = await api.call<any>('post', '/grading-scheme-templates', {
      token,
      body: {
        name: `E2E Scheme ${rand}`,
        programType: ctx.programType,
        components: [
          { name: 'Quizzes', type: ComponentType.QUIZ, weight: 50 },
          { name: 'Exams', type: ComponentType.EXAM, weight: 50 },
        ],
      },
    });

    await api.call('post', '/grading-scheme-templates/apply/program', {
      token,
      body: { programId: ctx.programId, templateId: template.id },
    });

    expect(
      await db.gradingSchemeProgramAssignment.count({
        where: { org_id: ctx.orgId, school_year_id: ctx.schoolYearId },
      }),
    ).toBe(1);
  });

  // ── 5. People, class, grade lock ──────────────────────────────────────────

  it('8. admin creates one educator and two students', async () => {
    const token = await login(ctx.admin);

    const educator = await api.call<any>('post', '/educators', {
      token,
      body: { fullName: 'E2E Educator', emailName: `edu${rand}` },
    });
    ctx.educator = {
      id: educator.id,
      email: educator.email,
      password: educator.plainPassword,
    };
    expect(ctx.educator.email).toContain(`@educator.e2e${rand}.test`);

    const names = ['E2E Student One', 'E2E Student Two'];
    for (const [index, fullName] of names.entries()) {
      const student = await api.call<any>('post', '/students', {
        token,
        body: {
          fullName,
          emailName: `stu${index + 1}${rand}`,
          studentId: `E2E-${rand}-00${index + 1}`,
        },
      });
      ctx.students.push({
        id: student.id,
        email: student.email,
        password: student.plainPassword,
      });
    }
    expect(ctx.students).toHaveLength(2);
  });

  it('9. admin creates the Data Structures class and it inherits the grading scheme', async () => {
    const token = await login(ctx.admin);

    const cls = await api.call<any>('post', '/classes', {
      token,
      body: {
        subjectId: ctx.subjectId,
        educatorId: ctx.educator.id,
        sectionId: ctx.sectionId,
        schoolYearId: ctx.schoolYearId,
        schedules: [{ weekday: 1, startTime: '08:00', endTime: '09:00' }],
      },
    });
    ctx.classId = cls.id;

    const scheme = await db.gradingScheme.findFirst({
      where: { class_id: ctx.classId },
      include: { components: true },
    });
    expect(scheme).not.toBeNull();
    expect(scheme?.components).toHaveLength(2);

    const stored = await db.class.findUniqueOrThrow({
      where: { id: ctx.classId },
    });
    expect(stored.capacity).toBe(40);
  });

  it('10. admin creates the grade lock setting for the school year and assigns it to the class', async () => {
    const token = await login(ctx.admin);

    const setting = await api.call<any>('post', '/grade-lock/settings', {
      token,
      body: {
        name: `E2E Lock ${rand}`,
        lockType: 'hard',
        lock_deadline: lockDeadline.toISOString(),
        allowOverride: false,
      },
    });
    ctx.lockSettingId = setting.id;

    await api.call('post', '/grade-lock/assign', {
      token,
      body: { class_id: ctx.classId, setting_id: ctx.lockSettingId },
    });

    const lock = await db.gradeLock.findUniqueOrThrow({
      where: { class_id: ctx.classId },
    });
    expect(lock.is_locked).toBe(false);
    expect(lock.setting_id).toBe(ctx.lockSettingId);
  });

  // ── 6. Activate and enroll ────────────────────────────────────────────────

  it('11. the school year is ready and the admin activates it', async () => {
    const token = await login(ctx.admin);

    const readiness = await api.call<any>(
      'get',
      `/school-years/${ctx.schoolYearId}/readiness`,
      { token },
    );
    expect({ ready: readiness.ready, issues: readiness.issues }).toEqual({
      ready: true,
      issues: [],
    });

    const activated = await api.call<any>(
      'patch',
      `/school-years/${ctx.schoolYearId}/activate`,
      { token },
    );
    expect(activated.status).toBe('active');
  });

  it('12. admin enrolls both students in the school year, the department and the class', async () => {
    const token = await login(ctx.admin);

    for (const student of ctx.students) {
      await api.call('post', `/school-years/${ctx.schoolYearId}/enrollments`, {
        token,
        body: { student_id: student.id },
      });
      await api.call(
        'post',
        `/school-years/${ctx.schoolYearId}/enrollments/students/${student.id}/programs`,
        {
          token,
          body: {
            program_id: ctx.programId,
            level_id: ctx.levelId,
            course_id: ctx.courseId,
            section_id: ctx.sectionId,
          },
        },
      );
      const enrolled = await api.call<any>(
        'post',
        `/classes/${ctx.classId}/enroll`,
        { token, body: { studentId: student.id } },
      );
      expect(enrolled.overflow).toBeUndefined();
    }

    const enrollments = await db.enrollment.findMany({
      where: { class_id: ctx.classId },
    });
    expect(enrollments.filter((e) => e.status === 'active')).toHaveLength(2);

    const accounts = await db.account.findMany({
      where: { id: { in: ctx.students.map((s) => s.id) } },
    });
    accounts.forEach((account) => expect(account.status).toBe('active'));
  });

  // ── 7. Assessment, taken by the students, graded by the educator ──────────

  it('13. educator creates an assessment; students can only take it after its release time', async () => {
    const educatorToken = await login(ctx.educator);

    const assessment = await api.call<any>(
      'post',
      `/classes/${ctx.classId}/assessments`,
      {
        token: educatorToken,
        body: {
          termId: ctx.termId,
          type: ComponentType.QUIZ,
          title: 'Stacks and Queues Quiz',
          totalItems: MAX_SCORE,
          gradingMode: 'manual',
          manualMaxScore: MAX_SCORE,
          manualInstructions: 'Explain how a stack differs from a queue.',
          releaseDate: new Date(t0.getTime() + 2 * HOUR_MS).toISOString(),
          endDate: new Date(t0.getTime() + 20 * HOUR_MS).toISOString(),
        },
      },
    );
    ctx.assessmentId = assessment.id;

    const questionId =
      assessment.questions?.[0]?.id ??
      (
        await api.call<any>(
          'get',
          `/classes/${ctx.classId}/assessments/${ctx.assessmentId}`,
          { token: educatorToken },
        )
      ).questions[0].id;
    ctx.questionId = questionId;

    const earlyToken = await login(ctx.students[0]);
    const early = await api.raw(
      'post',
      `/assessments/${ctx.assessmentId}/submit`,
      { token: earlyToken },
    );
    expect(early.status).toBe(403);

    e2eClock.set(new Date(t0.getTime() + 3 * HOUR_MS));

    for (const [index, student] of ctx.students.entries()) {
      const token = await login(student);
      await api.call('post', `/assessments/${ctx.assessmentId}/submit`, {
        token,
      });
      await api.call('patch', `/assessments/${ctx.assessmentId}/submit/save`, {
        token,
        body: {
          answers: [
            { questionId: ctx.questionId, answer: `Draft ${index + 1}` },
          ],
        },
      });
      const finished = await api.call<any>(
        'post',
        `/assessments/${ctx.assessmentId}/submit/finish`,
        {
          token,
          body: {
            answers: [
              { questionId: ctx.questionId, answer: `Final ${index + 1}` },
            ],
          },
        },
      );
      ctx.submissionIds[student.id] = finished.submissionId;
    }

    const submissions = await db.submission.findMany({
      where: { assessment_id: ctx.assessmentId },
    });
    expect(submissions).toHaveLength(2);
    submissions.forEach((s) => expect(s.status).toBe('submitted'));
  });

  it('14. educator grades both submissions and the term grades are computed', async () => {
    await settle();
    const token = await login(ctx.educator);

    for (const [index, student] of ctx.students.entries()) {
      await api.call(
        'patch',
        `/classes/${ctx.classId}/assessments/${ctx.assessmentId}/submissions/${ctx.submissionIds[student.id]}/grade`,
        { token, body: { score: FIRST_SCORES[index] } },
      );
    }

    const computed = await api.call<any>(
      'post',
      `/classes/${ctx.classId}/grades/${ctx.termId}/compute`,
      { token },
    );
    expect(computed.computed).toBe(2);

    await api.call(
      'post',
      `/classes/${ctx.classId}/assessments/${ctx.assessmentId}/publish`,
      { token, body: {} },
    );
    await settle(2000);

    const grades = await db.grade.findMany({
      where: { class_id: ctx.classId, term_id: ctx.termId },
    });
    const byStudent = new Map(grades.map((g) => [g.student_id, g]));
    const first = byStudent.get(ctx.students[0].id);
    const second = byStudent.get(ctx.students[1].id);

    expect(first?.final_score).toBe(90);
    expect(first?.final_grade).toBe('P');
    expect(second?.final_score).toBe(60);
    expect(second?.final_grade).toBe('F');
    grades.forEach((g) => expect(g.is_locked).toBe(false));
  });

  // ── 8. End of the school year ─────────────────────────────────────────────

  it('15. the school year stays active until its end date, then ends and unenrolls the students by itself', async () => {
    const beforeToken = await login(ctx.admin);
    const before = await api.call<any[]>('get', '/school-years', {
      token: beforeToken,
    });
    expect(before.find((y) => y.id === ctx.schoolYearId).status).toBe(
      'active',
    );
    const stillActive = await db.enrollment.findMany({
      where: { class_id: ctx.classId },
    });
    stillActive.forEach((e) => expect(e.status).toBe('active'));

    e2eClock.set(yearEndedAt);

    const token = await login(ctx.admin);
    const after = await api.call<any[]>('get', '/school-years', { token });
    expect(after.find((y) => y.id === ctx.schoolYearId).status).toBe('ended');

    const classEnrollments = await db.enrollment.findMany({
      where: { class_id: ctx.classId },
    });
    expect(classEnrollments).toHaveLength(2);
    classEnrollments.forEach((e) => expect(e.status).toBe('removed'));

    const listing = await api.call<any>(
      'get',
      `/school-years/${ctx.schoolYearId}/enrollments`,
      { token },
    );
    expect(listing.data).toHaveLength(2);
    listing.data.forEach((row: any) => {
      expect(row.status).toBe('unenrolled');
      expect(row.unenrolled_at).toBeTruthy();
    });

    const accounts = await db.account.findMany({
      where: { id: { in: ctx.students.map((s) => s.id) } },
    });
    accounts.forEach((account) => expect(account.status).toBe('active'));

    for (const student of ctx.students) {
      const active = await api.call<any[]>(
        'get',
        `/students/${student.id}/enrollments`,
        { token },
      );
      expect(active).toHaveLength(0);
    }

    const archived = await api.raw(
      'patch',
      `/school-years/${ctx.schoolYearId}`,
      { token, body: { name: 'Renamed after the end' } },
    );
    expect(archived.status).toBe(400);
  });

  // ── 9. Grading stays open until the grade lock ────────────────────────────

  it('16. EXPECTED GAP: the educator can still regrade after the year ended, until the grade lock', async () => {
    const token = await login(ctx.educator);

    await api.call(
      'patch',
      `/classes/${ctx.classId}/assessments/${ctx.assessmentId}/submissions/${ctx.submissionIds[ctx.students[1].id]}/grade`,
      { token, body: { score: REGRADED_SCORE } },
    );

    const computed = await api.call<any>(
      'post',
      `/classes/${ctx.classId}/grades/${ctx.termId}/compute`,
      { token },
    );
    expect(computed.computed).toBe(2);

    const second = await db.grade.findFirst({
      where: {
        class_id: ctx.classId,
        term_id: ctx.termId,
        student_id: ctx.students[1].id,
      },
    });
    expect(second?.final_score).toBe(80);
    expect(second?.final_grade).toBe('P');
  });

  it('17. the grade lock stays open before its deadline, then locks the class automatically', async () => {
    const earlyToken = await login(ctx.admin);
    const early = await api.call<any>('post', '/grade-lock/auto-lock', {
      token: earlyToken,
    });
    expect(early.lockedCount).toBe(0);
    const stillOpen = await db.gradeLock.findUniqueOrThrow({
      where: { class_id: ctx.classId },
    });
    expect(stillOpen.is_locked).toBe(false);

    e2eClock.set(lockedAt);

    const token = await login(ctx.admin);
    const locked = await api.call<any>('post', '/grade-lock/auto-lock', {
      token,
    });
    expect(locked.lockedCount).toBeGreaterThanOrEqual(1);

    const lock = await db.gradeLock.findUniqueOrThrow({
      where: { class_id: ctx.classId },
    });
    expect(lock.is_locked).toBe(true);
    expect(lock.locked_by).toBe('system');

    const educatorToken = await login(ctx.educator);
    const unlock = await api.raw(
      'post',
      `/grade-lock/${ctx.classId}/unlock`,
      { token: educatorToken, body: { reason: 'One more correction' } },
    );
    expect(unlock.status).toBe(403);
  });

  // ── 10. What the lock must leave behind ───────────────────────────────────

  it('18. EXPECTED GAP: locking the class finalises every grade', async () => {
    const grades = await db.grade.findMany({
      where: { class_id: ctx.classId, term_id: ctx.termId },
    });
    expect(grades).toHaveLength(2);
    grades.forEach((g) => expect(g.is_locked).toBe(true));
  });

  it('19. EXPECTED GAP: each student has Data Structures saved as a completed subject', async () => {
    const token = await login(ctx.admin);

    for (const student of ctx.students) {
      const records = await api.call<any[]>(
        'get',
        `/students/${student.id}/subject-completions`,
        { token },
      );
      const record = records.find((r) => r.subject_id === ctx.subjectId);
      expect(record?.status).toBe('completed');

      const statuses = await api.call<Record<string, any>>(
        'get',
        `/students/${student.id}/subject-completions/statuses`,
        { token, query: { subjectIds: ctx.subjectId } },
      );
      expect(statuses[ctx.subjectId]?.status).toBe('completed');
    }
  });

  it('20. EXPECTED GAP: the academic history records the result of the class', async () => {
    const token = await login(ctx.admin);

    for (const student of ctx.students) {
      const history = await api.call<any[]>(
        'get',
        `/academic-history/${student.id}`,
        { token },
      );
      const year = history.find((h) => h.schoolYear?.id === ctx.schoolYearId);
      expect(year).toBeDefined();

      const row = year.enrollments.find(
        (e: any) => e.class?.subject?.name === SUBJECT_NAME,
      );
      expect(row).toBeDefined();
      expect(row.status).toBe('removed');
      expect(row.outcome).toBe('passed');

      const timeline = await api.call<any[]>(
        'get',
        `/academic-history/${student.id}/timeline`,
        { token, query: { schoolYearId: ctx.schoolYearId } },
      );
      expect(
        timeline.some(
          (event) =>
            event.type === 'outcome_set' &&
            event.data?.subjectName === SUBJECT_NAME,
        ),
      ).toBe(true);
    }
  });
});