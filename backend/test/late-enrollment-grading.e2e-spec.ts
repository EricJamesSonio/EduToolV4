// backend/test/late-enrollment-grading.e2e-spec.ts
//
// Real-database e2e for the late-enrollment grading exclusion rule and the
// Phase 3 override API. Setup lives in support/late-enrollment.fixture.ts;
// shared types in support/late-enrollment.types.ts. Ownership rejection
// (test 6) is verified over real HTTP through the real JWT AuthGuard +
// RolesGuard + service, not a mocked guard.

import request from 'supertest';

import {
  setupLateEnrollmentFixture,
  teardownLateEnrollmentFixture,
  log,
  type LateEnrollmentFixture,
} from './support/late-enrollment.fixture';

import {
  type AssessmentStatusResponse,
  type AssessmentStatusOverrideInput,
} from './support/late-enrollment.types';

jest.setTimeout(120000);

async function check(
  label: string,
  fn: () => void | Promise<unknown>,
): Promise<void> {
  try {
    await fn();
    log(`PASS ${label}`);
  } catch (err: unknown) {
    log(`FAIL ${label} — ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }
}

describe('[late-enrollment] grading exclusion — real DB end to end', () => {
  let fx: LateEnrollmentFixture;

  beforeAll(async () => {
    fx = await setupLateEnrollmentFixture();
  });

  afterAll(async () => {
    await teardownLateEnrollmentFixture(fx);
  });

  const breakdownByCategory = async (classId: string) => {
    const termGrades = await fx.svc.getGradesByTerm(
      classId,
      fx.termId,
      fx.orgId,
      fx.ownerId,
    );

    const student = termGrades.students.find(
      (s) => s.studentId === fx.studentId,
    );

    if (!student) {
      throw new Error('student row missing from term grades');
    }

    return {
      written: student.categoryBreakdown.find(
        (category) => category.type === 'written',
      ),
      performance: student.categoryBreakdown.find(
        (category) => category.type === 'performance',
      ),
    };
  };

  const computeAndFetchGrade = async (classId: string) => {
    await fx.svc.computeGrades(classId, fx.termId, fx.orgId, fx.ownerId);

    return fx.db.grade.findFirst({
      where: {
        org_id: fx.orgId,
        student_id: fx.studentId,
        class_id: classId,
        term_id: fx.termId,
      },
    });
  };

  it(
    '(2) mixed: only post-enrollment assessments are averaged; ' +
      'full drop renormalizes',
    async () => {
      if (!fx.available) {
        return;
      }

      const bd = await breakdownByCategory(fx.classMixId);

      await check('scenario 2 — written rawAverage = (70+90)/2 = 80', () => {
        expect(bd.written?.rawAverage).toBe(80);
        expect(bd.performance?.isAllExempted).toBe(true);
        expect(bd.performance?.rawAverage).toBeNull();
      });

      await check(
        'scenario 2 — final grade = 80 ' +
          '(performance category dropped, not zero-penalized)',
        async () => {
          const grade = await computeAndFetchGrade(fx.classMixId);

          expect(grade?.final_score).toBe(80);
        },
      );

      await check(
        'scenario 2 — excluded cells carry reason default_excluded',
        async () => {
          const termGrades = await fx.svc.getGradesByTerm(
            fx.classMixId,
            fx.termId,
            fx.orgId,
            fx.ownerId,
          );

          const student = termGrades.students.find(
            (s) => s.studentId === fx.studentId,
          );

          if (!student) {
            throw new Error('student row missing from term grades');
          }

          const b1 = student.assessmentScores.find(
            (score) => score.assessmentId === fx.b1Id,
          );

          expect(b1?.included).toBe(false);
          expect(b1?.inclusionReason).toBe('default_excluded');
        },
      );
    },
  );

  it(
    '(6) HTTP: override POST works for the owner; ' +
      'non-owner is rejected over real HTTP',
    async () => {
      if (!fx.available) {
        return;
      }

      const http = request(fx.app.getHttpServer());

      await check(
        'HTTP — unauthenticated status call rejects with 401',
        async () => {
          await http
            .get(
              `/classes/${fx.classMixId}/grades/students/${fx.studentId}/assessments/status`,
            )
            .expect(401);
        },
      );

      await check('HTTP — non-owner GET status rejects with 403', async () => {
        await http
          .get(
            `/classes/${fx.classMixId}/grades/students/${fx.studentId}/assessments/status`,
          )
          .set('Authorization', `Bearer ${fx.intruderToken}`)
          .expect(403);
      });

      await check(
        'HTTP — non-owner POST override rejects with 403',
        async () => {
          await http
            .post(
              `/classes/${fx.classMixId}/grades/students/${fx.studentId}/assessments/${fx.b1Id}/override`,
            )
            .set('Authorization', `Bearer ${fx.intruderToken}`)
            .send({ overrideStatus: 'MISSING' })
            .expect(403);
        },
      );

      await check(
        'HTTP — owner POST override succeeds and is audited',
        async () => {
          await http
            .post(
              `/classes/${fx.classMixId}/grades/students/${fx.studentId}/assessments/${fx.b1Id}/override`,
            )
            .set('Authorization', `Bearer ${fx.ownerToken}`)
            .send({ overrideStatus: 'MISSING' })
            .expect(201);

          const audit = await fx.db.auditLog.count({
            where: {
              org_id: fx.orgId,
              action: 'assessment_status_override',
            },
          });

          expect(audit).toBe(1);

          const res = await http
            .get(
              `/classes/${fx.classMixId}/grades/students/${fx.studentId}/assessments/status`,
            )
            .set('Authorization', `Bearer ${fx.ownerToken}`)
            .expect(200);

          const statusList: AssessmentStatusResponse[] = Array.isArray(res.body)
            ? (res.body as AssessmentStatusResponse[])
            : (res.body?.data as AssessmentStatusResponse[]);

          const b1 = statusList.find(
            (status) => status.assessmentId === fx.b1Id,
          );

          expect(b1?.overrideStatus).toBe('MISSING');
          expect(b1?.countsTowardGrade).toBe(true);
        },
      );

      await check(
        'HTTP — owner DELETE override reverts and removes the row',
        async () => {
          await http
            .delete(
              `/classes/${fx.classMixId}/grades/students/${fx.studentId}/assessments/${fx.b1Id}/override`,
            )
            .set('Authorization', `Bearer ${fx.ownerToken}`)
            .expect(200);

          const rows = await fx.db.assessmentGradingOverride.count({
            where: {
              assessment_id: fx.b1Id,
              student_id: fx.studentId,
            },
          });

          expect(rows).toBe(0);
        },
      );

      await check(
        'HTTP — non-owner DELETE override rejects with 403',
        async () => {
          await http
            .delete(
              `/classes/${fx.classMixId}/grades/students/${fx.studentId}/assessments/${fx.b1Id}/override`,
            )
            .set('Authorization', `Bearer ${fx.intruderToken}`)
            .expect(403);
        },
      );
    },
  );

  it(
    '(3) override include: all three assessments average and grade ' +
      'changes exactly',
    async () => {
      if (!fx.available) {
        return;
      }

      const overrideInput: AssessmentStatusOverrideInput = {
        overrideStatus: 'MISSING',
      };

      await check(
        'scenario 3 — write include override for the pre-enrollment B1',
        async () => {
          await fx.svc.setAssessmentStatusOverride(
            fx.classMixId,
            fx.b1Id,
            fx.studentId,
            fx.orgId,
            fx.ownerId,
            overrideInput,
          );
        },
      );

      await check(
        'scenario 3 — written rawAverage = (40+70+90)/3 = 66.67',
        async () => {
          const bd = await breakdownByCategory(fx.classMixId);

          expect(bd.written?.rawAverage).toBe(66.67);
        },
      );

      await check(
        'scenario 3 — final grade = 66.67 (all three counted)',
        async () => {
          const grade = await computeAndFetchGrade(fx.classMixId);

          expect(grade?.final_score).toBe(66.67);
        },
      );
    },
  );

  it(
    '(4) override then delete: grade reverts exactly to the ' +
      'default-exclusion result',
    async () => {
      if (!fx.available) {
        return;
      }

      await check(
        'scenario 4 — delete the override via the service ' +
          '(Phase 3 endpoint path)',
        async () => {
          const res = await fx.svc.deleteAssessmentStatusOverride(
            fx.classMixId,
            fx.b1Id,
            fx.studentId,
            fx.orgId,
            fx.ownerId,
          );

          expect(res.deleted).toBe(1);
        },
      );

      await check(
        'scenario 4 — final grade reverts to exactly 80',
        async () => {
          const grade = await computeAndFetchGrade(fx.classMixId);

          expect(grade?.final_score).toBe(80);
        },
      );
    },
  );

  it(
    '(5) exempted submission stays exempt even when override would ' +
      'include the assessment',
    async () => {
      if (!fx.available) {
        return;
      }

      await check('scenario 5 — mark B1 submission exempted', async () => {
        await fx.db.submission.update({
          where: {
            id: fx.subB1Id,
          },
          data: {
            is_exempted: true,
          },
        });
      });

      await check(
        'scenario 5 — default exclusion still yields 80 ' +
          '(exemption is independent)',
        async () => {
          const grade = await computeAndFetchGrade(fx.classMixId);

          expect(grade?.final_score).toBe(80);
        },
      );

      await check(
        'scenario 5 — forced include does NOT resurrect an ' +
          'exempted submission',
        async () => {
          await fx.svc.setAssessmentStatusOverride(
            fx.classMixId,
            fx.b1Id,
            fx.studentId,
            fx.orgId,
            fx.ownerId,
            {
              overrideStatus: 'MISSING',
            },
          );

          const grade = await computeAndFetchGrade(fx.classMixId);

          expect(grade?.final_score).toBe(80);

          // Clean up override so later assertions and cleanup remain
          // deterministic.
          await fx.svc.deleteAssessmentStatusOverride(
            fx.classMixId,
            fx.b1Id,
            fx.studentId,
            fx.orgId,
            fx.ownerId,
          );
        },
      );
    },
  );

  it(
    '(1) all-pre-enrollment component reports no eligible assessments, ' +
      'not a 0%',
    async () => {
      if (!fx.available) {
        return;
      }

      await check(
        'scenario 1 — categoryBreakdown is all-exempted, not 0',
        async () => {
          const termGrades = await fx.svc.getGradesByTerm(
            fx.classAllPreId,
            fx.termId,
            fx.orgId,
            fx.ownerId,
          );

          const student = termGrades.students.find(
            (s) => s.studentId === fx.studentId,
          );

          if (!student) {
            throw new Error('student row missing from term grades');
          }

          const written = student.categoryBreakdown.find(
            (category) => category.type === 'written',
          );

          if (!written) {
            throw new Error('written category missing from category breakdown');
          }

          expect(written.rawAverage).toBeNull();
          expect(written.isAllExempted).toBe(true);
        },
      );

      await check(
        'scenario 1 — final score is 0 with no active categories ' +
          '(non-div-by-zero)',
        async () => {
          const grade = await computeAndFetchGrade(fx.classAllPreId);

          expect(grade?.final_score).toBe(0);
        },
      );
    },
  );
});
