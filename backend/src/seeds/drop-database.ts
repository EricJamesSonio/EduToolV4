import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

function assertLocalOnly(): void {
  const url = process.env.DATABASE_URL ?? '';
  const looksLocal =
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('[::1]');

  if (process.env.APP_TARGET !== 'local' || !looksLocal) {
    console.error(
      '\n❌ Refusing to drop the database: this script only runs on LOCAL.',
    );
    console.error('   Run it with: npm run drop_db\n');
    process.exit(1);
  }
}

assertLocalOnly();

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