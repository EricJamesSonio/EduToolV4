import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const db = new PrismaClient();

async function main() {
  console.log('\n🗑️  Dropping and recreating database...\n');

  try {
    console.log('▶ Dropping all tables...');
    await db.$executeRawUnsafe('DROP SCHEMA public CASCADE');
    console.log('✓ Schema dropped');

    console.log('▶ Recreating schema...');
    await db.$executeRawUnsafe('CREATE SCHEMA public');
    console.log('✓ Schema created');

    console.log('▶ Running migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✓ Migrations applied');

    console.log('\n✅ DATABASE RESET COMPLETE');
    console.log('Database is now fresh and empty\n');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
