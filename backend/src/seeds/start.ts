import { PrismaClient, Role, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { slugifyName } from '../modules/organization/organization.repository';
import { SCHOOLS } from './data/schools';
import { ADMINS } from './data/admins';

const db = new PrismaClient();

const SALT_ROUNDS = 10;

const PLATFORM_OWNER = {
  email: 'platform@edutool.dev',
  password: 'platform123',
  fullName: 'Platform Owner',
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function upsertAccount(params: {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  orgId?: string;
}) {
  const { email, password, fullName, role, orgId } = params;

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const account = await db.account.upsert({
    where: { email },
    update: {
      password: hashed,
      role,
      status: AccountStatus.active,
      deleted_at: null,
      org_id: orgId ?? null,
      is_registrar: false,
    },
    create: {
      org_id: orgId ?? null,
      role,
      email,
      password: hashed,
      status: AccountStatus.active,
      is_registrar: false,
    },
  });

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
  });

  console.log(`  ${role.padEnd(16)} ${email}${orgId ? ' (with org)' : ''}`);
  return account;
}

async function main() {
  console.log('\n🌱 START SEED PROCESS...\n');

  // 1. Platform Owner
  console.log('▶ Platform Owner');
  await upsertAccount({
    email: PLATFORM_OWNER.email,
    password: PLATFORM_OWNER.password,
    fullName: PLATFORM_OWNER.fullName,
    role: Role.platform_owner,
  });

  // 2. Admins with schools (admin 1–8)
  console.log('\n▶ Admin Accounts with Schools');
  for (let i = 0; i < 8; i++) {
    const admin = ADMINS[i];
    const school = SCHOOLS[i];

    const emailExt = slugify(school.name);

    // Reuse the same slug-generation logic as the normal application flow so
    // seeded organizations get a valid, URL-safe slug. Only fill a missing slug
    // so re-running the seed never invalidates already-shared enrollment links.
    const existingOrg = await db.organization.findUnique({
      where: { email_extension: emailExt },
    });
    const org = existingOrg
      ? await db.organization.update({
          where: { id: existingOrg.id },
          data: {
            name: school.name,
            description: school.description,
            address: school.address,
            logo_url: school.logo_url,
            ...(existingOrg.slug ? {} : { slug: slugifyName(school.name) }),
          },
        })
      : await db.organization.create({
          data: {
            name: school.name,
            description: school.description,
            address: school.address,
            logo_url: school.logo_url,
            email_extension: emailExt,
            slug: slugifyName(school.name),
          },
        });

    const account = await upsertAccount({
      email: admin.email,
      password: admin.password,
      fullName: admin.fullName,
      role: Role.admin,
      orgId: org.id,
    });

    if (!org.admin_account_id) {
      await db.organization.update({
        where: { id: org.id },
        data: { admin_account_id: account.id },
      });
    }
  }

  // 3. Org-less admins (admin 9–10)
  console.log('\n▶ Admin Accounts (no org)');
  for (let i = 8; i < ADMINS.length; i++) {
    const admin = ADMINS[i];
    await upsertAccount({
      email: admin.email,
      password: admin.password,
      fullName: admin.fullName,
      role: Role.admin,
    });
  }

  console.log('\n✅ SEED COMPLETE (platform owner + admins)');
  console.log(
    '▶ Run seed-domain-data.ts next to populate domain data (programs, levels, educators, students, classes)\n',
  );
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
