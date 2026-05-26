/**
 * seed-data.ts
 * MAIN SEED ORCHESTRATOR
 * - Platform accounts
 * - Admin users
 */

import { PrismaClient, Role, AccountStatus } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const db = new PrismaClient()

const SALT_ROUNDS = 10

// ── Platform Owner ───────────────────────────────────────────────

const PLATFORM_OWNER = {
  email: 'platform@edutool.dev',
  password: 'platform123',
  fullName: 'Platform Owner',
}

// ── Admin Users ───────────────────────────────────────────────────

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

// ── Helper ────────────────────────────────────────────────────────

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
      password: hashed,
      role,
      status: AccountStatus.active,
      deleted_at: null,
    },
    create: {
      org_id: null,
      role,
      email,
      password: hashed,
      status: AccountStatus.active,
    },
  })

  await db.profile.upsert({
    where: { account_id: account.id },
    update: {
      full_name: fullName,
      personal_email: email,
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

// ── Main Seeder ───────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 START SEED PROCESS...\n')

  // 1. Platform Owner
  console.log('▶ Platform Owner')
  await upsertAccount({
    email: PLATFORM_OWNER.email,
    password: PLATFORM_OWNER.password,
    fullName: PLATFORM_OWNER.fullName,
    role: Role.platform_owner,
  })

  // 2. Admins
  console.log('\n▶ Admin Accounts')
  for (const admin of ADMINS) {
    await upsertAccount({
      email: admin.email,
      password: admin.password,
      fullName: admin.fullName,
      role: Role.admin,
    })
  }

  console.log('\n✅ SEED COMPLETE\n')
}

// ── Execute ───────────────────────────────────────────────────────

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })