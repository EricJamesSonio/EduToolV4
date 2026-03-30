/**
 * seed-platform.ts
 * FINAL VERSION:
 *  - Uses global unique (email)
 *  - Safe upsert (no null issues)
 *  - Still supports org accounts later
 */

import { PrismaClient, Role, AccountStatus } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const db = new PrismaClient()

// ── Config ────────────────────────────────────────────────────────────────────

const SALT_ROUNDS = 10

const PLATFORM_OWNER = {
  email:    'platform@edutool.dev',
  password: 'platform123',
  fullName: 'Platform Owner',
}

const ADMINS = [
  { email: 'admin1@edutool.dev', password: 'admin123', fullName: 'Admin One' },
  { email: 'admin2@edutool.dev', password: 'admin123', fullName: 'Admin Two' },
  { email: 'admin3@edutool.dev', password: 'admin123', fullName: 'Admin Three' },
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

  // ✅ FIXED: use global unique email
  const account = await db.account.upsert({
    where: {
      email, // 🔥 no more org_id here
    },
    update: {
      password: hashed,
      status: AccountStatus.active,
      role, // keep role updated too (optional but good)
    },
    create: {
      org_id: null, // platform-level account
      role,
      email,
      password: hashed,
      status: AccountStatus.active,
    },
  })

  console.log(`  ✓ Upserted [${role}] ${email}`)

  // ✅ Profile upsert (unchanged)
  await db.profile.upsert({
    where: { account_id: account.id },
    update: { full_name: fullName },
    create: {
      account_id: account.id,
      full_name: fullName,
    },
  })

  return account
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Seeding platform accounts (FINAL)...\n')

  console.log('Platform Owner:')
  await upsertAccount({
    email: PLATFORM_OWNER.email,
    password: PLATFORM_OWNER.password,
    fullName: PLATFORM_OWNER.fullName,
    role: Role.platform_owner,
  })

  console.log('\nAdmins (no org yet — they will create one via the app):')
  for (const admin of ADMINS) {
    await upsertAccount({
      email: admin.email,
      password: admin.password,
      fullName: admin.fullName,
      role: Role.admin,
    })
  }

  console.log('\n✅ Done.\n')
  console.log('─────────────────────────────────────────────────────')
  console.log(`  Platform Owner → ${PLATFORM_OWNER.email} / ${PLATFORM_OWNER.password}`)
  ADMINS.forEach((a) =>
    console.log(`  Admin          → ${a.email} / ${a.password}`)
  )
  console.log('─────────────────────────────────────────────────────\n')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })