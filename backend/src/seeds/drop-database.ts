/**
 * drop-database.ts
 * Drops and recreates the database for a fresh start
 */

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const db = new PrismaClient()

async function main() {
  console.log('\n🗑️  Dropping and recreating database...\n')

  try {
    // Drop all tables using Prisma
    console.log('▶ Dropping all tables...')
    await db.$executeRaw`DROP SCHEMA public CASCADE`
    console.log('✓ Schema dropped')

    // Recreate schema
    console.log('▶ Recreating schema...')
    await db.$executeRaw`CREATE SCHEMA public`
    console.log('✓ Schema created')

    // Run migrations to recreate all tables
    console.log('▶ Running migrations...')
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    console.log('✓ Migrations applied')

    // Generate Prisma client
    console.log('▶ Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('✓ Prisma client generated')

    console.log('\n✅ DATABASE RESET COMPLETE')
    console.log('Database is now fresh and empty\n')

  } catch (error) {
    console.error('❌ Database reset failed:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
