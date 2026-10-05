// backend/src/seeds/backfill-missing-display-ids.ts
//
// One-time backfill for accounts whose Profile.metadata was destroyed by the
// saveRefreshToken/clearRefreshToken bug (see auth.repository.ts — those two
// methods used to replace the whole `metadata` JSON blob instead of merging,
// wiping out educatorId/studentId on every login/logout/refresh). The fix in
// auth.repository.ts stops NEW damage; this script repairs accounts that were
// already hit before the fix shipped.
//
// The ORIGINAL codes are unrecoverable (they only ever lived in the now-wiped
// JSON). This assigns fresh EDU-/STU- codes to any educator/student account
// that currently has no code in metadata, without touching any other key
// already in metadata (notably: does not touch refreshToken).
//
// SAFE BY DEFAULT: dry-run unless you pass --apply. Always run without
// --apply first and read the output before applying.
//
//   npx ts-node -r tsconfig-paths/register src/seeds/backfill-missing-display-ids.ts
//   npx ts-node -r tsconfig-paths/register src/seeds/backfill-missing-display-ids.ts --apply
//
// Connection setup mirrors DatabaseService (core/database/database.provider.ts)
// exactly — same local-vs-managed-Postgres SSL detection, same
// DB_SSL_REJECT_UNAUTHORIZED opt-in, same sslmode stripping — so this script
// connects correctly whether run against local Postgres or the managed
// (self-signed TLS) instance.

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { generateEducatorId } from '@/modules/educator/educator.utils';
import { generateStudentId } from '@/modules/student/student.utils';

const APPLY = process.argv.includes('--apply');

function buildPrismaClient(): PrismaClient {
  const skipVerify = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false';

  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  let ssl: { rejectUnauthorized: boolean } | undefined;

  const isLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  if (skipVerify && !isLocal) {
    ssl = { rejectUnauthorized: false };

    const queryIndex = connectionString.lastIndexOf('?');
    if (queryIndex !== -1) {
      const params = new URLSearchParams(connectionString.slice(queryIndex + 1));
      params.delete('sslmode');
      const query = params.toString();
      connectionString =
        connectionString.slice(0, queryIndex) + (query ? `?${query}` : '');
    }
  }

  const pool = new Pool({
    connectionString,
    ...(ssl ? { ssl } : {}),
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter, log: ['warn', 'error'] });
}

const prisma = buildPrismaClient();

/**
 * Reads Prisma's `JsonValue` metadata as a plain, non-array object, or `null`
 * for anything else (null, scalar, array).
 *
 * The return type is declared rather than inferred on purpose. A type
 * *predicate* over `JsonValue` (`string | number | boolean | JsonObject |
 * JsonArray | null`) cannot exclude `JsonArray`, because an array is also an
 * "object" — so the narrowed union keeps that branch and every property read
 * below errors. Returning the shape outright avoids the predicate entirely.
 */
function toPlainMeta(value: unknown): Record<string, any> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, any>;
}

/** Generates a code and retries on the (currently unenforced) chance of a collision. */
function generateUniqueCode(
  role: 'educator' | 'student',
  existingCodes: Set<string>,
): string {
  const gen = role === 'educator' ? generateEducatorId : generateStudentId;
  let code = gen();
  let attempts = 0;
  while (existingCodes.has(code) && attempts < 20) {
    code = gen();
    attempts++;
  }
  existingCodes.add(code);
  return code;
}

async function main() {
  console.log(`\n=== Backfill missing EDU-/STU- display IDs ===`);
  console.log(APPLY ? 'MODE: APPLY (will write to DB)' : 'MODE: DRY RUN (no writes — pass --apply to write)');
  console.log('');

  const accounts = await prisma.account.findMany({
    where: {
      role: { in: ['educator', 'student'] },
      deleted_at: null,
    },
    include: { profile: true },
  });

  // Pre-collect every existing code so new ones can't collide with a live one.
  const existingCodes = new Set<string>();
  for (const acc of accounts) {
    const meta = toPlainMeta(acc.profile?.metadata);
    if (!meta) continue;
    if (typeof meta.educatorId === 'string') existingCodes.add(meta.educatorId);
    if (typeof meta.studentId === 'string') existingCodes.add(meta.studentId);
  }

  const affected: { id: string; email: string; role: string; assignedCode: string }[] = [];

  for (const acc of accounts) {
    if (!acc.profile) {
      console.warn(`SKIP ${acc.email} (${acc.role}) — no Profile row at all, out of scope for this script.`);
      continue;
    }

    const meta = toPlainMeta(acc.profile.metadata) ?? {};
    const hasCode =
      acc.role === 'educator'
        ? typeof meta.educatorId === 'string'
        : typeof meta.studentId === 'string';

    if (hasCode) continue; // healthy account, nothing to do

    const newCode = generateUniqueCode(acc.role as 'educator' | 'student', existingCodes);
    const codeKey = acc.role === 'educator' ? 'educatorId' : 'studentId';

    affected.push({ id: acc.id, email: acc.email, role: acc.role, assignedCode: newCode });

    console.log(
      `${APPLY ? 'FIXING' : 'WOULD FIX'} ${acc.email} (${acc.role}) — assigning ${newCode}` +
        (acc.role === 'student' && (meta.levelId === undefined || meta.sectionId === undefined)
          ? ' [note: levelId/sectionId also missing from metadata — check StudentProgramEnrollment for this student, that is likely the canonical source now; profile.metadata.levelId/sectionId is described as a legacy cache in student.repository.ts]'
          : ''),
    );

    if (APPLY) {
      // Preserve every existing key (in particular: refreshToken) — only add the code.
      await prisma.profile.update({
        where: { account_id: acc.id },
        data: {
          metadata: {
            ...meta,
            [codeKey]: newCode,
          },
        },
      });
    }
  }

  console.log('');
  console.log(`${affected.length} account(s) ${APPLY ? 'fixed' : 'would be fixed'}.`);
  if (affected.length > 0) {
    console.table(affected);
  }
  if (!APPLY && affected.length > 0) {
    console.log('\nRe-run with --apply to write these changes.');
  }
}

main()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });