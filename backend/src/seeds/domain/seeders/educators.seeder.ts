import * as bcrypt from 'bcrypt';
import { AccountStatus } from '@prisma/client';
import { db } from '../db';
import { seedId } from '../../../modules/org-seeder/seed-id';
import { SALT_ROUNDS, SEED_PASSWORD } from '../constants';
import { buildEducatorEmail, generateEducatorId } from '../utils/identity.util';

export async function seedEducators(
  orgId: string,
  emailExtension: string,
  count: number,
): Promise<string[]> {
  const educatorIds: string[] = [];
  const password = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);

  for (let i = 1; i <= count; i++) {
    const name = `educator${i}`;
    const email = buildEducatorEmail(emailExtension, name);
    const id = seedId('account', email, orgId);

    const existing = await db.account.findFirst({ where: { id } });
    if (existing) {
      educatorIds.push(existing.id);
      continue;
    }

    const educatorId = generateEducatorId();
    const account = await db.account.create({
      data: {
        id,
        org_id: orgId,
        email,
        password,
        role: 'educator',
        status: AccountStatus.active,
        profile: {
          create: {
            full_name: name,
            metadata: { educatorId },
          },
        },
      },
    });
    educatorIds.push(account.id);
  }

  return educatorIds;
}


/**
 * Gives every educator a spread of teachable subjects across the school year.
 *
 * Without this a seeded org cannot use the class generator: it would fall back
 * to "assign to anyone", which is exactly what the readiness report warns about.
 * Links are spread by hashing the educator id so different educators end up with
 * different sets rather than every educator being able to teach everything.
 */
export async function seedEducatorSubjects(
  orgId: string,
  schoolYearId: string,
  educatorIds: string[],
): Promise<number> {
  if (educatorIds.length === 0) return 0;

  const subjects = await db.subject.findMany({
    where: { org_id: orgId, level: { school_year_id: schoolYearId } },
    select: { id: true },
  });
  if (subjects.length === 0) return 0;

  const rows: {
    org_id: string;
    educator_id: string;
    subject_id: string;
  }[] = [];

  for (const educatorId of educatorIds) {
    // Stable per-educator offset, so the assignment is deterministic across runs.
    const offset = hashCode(educatorId) % subjects.length;
    // A third of the catalog exercises the generator without making every
    // educator eligible for everything.
    const take = Math.max(1, Math.ceil(subjects.length / 3));
    for (let i = 0; i < take; i++) {
      rows.push({
        org_id: orgId,
        educator_id: educatorId,
        subject_id: subjects[(offset + i) % subjects.length].id,
      });
    }
  }

  const created = await db.educatorSubject.createMany({
    data: rows,
    skipDuplicates: true,
  });
  return created.count;
}

/** Small deterministic string hash (djb2). */
function hashCode(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return Math.abs(hash);
}
