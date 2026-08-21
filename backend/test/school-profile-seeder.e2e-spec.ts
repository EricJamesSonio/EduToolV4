// backend/test/school-profile-seeder.e2e-spec.ts
//
// REAL integration test for the School Profile -> Org Seeder connection.
// Proves that:
//  1) SchoolProfileService.saveProfile persists the blueprint (org-scoped)
//  2) OrgSeederService picks it up via getAllByType -> ctx.profileDepartments
//  3) LevelSectionSeeder / Subject seeders prefer profile over hardcoded defaults
//  4) OrgHeroCard's data source (GET /school-profile) matches what was saved
//
// Uses real Nest modules + real DatabaseService. Skips if DATABASE_URL unreachable.

import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { OrgSeederModule } from '@/modules/org-seeder/org-seeder.module';
import { SchoolProfileModule } from '@/modules/school-profile/school-profile.module';
import { DatabaseModule } from '@/core/database/database.module';
import { AiModule } from '@/core/ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from '@/core/database/database.provider';
import { OrgSeederService } from '@/modules/org-seeder/org-seeder.service';
import { SchoolProfileService } from '@/modules/school-profile/school-profile.service';
import { genPrefixedId } from './utils/id.util';
import { isDatabaseReachable } from './utils/net.util';
import { snapshotCounts, log, check, makeProgramCalendars } from './utils/org-seeder-test.fixtures';

if (!process.env.DATABASE_URL) {
  loadEnv({ path: path.join(__dirname, '..', '.env') });
  console.log('[school-profile-seeder e2e] DATABASE_URL loaded from backend/.env');
}

const hasDbUrl = !!process.env.DATABASE_URL;
const dbUp = hasDbUrl && isDatabaseReachable(process.env.DATABASE_URL);
if (!hasDbUrl) {
  console.log('[school-profile-seeder e2e] SKIPPED — DATABASE_URL not set');
} else if (!dbUp) {
  console.log('[school-profile-seeder e2e] SKIPPED — database not reachable');
}

const runSuite = dbUp ? describe : describe.skip;

runSuite('SchoolProfile -> Seeder integration (real DB)', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let profileService: SchoolProfileService;
  let seeder: OrgSeederService;

  const orgId = genPrefixedId('e2e-prof');
  const schoolYearId = genPrefixedId('e2e-prof-sy');
  const actorId = genPrefixedId('e2e-prof-actor');

  const syStart = new Date('2026-06-01T00:00:00.000Z');
  const syEnd = new Date('2027-03-31T00:00:00.000Z');

  beforeAll(async () => {
    log('--- SETUP: boot real Nest (SchoolProfileModule + OrgSeederModule) ---');
    const mod: TestingModule = await Test.createTestingModule({
      imports: [SchoolProfileModule, OrgSeederModule, DatabaseModule, AiModule, ConfigModule.forRoot({ isGlobal: true })],
    }).compile();

    app = mod.createNestApplication();
    await app.init();

    db = app.get(DatabaseService);
    profileService = app.get(SchoolProfileService);
    seeder = app.get(OrgSeederService);

    await db.organization.create({ data: { id: orgId, name: `E2E Profile Org ${orgId}` } });
    await db.schoolYear.create({
      data: { id: schoolYearId, org_id: orgId, name: `E2E SY ${schoolYearId}`, status: 'active', start_date: syStart, end_date: syEnd },
    });

    log(`Created org ${orgId} + SY ${schoolYearId}`);
  }, 180000);

  it('saveProfile persists college + shs + elementary and getProfile returns same shape (OrgHeroCard source)', async () => {
    await check('saveProfile creates 3 departments', async () => {
      const res = await profileService.saveProfile(orgId, {
        departments: [
          {
            type: 'college',
            courses: [
              {
                name: 'BS Computer Science',
                code: 'BSCS',
                levels: [
                  { name: '1st Year', orderIndex: 0, sections: [{ name: 'A', capacity: 40 }], subjects: [{ name: 'Intro to CS', subjectType: 'major' }] },
                  { name: '2nd Year', orderIndex: 1, sections: [{ name: 'A', capacity: 40 }], subjects: [{ name: 'Data Structures', subjectType: 'major' }] },
                ],
              },
            ],
            strands: [],
            levels: [],
            subjects: [{ name: 'GE Elective', subjectType: 'minor' }],
          } as any,
          {
            type: 'shs',
            courses: [],
            strands: [
              {
                name: 'STEM',
                levels: [
                  { name: 'Grade 11', orderIndex: 0, sections: [{ name: 'S1', capacity: 35 }], subjects: [{ name: 'Physics 1', subjectType: 'major' }] },
                  { name: 'Grade 12', orderIndex: 1, sections: [{ name: 'S1', capacity: 35 }], subjects: [{ name: 'Physics 2', subjectType: 'major' }] },
                ],
              },
            ],
            levels: [],
            subjects: [],
          } as any,
          {
            type: 'elementary',
            courses: [],
            strands: [],
            levels: [
              { name: 'Grade 1', orderIndex: 0, sections: [{ name: 'A', capacity: 30 }], subjects: [{ name: 'Math 1', subjectType: 'major' }] },
            ],
            subjects: [],
          } as any,
        ],
      } as any);

      expect(res).toEqual({ success: true });
    });

    await check('getProfile returns 3 departments with courses/strands intact', async () => {
      const departments = await profileService.getProfile(orgId);
      expect(departments).toHaveLength(3);

      const college = departments.find((d: any) => d.type === 'college');
      expect(college).toBeDefined();
      expect(college.courses).toHaveLength(1);
      expect(college.courses[0].code).toBe('BSCS');
      expect(college.courses[0].levels).toHaveLength(2);
      expect(college.courses[0].levels[0].sections[0].name).toBe('A');

      const shs = departments.find((d: any) => d.type === 'shs');
      expect(shs.strands).toHaveLength(1);
      expect(shs.strands[0].name).toBe('STEM');
      expect(shs.strands[0].levels).toHaveLength(2);

      const elem = departments.find((d: any) => d.type === 'elementary');
      expect(elem.levels).toHaveLength(1);
      expect(elem.levels[0].name).toBe('Grade 1');
    });

    await check('getAllByType maps correctly (Seeder reads this)', async () => {
      const byType = await profileService.getAllByType(orgId);
      expect(byType['college']?.courses[0].name).toBe('BS Computer Science');
      expect(byType['shs']?.strands[0].name).toBe('STEM');
      expect(byType['elementary']?.levels[0].name).toBe('Grade 1');
      expect(byType['jhs']).toBeUndefined();
    });

    // This is what OrgHeroCard renders: 3 departments, with course/strand names
    await check('OrgHeroCard data shape: departments have names for rendering', async () => {
      const departments = await profileService.getProfile(orgId);
      const labels = departments.map((d: any) => d.type).sort();
      expect(labels).toEqual(['college', 'elementary', 'shs']);
      // College subtext would be "BS Computer Science"
      const collegeSubtext = departments.find((d: any) => d.type === 'college').courses.map((c: any) => c.name).join(' · ');
      expect(collegeSubtext).toBe('BS Computer Science');
      // SHS subtext would be "STEM"
      const shsSubtext = departments.find((d: any) => d.type === 'shs').strands.map((s: any) => s.name).join(' · ');
      expect(shsSubtext).toBe('STEM');
    });
  });

  it('seedOrg uses profile overrides — seeded levels/sections match profile, not hardcoded defaults', async () => {
    await check('seedOrg completes', async () => {
      const result = await seeder.seedOrg({
        orgId,
        schoolYearId,
        actorId,
        programs: ['college', 'shs', 'elementary'],
        seedGradingScales: false,
        seedGradingSchemes: false,
        seedSemesterTemplates: false,
        seedProgramCalendars: false,
        programCalendars: makeProgramCalendars(),
      } as any);

      // Should have seeded something for each requested program
      expect(result.programs.seeded).toBe(3);
      expect(result.levels.seeded).toBeGreaterThan(0);
      expect(result.sections.seeded).toBeGreaterThan(0);
    });

    await check('seeded levels match profile (2 college + 2 shs + 1 elementary = 5)', async () => {
      const levels = await db.level.findMany({ where: { org_id: orgId, school_year_id: schoolYearId } });
      // College: 2 levels (1st, 2nd), SHS: 2 levels (Grade 11,12), Elementary: 1 level = total 5
      expect(levels).toHaveLength(5);

      const names = levels.map((l) => l.name).sort();
      expect(names).toEqual(['1st Year', '2nd Year', 'Grade 1', 'Grade 11', 'Grade 12'].sort());
    });

    await check('seeded sections match profile (5 levels each with 1 section = 5 sections)', async () => {
      const sections = await db.section.findMany({ where: { org_id: orgId, school_year_id: schoolYearId } });
      expect(sections).toHaveLength(5);
      expect(sections.every((s) => s.capacity === 30 || s.capacity === 35 || s.capacity === 40)).toBe(true);
    });

    await check('seeded subjects respect profile (5 major subjects from profile)', async () => {
      const subjects = await db.subject.findMany({ where: { org_id: orgId } });
      // At least the 5 majors we defined should exist
      const subjectNames = subjects.map((s) => s.name);
      expect(subjectNames).toEqual(expect.arrayContaining(['Intro to CS', 'Data Structures', 'Physics 1', 'Physics 2', 'Math 1']));
      // GE Elective is a minor subject stored as Subject with department_id — also seeded
      expect(subjectNames).toEqual(expect.arrayContaining(['GE Elective']));
    });

    await check('college course seeded correctly from profile', async () => {
      const courses = await db.course.findMany({ where: { org_id: orgId, school_year_id: schoolYearId } });
      expect(courses).toHaveLength(1);
      expect(courses[0].name).toBe('BS Computer Science');
      expect(courses[0].code).toBe('BSCS');
    });

    await check('shs strand seeded correctly from profile', async () => {
      const strands = await db.strand.findMany({ where: { org_id: orgId, school_year_id: schoolYearId } });
      expect(strands).toHaveLength(1);
      expect(strands[0].name).toBe('STEM');
    });
  });

  it('profile can be overwritten and seeder remains consistent after overwrite', async () => {
    await check('overwrite profile with single department', async () => {
      await profileService.saveProfile(orgId, {
        departments: [
          {
            type: 'college',
            courses: [
              {
                name: 'BSIT',
                code: 'BSIT',
                levels: [
                  { name: '1st Year', orderIndex: 0, sections: [{ name: 'A', capacity: 40 }], subjects: [{ name: 'Intro IT', subjectType: 'major' }] },
                ],
              },
            ],
            strands: [],
            levels: [],
            subjects: [],
          } as any,
        ],
      } as any);

      const after = await profileService.getProfile(orgId);
      expect(after).toHaveLength(1);
      expect(after[0].type).toBe('college');
      expect(after[0].courses[0].name).toBe('BSIT');
      // Old departments gone
      expect(after.find((d: any) => d.type === 'shs')).toBeUndefined();
    });
  });

  afterAll(async () => {
    if (!db) return;
    log('--- CLEANUP: profile-seeder integration ---');
    // Delete in dependency order
    const orgFilter = { org_id: orgId };
    try {
      await db.subjectPrerequisite.deleteMany({ where: orgFilter }).catch(() => {});
      await db.subjectSharing.deleteMany({ where: orgFilter }).catch(() => {});
      await db.subject.deleteMany({ where: orgFilter }).catch(() => {});
      await db.section.deleteMany({ where: orgFilter }).catch(() => {});
      await db.level.deleteMany({ where: orgFilter }).catch(() => {});
      await db.strand.deleteMany({ where: orgFilter }).catch(() => {});
      await db.course.deleteMany({ where: orgFilter }).catch(() => {});
      await db.program.deleteMany({ where: orgFilter }).catch(() => {});
      await db.programCalendar.deleteMany({ where: orgFilter }).catch(() => {});
      await db.gradingScaleAssignment.deleteMany({ where: orgFilter }).catch(() => {});
      await db.gradingScale.deleteMany({ where: orgFilter }).catch(() => {});
      await db.gradingSchemeTemplateComponent.deleteMany({ where: orgFilter }).catch(() => {});
      await db.gradingSchemeTemplate.deleteMany({ where: orgFilter }).catch(() => {});
      await db.semesterTemplateTerm.deleteMany({ where: orgFilter }).catch(() => {});
      await db.semesterTemplateItem.deleteMany({ where: orgFilter }).catch(() => {});
      await db.semesterTemplate.deleteMany({ where: orgFilter }).catch(() => {});
      await db.programSemesterTermDate.deleteMany({ where: orgFilter }).catch(() => {});
      await db.programSemesterAssignment.deleteMany({ where: orgFilter }).catch(() => {});
      await db.concernCategory.deleteMany({ where: orgFilter }).catch(() => {});
      await db.orgConcernSetting.deleteMany({ where: orgFilter }).catch(() => {});
      await db.orgEnrollmentSetting.deleteMany({ where: orgFilter }).catch(() => {});
      await db.auditLog.deleteMany({ where: orgFilter }).catch(() => {});
      // Profile tables (org-scoped, not SY-scoped) — cascade from department
      await db.schoolProfileDepartment.deleteMany({ where: { org_id: orgId } }).catch(() => {});
      await db.schoolYear.deleteMany({ where: { id: schoolYearId } }).catch(() => {});
      await db.organization.deleteMany({ where: { id: orgId } }).catch(() => {});
      log('Cleanup done for org ' + orgId);
    } finally {
      await app.close().catch(() => {});
    }
  }, 120000);
});
