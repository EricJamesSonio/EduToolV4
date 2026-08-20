import { db } from '../db';
import { SY_END, SY_NAME, SY_START } from '../constants';
import { seedId } from '../../../modules/org-seeder/seed-id';

export async function seedSchoolYear(orgId: string): Promise<string> {
  const id = seedId('school-year', SY_NAME, orgId);
  const existing = await db.schoolYear.findFirst({ where: { id } });
  if (existing) return existing.id;

  const sy = await db.schoolYear.create({
    data: {
      id,
      org_id: orgId,
      name: SY_NAME,
      status: 'active',
      start_date: SY_START,
      end_date: SY_END,
    },
  });

  // Deactivate any other active school years for this org
  await db.schoolYear.updateMany({
    where: { org_id: orgId, id: { not: id }, status: 'active' },
    data: { status: 'ended' },
  });

  console.log(`  school-year created: ${SY_NAME}`);
  return sy.id;
}
