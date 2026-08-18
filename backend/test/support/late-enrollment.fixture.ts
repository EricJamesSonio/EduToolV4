// backend/test/support/late-enrollment.fixture.ts
//
// All the "build an isolated tenant and seed it" plumbing for the
// late-enrollment e2e suite. Call setupLateEnrollmentFixture() once in
// beforeAll, always pair it with teardownLateEnrollmentFixture() in
// afterAll. Keeping this out of the spec file is what lets that file read
// as a list of scenarios instead of 300 lines of setup.

import * as path from 'path';
import jwt from 'jsonwebtoken';
import { config as loadEnv } from 'dotenv';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

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

import { genId, AccountRole } from './late-enrollment.types';

if (!process.env.DATABASE_URL) {
  loadEnv({ path: path.join(__dirname, '..', '..', '.env') });
}

export const hasDbUrl = !!process.env.DATABASE_URL;
export const DAY = 24 * 60 * 60 * 1000;

export const log = (msg: string): void =>
  console.log(`[late-enrollment e2e] ${msg}`);

type Cleanup = (d: DatabaseService) => Promise<unknown>;

export interface LateEnrollmentFixture {
  available: boolean;
  app: INestApplication;
  db: DatabaseService;
  svc: GradeEducatorService;
  orgId: string;
  ownerId: string;
  intruderId: string;
  studentId: string;
  classMixId: string;
  classAllPreId: string;
  termId: string;
  b1Id: string;
  p1Id: string;
  subB1Id: string;
  subP1Id: string;
  ownerToken: string;
  intruderToken: string;
  /** Internal — used by teardownLateEnrollmentFixture, don't touch in specs. */
  _moduleRef: TestingModule;
  /** Internal — used by teardownLateEnrollmentFixture, don't touch in specs. */
  _cleanups: Cleanup[];
}

function signToken(secret: string | undefined, sub: string): string {
  if (!secret)
    throw new Error('JWT_SECRET missing from env — cannot sign token.');
  return jwt.sign({ sub }, secret, { expiresIn: '1h' });
}

/**
 * Builds one isolated tenant: org, school year, program, grading scale,
 * two educators + one student, two classes (one mixed enrollment timing,
 * one fully pre-enrollment), assessments, and submissions matching the
 * late-enrollment exclusion scenarios.
 *
 * Returns `available: false` (everything else unset) when there's no
 * DATABASE_URL. Callers should bail out of their `it()` blocks on that
 * flag rather than skip the whole suite, matching the org-seeder
 * e2e-spec.ts convention.
 */
export async function setupLateEnrollmentFixture(): Promise<LateEnrollmentFixture> {
  if (!hasDbUrl) {
    log('SKIPPED — DATABASE_URL not set; e2e needs a real DB.');
    return { available: false } as LateEnrollmentFixture;
  }

  const moduleRef = await Test.createTestingModule({
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

  const app = moduleRef.createNestApplication();
  await app.init();

  const db = moduleRef.get(DatabaseService);
  const svc = moduleRef.get(GradeEducatorService);

  const cleanups: Cleanup[] = [];
  const now = new Date();
  const preEnroll = new Date(now.getTime() - 10 * DAY);
  const postEnrollA = new Date(now.getTime() + 5 * DAY);
  const postEnrollB = new Date(now.getTime() + 6 * DAY);

  const org = await db.organization.create({
    data: { name: genId('late-enr') },
  });
  cleanups.push((d) => d.organization.delete({ where: { id: org.id } }));

  const schoolYear = await db.schoolYear.create({
    data: {
      org_id: org.id,
      name: genId('SY'),
      start_date: new Date(now.getFullYear(), 0, 1),
      end_date: new Date(now.getFullYear() + 1, 0, 1),
      status: 'active',
    },
  });
  cleanups.push((d) => d.schoolYear.delete({ where: { id: schoolYear.id } }));

  const program = await db.program.create({
    data: {
      org_id: org.id,
      school_year_id: schoolYear.id,
      name: 'P1',
      type: 'college',
    },
  });
  cleanups.push((d) => d.program.delete({ where: { id: program.id } }));

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
  cleanups.push((d) =>
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
  cleanups.push((d) =>
    d.gradingScaleAssignment.deleteMany({ where: { org_id: org.id } }),
  );

  const mkAccount = async (role: AccountRole): Promise<string> => {
    const a = await db.account.create({
      data: {
        org_id: org.id,
        role,
        email: `${genId('acct', 12)}@late.test`,
        password: 'x',
        status: 'active',
      },
    });
    cleanups.push((d) => d.account.delete({ where: { id: a.id } }));
    return a.id;
  };
  const ownerId = await mkAccount('educator');
  const intruderId = await mkAccount('educator');
  const studentId = await mkAccount('student');

  const semester = await db.semester.create({
    data: {
      org_id: org.id,
      school_year_id: schoolYear.id,
      name: 'Sem 1',
      start_date: new Date(now.getFullYear(), 0, 1),
      end_date: new Date(now.getFullYear() + 1, 0, 1),
    },
  });
  cleanups.push((d) => d.semester.delete({ where: { id: semester.id } }));

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
  cleanups.push((d) => d.term.delete({ where: { id: term.id } }));

  const subject = await db.subject.create({
    data: { org_id: org.id, name: 'E2E Subj', program_id: program.id },
  });
  cleanups.push((d) => d.subject.delete({ where: { id: subject.id } }));

  const mkClass = async (): Promise<string> => {
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
    cleanups.push((d) => d.class.delete({ where: { id: cls.id } }));
    return cls.id;
  };
  const classMixId = await mkClass();
  const classAllPreId = await mkClass();

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
  cleanups.push((d) => d.enrollment.deleteMany({ where: { org_id: org.id } }));

  const scheme = await db.gradingScheme.create({
    data: {
      org_id: org.id,
      class_id: classMixId,
      name: 'E2E Scheme',
      is_default: true,
    },
  });
  cleanups.push((d) => d.gradingScheme.delete({ where: { id: scheme.id } }));

  const comps = [
    { name: 'Written Tasks', type: 'written', weight: 60 },
    { name: 'Performance Task', type: 'performance', weight: 40 },
  ];
  for (const c of comps) {
    const cc = await db.gradingSchemeComponent.create({
      data: { org_id: org.id, grading_scheme_id: scheme.id, ...c },
    });
    cleanups.push((d) =>
      d.gradingSchemeComponent.delete({ where: { id: cc.id } }),
    );
  }

  const mkAssessment = async (
    classId: string,
    type: string,
    title: string,
    release: Date,
    totalItems = 50,
  ): Promise<string> => {
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
    cleanups.push((d) => d.assessment.delete({ where: { id: a.id } }));
    return a.id;
  };

  // Mixed class: B1 pre-enrollment (excluded), B2/B3 post-enrollment (included),
  // P1 performance pre-enrollment (excluded) → performance category must drop out.
  const b2Id = await mkAssessment(classMixId, 'written', 'B2', postEnrollA);
  const b3Id = await mkAssessment(classMixId, 'written', 'B3', postEnrollB);
  const b1Id = await mkAssessment(classMixId, 'written', 'B1', preEnroll);
  const p1Id = await mkAssessment(classMixId, 'performance', 'P1', preEnroll);
  // All-pre class: both released before enrollment.
  const aPre1 = await mkAssessment(classAllPreId, 'written', 'A1', preEnroll);
  const aPre2 = await mkAssessment(classAllPreId, 'written', 'A2', preEnroll);

  const mkSubmission = async (
    assessmentId: string,
    score: number,
  ): Promise<string> => {
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
    cleanups.push((d) => d.submission.delete({ where: { id: s.id } }));
    return s.id;
  };

  // Each id is bound once with `const` — this is also what silences the
  // prefer-const rule that used to fire on this block.
  await mkSubmission(b2Id, 35); // 70%
  await mkSubmission(b3Id, 45); // 90%
  const subB1Id = await mkSubmission(b1Id, 20); // 40% — excluded by default in mixed
  const subP1Id = await mkSubmission(p1Id, 45); // 90% — excluded
  await mkSubmission(aPre1, 40); // 80%
  await mkSubmission(aPre2, 40); // 80%

  cleanups.push((d) => d.grade.deleteMany({ where: { org_id: org.id } }));
  cleanups.push((d) =>
    d.assessmentGradingOverride.deleteMany({ where: { org_id: org.id } }),
  );
  cleanups.push((d) => d.auditLog.deleteMany({ where: { org_id: org.id } }));

  const ownerToken = signToken(process.env.JWT_SECRET, ownerId);
  const intruderToken = signToken(process.env.JWT_SECRET, intruderId);

  return {
    available: true,
    app,
    db,
    svc,
    orgId: org.id,
    ownerId,
    intruderId,
    studentId,
    classMixId,
    classAllPreId,
    termId: term.id,
    b1Id,
    p1Id,
    subB1Id,
    subP1Id,
    ownerToken,
    intruderToken,
    _moduleRef: moduleRef,
    _cleanups: cleanups,
  };
}

export async function teardownLateEnrollmentFixture(
  fixture: LateEnrollmentFixture,
): Promise<void> {
  if (!fixture.available) return;
  for (const cleanup of fixture._cleanups.reverse()) {
    try {
      await cleanup(fixture.db);
    } catch {
      /* best-effort */
    }
  }
  await fixture.app.close();
  await fixture._moduleRef.close();
}
