// backend/test/late-enrollment-grading.e2e-spec.ts
//
// Real-database e2e for the late-enrollment grading exclusion rule and the
// Phase 3 override API, modeled on org-seeder.e2e-spec.ts conventions:
// real Prisma client, real services, a unique test org per run, explicit
// cleanup. Ownership rejection (test 6) is verified over real HTTP through
// the real JWT AuthGuard + RolesGuard + service, not a mocked guard.

import * as path from 'path';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { config as loadEnv } from 'dotenv';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { v4 as uuid } from 'uuid';

import { DatabaseModule } from '@/core/database/database.module';
import { DatabaseService } from '@/core/database/database.provider';
import { GradeCoreModule } from '@/modules/grade/core/grade-core.module';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { GradeRepository } from '@/modules/grade/grade.repository';
import { GradeEducatorService } from '@/modules/grade/educator/grade-educator.service';
import { GradeEducatorController } from '@/modules/grade/educator/grade-educator.controller';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';
import jwtConfig from '@/configs/jwt.config';

if (!process.env.DATABASE_URL) {
  loadEnv({ path: path.join(__dirname, '..', '.env') });
}

const hasDbUrl = !!process.env.DATABASE_URL;
const log = (msg: string) => console.log(`[late-enrollment e2e] ${msg}`);

async function check(
  label: string,
  fn: () => void | Promise<unknown>,
): Promise<void> {
  try {
    await fn();
    log(`PASS ${label}`);
  } catch (err) {
    log(`FAIL ${label} — ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }
}

const DAY = 24 * 60 * 60 * 1000;

jest.setTimeout(120000);

function signToken(secret: string | undefined, sub: string): string {
  if (!secret)
    throw new Error('JWT_SECRET missing from env — cannot sign token.');
  return jwt.sign({ sub }, secret, { expiresIn: '1h' });
}

describe('[late-enrollment] grading exclusion — real DB end to end', () => {
  let available = false;

  let moduleRef: TestingModule;
  let app: INestApplication;
  let db: DatabaseService;
  let svc: GradeEducatorService;

  let orgId = '';
  let ownerId = '';
  let intruderId = '';
  let studentId = '';
  let classMixId = '';
  let classAllPreId = '';
  let termId = '';
  let b1Id = '';
  let p1Id = '';
  const tenantCleanups: Array<(d: DatabaseService) => Promise<unknown>> = [];
  let ownerToken = '';
  let intruderToken = '';

  beforeAll(async () => {
    if (!hasDbUrl) {
      log('SKIPPED — DATABASE_URL not set; e2e needs a real DB.');
      return;
    }
    available = true;

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [jwtConfig] }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        DatabaseModule,
        GradeCoreModule,
        AuditLogModule,
      ],
      controllers: [GradeEducatorController],
      providers: [
        GradeRepository,
        GradeEducatorService,
        AuthRepository,
        JwtStrategy,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    db = moduleRef.get(DatabaseService);
    svc = moduleRef.get(GradeEducatorService);

    const now = new Date();
    const preEnroll = new Date(now.getTime() - 10 * DAY);
    const postEnrollA = new Date(now.getTime() + 5 * DAY);
    const postEnrollB = new Date(now.getTime() + 6 * DAY);

    const org = await db.organization.create({
      data: { name: `late-enr-${uuid().slice(0, 8)}` },
    });
    orgId = org.id;
    tenantCleanups.push((d) =>
      d.organization.delete({ where: { id: org.id } }),
    );

    const schoolYear = await db.schoolYear.create({
      data: {
        org_id: org.id,
        name: `SY-${uuid().slice(0, 8)}`,
        start_date: new Date(now.getFullYear(), 0, 1),
        end_date: new Date(now.getFullYear() + 1, 0, 1),
        status: 'active',
      },
    });
    tenantCleanups.push((d) =>
      d.schoolYear.delete({ where: { id: schoolYear.id } }),
    );

    const program = await db.program.create({
      data: {
        org_id: org.id,
        school_year_id: schoolYear.id,
        name: 'P1',
        type: 'college',
      },
    });
    tenantCleanups.push((d) => d.program.delete({ where: { id: program.id } }));

    const gradingScale = await db.gradingScale.create({
      data: {
        org_id: org.id,
        name: 'E2E Scale',
        program_type: 'college',
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
    tenantCleanups.push((d) =>
      d.gradingScale.delete({ where: { id: gradingScale.id } }),
    );

    await db.gradingScaleAssignment.create({
      data: {
        org_id: org.id,
        grading_scale_id: gradingScale.id,
        program_id: program.id,
        school_year_id: schoolYear.id,
      },
    });
    tenantCleanups.push((d) =>
      d.gradingScaleAssignment.deleteMany({ where: { org_id: org.id } }),
    );

    const mkAccount = async (role: string) => {
      const a = await db.account.create({
        data: {
          org_id: org.id,
          role: role as any,
          email: `${uuid().slice(0, 12)}@late.test`,
          password: 'x',
          status: 'active',
        },
      });
      tenantCleanups.push((d) => d.account.delete({ where: { id: a.id } }));
      return a.id;
    };
    ownerId = await mkAccount('educator');
    intruderId = await mkAccount('educator');
    studentId = await mkAccount('student');

    const semester = await db.semester.create({
      data: {
        org_id: org.id,
        school_year_id: schoolYear.id,
        name: 'Sem 1',
        start_date: new Date(now.getFullYear(), 0, 1),
        end_date: new Date(now.getFullYear() + 1, 0, 1),
      },
    });
    tenantCleanups.push((d) =>
      d.semester.delete({ where: { id: semester.id } }),
    );

    const term = await db.term.create({
      data: {
        org_id: org.id,
        semester_id: semester.id,
        name: 'Term 1',
        order_index: 1,
        start_date: new Date(now.getFullYear(), 0, 1),
        end_date: new Date(now.getFullYear() + 1, 0, 1),
      },
    });
    termId = term.id;
    tenantCleanups.push((d) => d.term.delete({ where: { id: term.id } }));

    const subject = await db.subject.create({
      data: { org_id: org.id, name: 'E2E Subj', program_id: program.id },
    });
    tenantCleanups.push((d) => d.subject.delete({ where: { id: subject.id } }));

    const mkClass = async (label: string) => {
      const cls = await db.class.create({
        data: {
          org_id: org.id,
          subject_id: subject.id,
          educator_id: ownerId,
          school_year_id: schoolYear.id,
          semester_id: semester.id,
          capacity: 40,
        },
      });
      tenantCleanups.push((d) => d.class.delete({ where: { id: cls.id } }));
      return cls.id;
    };
    classMixId = await mkClass('mix');
    classAllPreId = await mkClass('all-pre');

    // Mixed class enrollment (enrolled now; pre-released assessments are excluded).
    await db.enrollment.create({
      data: {
        org_id: org.id,
        class_id: classMixId,
        student_id: studentId,
        status: 'active',
      },
    });
    // All-pre class enrollment.
    await db.enrollment.create({
      data: {
        org_id: org.id,
        class_id: classAllPreId,
        student_id: studentId,
        status: 'active',
      },
    });
    tenantCleanups.push((d) =>
      d.enrollment.deleteMany({ where: { org_id: org.id } }),
    );

    const scheme = await db.gradingScheme.create({
      data: {
        org_id: org.id,
        class_id: classMixId,
        name: 'E2E Scheme',
        is_default: true,
      },
    });
    tenantCleanups.push((d) =>
      d.gradingScheme.delete({ where: { id: scheme.id } }),
    );
    const comps = [
      { name: 'Written Tasks', type: 'written', weight: 60 },
      { name: 'Performance Task', type: 'performance', weight: 40 },
    ];
    for (const c of comps) {
      const cc = await db.gradingSchemeComponent.create({
        data: { org_id: org.id, grading_scheme_id: scheme.id, ...c },
      });
      tenantCleanups.push((d) =>
        d.gradingSchemeComponent.delete({ where: { id: cc.id } }),
      );
    }

    const mkAssessment = async (
      classId: string,
      type: string,
      title: string,
      release: Date,
      totalItems = 50,
    ) => {
      const a = await db.assessment.create({
        data: {
          org_id: org.id,
          class_id: classId,
          term_id: term.id,
          type,
          title,
          total_items: totalItems,
          release_date: release,
          end_date: new Date(now.getTime() + 30 * DAY),
          is_published: true,
        },
      });
      tenantCleanups.push((d) => d.assessment.delete({ where: { id: a.id } }));
      return a.id;
    };

    // Mixed class: B1 pre-enrollment (excluded), B2/B3 post-enrollment (included),
    // P1 performance pre-enrollment (excluded) → performance category must drop out.
    const b2Id = await mkAssessment(classMixId, 'written', 'B2', postEnrollA);
    const b3Id = await mkAssessment(classMixId, 'written', 'B3', postEnrollB);
    b1Id = await mkAssessment(classMixId, 'written', 'B1', preEnroll);
    p1Id = await mkAssessment(classMixId, 'performance', 'P1', preEnroll);
    // All-pre class: both released before enrollment.
    const aPre1 = await mkAssessment(classAllPreId, 'written', 'A1', preEnroll);
    const aPre2 = await mkAssessment(classAllPreId, 'written', 'A2', preEnroll);

    const mkSubmission = async (assessmentId: string, score: number) => {
      const s = await db.submission.create({
        data: {
          org_id: org.id,
          assessment_id: assessmentId,
          student_id: studentId,
          status: 'submitted',
          score,
          manual_score: null,
          submitted_at: now,
        },
      });
      tenantCleanups.push((d) => d.submission.delete({ where: { id: s.id } }));
      return s.id;
    };

    let subB1Id: string;
    let subP1Id: string;
    await mkSubmission(b2Id, 35); // 70%
    await mkSubmission(b3Id, 45); // 90%
    subB1Id = await mkSubmission(b1Id, 20); // 40% — excluded by default in mixed
    subP1Id = await mkSubmission(p1Id, 45); // 90% — excluded
    await mkSubmission(aPre1, 40); // 80%
    await mkSubmission(aPre2, 40); // 80%

    tenantCleanups.push((d) =>
      d.grade.deleteMany({ where: { org_id: org.id } }),
    );
    tenantCleanups.push((d) =>
      d.assessmentGradingOverride.deleteMany({ where: { org_id: org.id } }),
    );
    tenantCleanups.push((d) =>
      d.auditLog.deleteMany({ where: { org_id: org.id } }),
    );

    ownerToken = signToken(process.env.JWT_SECRET, ownerId);
    intruderToken = signToken(process.env.JWT_SECRET, intruderId);

    // Keep references for later mutation in scenario 5.
    (globalThis as any).__subB1Id = subB1Id;
    (globalThis as any).__subP1Id = subP1Id;
  });

  afterAll(async () => {
    if (!available) return;
    for (const cleanup of tenantCleanups.reverse()) {
      try {
        await cleanup(db);
      } catch {
        /* best-effort */
      }
    }
    await app.close();
    await moduleRef.close();
  });

  const breakdownByCategory = async (classId: string) => {
    const termGrades = await svc.getGradesByTerm(
      classId,
      termId,
      orgId,
      ownerId,
    );
    const student = termGrades.students.find(
      (s: any) => s.studentId === studentId,
    );
    if (!student) throw new Error('student row missing from term grades');
    return {
      written: student.categoryBreakdown.find((c: any) => c.type === 'written'),
      performance: student.categoryBreakdown.find(
        (c: any) => c.type === 'performance',
      ),
    };
  };

  const computeAndFetchGrade = async (classId: string) => {
    await svc.computeGrades(classId, termId, orgId, ownerId);
    return db.grade.findFirst({
      where: {
        org_id: orgId,
        student_id: studentId,
        class_id: classId,
        term_id: termId,
      },
    });
  };

  it('(2) mixed: only post-enrollment assessments are averaged; full drop renormalizes', async () => {
    if (!available) return;
    const bd = await breakdownByCategory(classMixId);
    await check('scenario 2 — written rawAverage = (70+90)/2 = 80', () => {
      expect(bd.written.rawAverage).toBe(80);
      expect(bd.performance.isAllExempted).toBe(true);
      expect(bd.performance.rawAverage).toBeNull();
    });

    await check(
      'scenario 2 — final grade = 80 (performance category dropped, not zero-penalized)',
      async () => {
        const grade = await computeAndFetchGrade(classMixId);
        expect(grade?.final_score).toBe(80);
      },
    );

    await check(
      'scenario 2 — excluded cells carry reason default_excluded',
      async () => {
        const termGrades = await svc.getGradesByTerm(
          classMixId,
          termId,
          orgId,
          ownerId,
        );
        const student = termGrades.students.find(
          (s: any) => s.studentId === studentId,
        );
        const b1 = student.assessmentScores.find(
          (s: any) => s.assessmentId === b1Id,
        );
        expect(b1.included).toBe(false);
        expect(b1.inclusionReason).toBe('default_excluded');
      },
    );
  });

  it('(6) HTTP: override POST works for the owner; non-owner is rejected over real HTTP', async () => {
    if (!available) return;
    const http = request(app.getHttpServer());

    await check(
      'HTTP — unauthenticated status call rejects with 401',
      async () => {
        await http
          .get(
            `/classes/${classMixId}/grades/students/${studentId}/assessments/status`,
          )
          .expect(401);
      },
    );

    await check('HTTP — non-owner GET status rejects with 403', async () => {
      await http
        .get(
          `/classes/${classMixId}/grades/students/${studentId}/assessments/status`,
        )
        .set('Authorization', `Bearer ${intruderToken}`)
        .expect(403);
    });

    await check('HTTP — non-owner POST override rejects with 403', async () => {
      await http
        .post(
          `/classes/${classMixId}/grades/students/${studentId}/assessments/${b1Id}/override`,
        )
        .set('Authorization', `Bearer ${intruderToken}`)
        .send({ overrideStatus: 'MISSING' })
        .expect(403);
    });

    await check(
      'HTTP — owner POST override succeeds and is audited',
      async () => {
        await http
          .post(
            `/classes/${classMixId}/grades/students/${studentId}/assessments/${b1Id}/override`,
          )
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({ overrideStatus: 'MISSING' })
          .expect(201);

        const audit = await db.auditLog.count({
          where: { org_id: orgId, action: 'assessment_status_override' },
        });
        expect(audit).toBe(1);

        const res = await http
          .get(
            `/classes/${classMixId}/grades/students/${studentId}/assessments/status`,
          )
          .set('Authorization', `Bearer ${ownerToken}`)
          .expect(200);
        const statusList = Array.isArray(res.body) ? res.body : res.body?.data;
        const b1 = statusList.find((r: any) => r.assessmentId === b1Id);
        expect(b1.overrideStatus).toBe('MISSING');
        expect(b1.countsTowardGrade).toBe(true);
      },
    );

    await check(
      'HTTP — owner DELETE override reverts and removes the row',
      async () => {
        await http
          .delete(
            `/classes/${classMixId}/grades/students/${studentId}/assessments/${b1Id}/override`,
          )
          .set('Authorization', `Bearer ${ownerToken}`)
          .expect(200);

        const rows = await db.assessmentGradingOverride.count({
          where: { assessment_id: b1Id, student_id: studentId },
        });
        expect(rows).toBe(0);
      },
    );

    await check(
      'HTTP — non-owner DELETE override rejects with 403',
      async () => {
        await http
          .delete(
            `/classes/${classMixId}/grades/students/${studentId}/assessments/${b1Id}/override`,
          )
          .set('Authorization', `Bearer ${intruderToken}`)
          .expect(403);
      },
    );
  });

  it('(3) override include: all three assessments average and grade changes exactly', async () => {
    if (!available) return;
    await check(
      'scenario 3 — write include override for the pre-enrollment B1',
      async () => {
        await svc.setAssessmentStatusOverride(
          classMixId,
          b1Id,
          studentId,
          orgId,
          ownerId,
          {
            overrideStatus: 'MISSING',
          } as any,
        );
      },
    );

    await check(
      'scenario 3 — written rawAverage = (40+70+90)/3 = 66.67',
      async () => {
        const bd = await breakdownByCategory(classMixId);
        expect(bd.written.rawAverage).toBe(66.67);
      },
    );

    await check(
      'scenario 3 — final grade = 66.67 (all three counted)',
      async () => {
        const grade = await computeAndFetchGrade(classMixId);
        expect(grade?.final_score).toBe(66.67);
      },
    );
  });

  it('(4) override then delete: grade reverts exactly to the default-exclusion result', async () => {
    if (!available) return;
    await check(
      'scenario 4 — delete the override via the service (Phase 3 endpoint path)',
      async () => {
        const res = await svc.deleteAssessmentStatusOverride(
          classMixId,
          b1Id,
          studentId,
          orgId,
          ownerId,
        );
        expect(res.deleted).toBe(1);
      },
    );

    await check('scenario 4 — final grade reverts to exactly 80', async () => {
      const grade = await computeAndFetchGrade(classMixId);
      expect(grade?.final_score).toBe(80);
    });
  });

  it('(5) exempted submission stays exempt even when override would include the assessment', async () => {
    if (!available) return;
    await check('scenario 5 — mark B1 submission exempted', async () => {
      await db.submission.update({
        where: { id: (globalThis as any).__subB1Id },
        data: { is_exempted: true },
      });
    });

    await check(
      'scenario 5 — default exclusion still yields 80 (exemption is independent)',
      async () => {
        const grade = await computeAndFetchGrade(classMixId);
        expect(grade?.final_score).toBe(80);
      },
    );

    await check(
      'scenario 5 — forced include does NOT resurrect an exempted submission',
      async () => {
        await svc.setAssessmentStatusOverride(
          classMixId,
          b1Id,
          studentId,
          orgId,
          ownerId,
          {
            overrideStatus: 'MISSING',
          } as any,
        );
        const grade = await computeAndFetchGrade(classMixId);
        expect(grade?.final_score).toBe(80);
        // Clean up override so later assertions and cleanup stay deterministic.
        await svc.deleteAssessmentStatusOverride(
          classMixId,
          b1Id,
          studentId,
          orgId,
          ownerId,
        );
      },
    );
  });

  it('(1) all-pre-enrollment component reports no eligible assessments, not a 0%', async () => {
    if (!available) return;
    await check(
      'scenario 1 — categoryBreakdown is all-exempted, not 0',
      async () => {
        const termGrades = await svc.getGradesByTerm(
          classAllPreId,
          termId,
          orgId,
          ownerId,
        );
        const student = termGrades.students.find(
          (s: any) => s.studentId === studentId,
        );
        const written = student.categoryBreakdown.find(
          (c: any) => c.type === 'written',
        );
        expect(written.rawAverage).toBeNull();
        expect(written.isAllExempted).toBe(true);
      },
    );

    await check(
      'scenario 1 — final score is 0 with no active categories (non-div-by-zero)',
      async () => {
        const grade = await computeAndFetchGrade(classAllPreId);
        expect(grade?.final_score).toBe(0);
      },
    );
  });
});
