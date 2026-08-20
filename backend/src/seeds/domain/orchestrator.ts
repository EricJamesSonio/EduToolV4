/**
 * orchestrator.ts
 *
 * Drives the full domain seed for every pre-seeded admin/org: base
 * accounts -> programs/courses/strands -> levels/sections -> grading
 * scales & schemes -> academic calendars -> semester templates -> subjects
 * -> educators -> classes (+ per-class grading schemes) -> readiness gate
 * -> students (only if ready). Finishes by reconciling any leftover
 * schedule conflicts across all orgs.
 */

import * as bcrypt from 'bcrypt';
import { AccountStatus } from '@prisma/client';

import { db } from './db';
import { ADMIN_CONFIGS, SALT_ROUNDS, SY_NAME } from './constants';
import { slugify } from './utils/identity.util';
import { slugifyName } from '../../modules/organization/organization.repository';
import { seedId } from '../../modules/org-seeder/seed-id';

import { SCHOOLS } from '../data/schools';
import { ADMINS } from '../data/admins';

import { seedSchoolYear } from './seeders/school-year.seeder';
import {
  seedCourses,
  seedPrograms,
  seedStrands,
} from './seeders/programs.seeder';
import { seedLevelsAndSections } from './seeders/levels.seeder';
import {
  seedGradingScales,
  seedGradingSchemes,
} from './seeders/grading.seeder';
import { seedProgramCalendars } from './seeders/calendar.seeder';
import { seedSemesterTemplates } from './seeders/semester.seeder';
import { seedSubjects } from './seeders/subjects.seeder';
import { seedEducators } from './seeders/educators.seeder';
import { seedStudents } from './seeders/students.seeder';
import { seedClasses } from './seeders/classes.seeder';

import { repairScheduleConflicts } from './repair-schedule-conflicts';
import { checkSchoolYearReadiness } from './readiness-check';

export async function run(): Promise<void> {
  console.log('\n🌱 SEED DOMAIN DATA — START\n');

  // 1. Seed platform owner + admins with orgs (reuse start.ts logic)
  console.log('▶ Seeding base accounts & organizations...');
  const platformOwnerEmail = 'platform@edutool.dev';
  const platformOwnerPw = await bcrypt.hash('platform123', SALT_ROUNDS);
  await db.account.upsert({
    where: { email: platformOwnerEmail },
    update: {
      password: platformOwnerPw,
      role: 'platform_owner',
      status: AccountStatus.active,
      deleted_at: null,
      is_registrar: false,
    },
    create: {
      email: platformOwnerEmail,
      password: platformOwnerPw,
      role: 'platform_owner',
      status: AccountStatus.active,
      is_registrar: false,
    },
  });
  await db.profile.upsert({
    where: {
      account_id: (await db.account.findUnique({
        where: { email: platformOwnerEmail },
      }))!.id,
    },
    update: { full_name: 'Platform Owner' },
    create: {
      account_id: (await db.account.findUnique({
        where: { email: platformOwnerEmail },
      }))!.id,
      full_name: 'Platform Owner',
    },
  });
  console.log(`  platform_owner  ${platformOwnerEmail}`);

  for (let i = 0; i < ADMIN_CONFIGS.length; i++) {
    const {
      adminIndex,
      programs: progKeys,
      educators: educatorCount,
      students: studentCount,
    } = ADMIN_CONFIGS[i];
    const admin = ADMINS[adminIndex];
    const school = SCHOOLS[adminIndex];

    const emailExt = slugify(school.name);
    const adminPw = await bcrypt.hash(admin.password, SALT_ROUNDS);

    let org = await db.organization.findUnique({
      where: { email_extension: emailExt },
    });

    if (org) {
      // Keep an existing slug stable (idempotent seed) but backfill one for any
      // organization that was created without it — same logic as the repository.
      org = await db.organization.update({
        where: { id: org.id },
        data: {
          name: school.name,
          description: school.description,
          address: school.address,
          logo_url: school.logo_url,
          ...(org.slug ? {} : { slug: slugifyName(school.name) }),
        },
      });
    } else {
      org = await db.organization.create({
        data: {
          name: school.name,
          description: school.description,
          address: school.address,
          logo_url: school.logo_url,
          email_extension: emailExt,
          slug: slugifyName(school.name),
        },
      });
    }

    const account = await db.account.upsert({
      where: { email: admin.email },
      update: {
        password: adminPw,
        role: 'admin',
        status: AccountStatus.active,
        deleted_at: null,
        org_id: org.id,
        is_registrar: false,
      },
      create: {
        org_id: org.id,
        email: admin.email,
        password: adminPw,
        role: 'admin',
        status: AccountStatus.active,
        is_registrar: false,
      },
    });
    await db.profile.upsert({
      where: { account_id: account.id },
      update: { full_name: admin.fullName },
      create: { account_id: account.id, full_name: admin.fullName },
    });

    if (!org.admin_account_id) {
      await db.organization.update({
        where: { id: org.id },
        data: { admin_account_id: account.id },
      });
    }

    console.log(`  admin           ${admin.email} ← ${school.name}`);

    // ── 2. Seed domain data for this org ──
    console.log(
      `\n▶ [${school.name}] Seeding domain data (${progKeys.join(', ')})...`,
    );

    // a) School year
    const schoolYearId = await seedSchoolYear(org.id);
    console.log(`  └ school year: ${SY_NAME}`);

    // b) Enrollment setting
    await db.orgEnrollmentSetting.upsert({
      where: { org_id: org.id },
      update: {},
      create: {
        id: seedId('org-enrollment-setting', org.id),
        org_id: org.id,
        require_semester_reenrollment: false,
        auto_unenroll_on_year_end: true,
      },
    });

    // c) Programs
    const programMap = await seedPrograms(org.id, schoolYearId, progKeys);
    console.log(`  └ programs: ${Object.keys(programMap).join(', ')}`);

    // d) Courses (college) & Strands (SHS)
    const courseMap = await seedCourses(org.id, schoolYearId, programMap);
    if (Object.keys(courseMap).length > 0)
      console.log(`  └ courses: ${Object.keys(courseMap).length}`);
    const strandMap = await seedStrands(org.id, schoolYearId, programMap);
    if (Object.keys(strandMap).length > 0)
      console.log(`  └ strands: ${Object.keys(strandMap).length}`);

    // e) Levels & sections
    const levelMap = await seedLevelsAndSections(
      org.id,
      schoolYearId,
      progKeys,
      programMap,
      courseMap,
      strandMap,
    );
    console.log(`  └ levels: ${Object.keys(levelMap).length}`);

    // f) Grading scales
    await seedGradingScales(org.id, schoolYearId, progKeys, programMap);
    console.log(`  └ grading scales: seeded`);

    // g) Grading scheme templates
    await seedGradingSchemes(org.id, progKeys, programMap);
    console.log(`  └ grading scheme templates: seeded`);

    // h) Program academic calendars — MUST run before semester templates.
    await seedProgramCalendars(org.id, schoolYearId, progKeys, programMap);
    console.log(`  └ academic calendars: seeded`);

    // i) Semester templates (break count derived above already matches this)
    await seedSemesterTemplates(org.id, schoolYearId, progKeys, programMap);
    console.log(`  └ semester templates: seeded`);

    // j) Subjects (includes fallback so every level has ≥1 subject)
    const subjectIds = await seedSubjects(
      org.id,
      schoolYearId,
      progKeys,
      programMap,
      courseMap,
      strandMap,
      levelMap,
    );
    console.log(`  └ subjects: ${subjectIds.length}`);

    // k) Educators
    const educatorIds = await seedEducators(org.id, emailExt, educatorCount);
    console.log(`  └ educators: ${educatorIds.length}`);

    // l) Classes + per-class grading schemes (deterministic full coverage)
    await seedClasses(
      org.id,
      schoolYearId,
      progKeys,
      programMap,
      subjectIds,
      educatorIds,
      levelMap,
    );
    console.log(`  └ classes & class grading schemes: seeded`);

    // m) Readiness gate — only enroll students (and activate) if the school
    //    year actually passes the same checks the real activation flow uses.
    const readiness = await checkSchoolYearReadiness(org.id, schoolYearId);

    if (readiness.ready) {
      console.log(`  ✅ School year is READY — proceeding to enroll students.`);

      await db.schoolYear.updateMany({
        where: { org_id: org.id, id: { not: schoolYearId }, status: 'active' },
        data: { status: 'ended' },
      });
      await db.schoolYear.update({
        where: { id: schoolYearId },
        data: { status: 'active' },
      });

      const studentIds = await seedStudents(
        org.id,
        emailExt,
        studentCount,
        levelMap,
        progKeys,
        programMap,
        courseMap,
        strandMap,
        schoolYearId,
      );
      console.log(`  └ students: ${studentIds.length}`);
    } else {
      console.warn(
        `  ⚠ School year is NOT READY — skipping student enrollment for ${school.name}.`,
      );
      for (const issue of readiness.issues) {
        console.warn(`      - ${issue}`);
      }
    }

    console.log('');
  }

  // Reconcile any overlapping educator/section schedules left by older data
  const repaired = await repairScheduleConflicts();
  console.log(`\n🗓  Schedule conflicts repaired: ${repaired}`);

  console.log('\n✅ SEED DOMAIN DATA — COMPLETE\n');
}
