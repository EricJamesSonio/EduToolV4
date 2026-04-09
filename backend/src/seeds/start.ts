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

  console.log('\n✅ SEED COMPLETE\n')

  console.log('────────────────────────────────────────────')
  console.log(`Platform Owner → ${PLATFORM_OWNER.email} / ${PLATFORM_OWNER.password}`)

  ADMINS.forEach((a) =>
    console.log(`Admin          → ${a.email} / ${a.password}`)
  )

  console.log('────────────────────────────────────────────\n')
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