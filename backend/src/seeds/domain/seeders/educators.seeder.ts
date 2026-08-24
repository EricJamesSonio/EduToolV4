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
