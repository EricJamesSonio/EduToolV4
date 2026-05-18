/**
 * seed-platform.ts
 * UPDATED FOR CURRENT SCHEMA
 * - Global unique email
 * - Handles Profile.personal_email
 * - Avoids unnecessary overwrites
 * - Clean logs
 */

import { PrismaClient, Role, AccountStatus } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const db = new PrismaClient()

// ── Config ────────────────────────────────────────────────────────────────────

const SALT_ROUNDS = 10

const PLATFORM_OWNER = {
  email: 'platform@edutool.dev',
  password: 'platform123',
  fullName: 'Platform Owner',
}

const ADMINS = [
  { email: 'admin1@edutool.dev', password: 'admin123', fullName: 'Admin One' },
  { email: 'admin2@edutool.dev', password: 'admin123', fullName: 'Admin Two' },
  { email: 'admin3@edutool.dev', password: 'admin123', fullName: 'Admin Three' },
  { email: 'admin4@edutool.dev', password: 'admin123', fullName: 'Admin Four' },
  { email: 'admin5@edutool.dev', password: 'admin123', fullName: 'Admin Five' },
  { email: 'admin6@edutool.dev', password: 'admin123', fullName: 'Admin Six' },
  { email: 'admin7@edutool.dev', password: 'admin123', fullName: 'Admin Seven' },
  { email: 'admin8@edutool.dev', password: 'admin123', fullName: 'Admin Eight' },
  { email: 'admin9@edutool.dev', password: 'admin123', fullName: 'Admin Nine' },
  { email: 'admin10@edutool.dev', password: 'admin123', fullName: 'Admin Ten' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

async function upsertAccount(params: {
  email: string
  password: string
  fullName: string
  role: Role
}) {
  const { email, password, fullName, role } = params

  const hashed = await bcrypt.hash(password, SALT_ROUNDS)

  const account = await db.account.upsert({
    where: { email },

    update: {
      // optional: only update critical fields
      password: hashed,
      role,
      status: AccountStatus.active,
      deleted_at: null, // revive if soft-deleted
    },

    create: {
      org_id: null, // platform-level
      role,
      email,
      password: hashed,
      status: AccountStatus.active,
    },
  })

  // Profile upsert (now supports personal_email)
  await db.profile.upsert({
    where: { account_id: account.id },

    update: {
      full_name: fullName,
      personal_email: email, // optional but useful
    },

    create: {
      account_id: account.id,
      full_name: fullName,
      personal_email: email,
    },
  })

  console.log(`✓ ${role.padEnd(16)} ${email}`)

  return account
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Seeding PLATFORM accounts...\n')

  console.log('▶ Platform Owner')
  await upsertAccount({
    email: PLATFORM_OWNER.email,
    password: PLATFORM_OWNER.password,
    fullName: PLATFORM_OWNER.fullName,
    role: Role.platform_owner,
  })

  console.log('\n▶ Admins (no org yet)')
  for (const admin of ADMINS) {
    await upsertAccount({
      email: admin.email,
      password: admin.password,
      fullName: admin.fullName,
      role: Role.admin,
    })
  }

  // ── Seed Admin Guides ──────────────────────────────────────────────────
  const ADMIN_GUIDES = [
    { slug: 'admin_dashboard', title: 'Dashboard', description: 'Overview of your school statistics and enrollment data' },
    { slug: 'admin_organization', title: 'Organization', description: 'Manage your school or organization settings' },
    { slug: 'admin_school_years', title: 'School Years', description: 'Create and manage school years, levels, programs, and courses' },
    { slug: 'admin_programs', title: 'Programs', description: 'Manage academic programs, courses, and strands' },
    { slug: 'admin_sections', title: 'Sections', description: 'Create and manage class sections' },
    { slug: 'admin_subjects', title: 'Subjects', description: 'Manage subjects offered across programs and levels' },
    { slug: 'admin_semester_settings', title: 'Semester Settings', description: 'Configure semester templates and term assignments' },
    { slug: 'admin_academic_calendar', title: 'Academic Calendar', description: 'Manage holidays and program-specific calendars' },
    { slug: 'admin_grading_scales', title: 'Grading Scales', description: 'Define grading scales and assign them to levels' },
    { slug: 'admin_grading_schemes', title: 'Grading Schemes', description: 'Create grading scheme templates and assign to classes' },
    { slug: 'admin_classes', title: 'Classes', description: 'Manage class schedules, educators, and enrollment' },
    { slug: 'admin_educators', title: 'Educators', description: 'Manage educator accounts and credentials' },
    { slug: 'admin_students', title: 'Students', description: 'Manage student accounts and enrollment status' },
    { slug: 'admin_grade_lock', title: 'Grade Lock', description: 'Lock final grades and manage grade overrides' },
    { slug: 'admin_audit_log', title: 'Audit Log', description: 'View system activity and audit trails' },
  ]

  console.log('\n▶ Admin Guides')
  for (const guide of ADMIN_GUIDES) {
    const existing = await db.guide.findUnique({ where: { slug: guide.slug } })
    if (existing) {
      console.log(`  SKIP  ${guide.slug}`)
      continue
    }
    await db.guide.create({
      data: { slug: guide.slug, portal: 'admin', title: guide.title, description: guide.description, is_active: true },
    })
    console.log(`  OK    ${guide.slug}`)
  }

  console.log('\n✅ SEED COMPLETE\n')
}

// ── Execute ───────────────────────────────────────────────────────────────────

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })