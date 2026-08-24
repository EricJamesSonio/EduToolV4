import { db } from '../db';
import { getSharedSchoolYearWindow } from '../constants';
import { seedId } from '../../../modules/org-seeder/seed-id';
import type { SchoolYearWindow } from '../utils/school-year-window.util';

export async function seedSchoolYear(
  orgId: string,
  window?: SchoolYearWindow,
): Promise<string> {
  const win = window ?? getSharedSchoolYearWindow();
  const id = seedId('school-year', win.name, orgId);

  // Auto-end any active years that already expired (handles legacy SY 2025-2026)
  await db.schoolYear.updateMany({
    where: { org_id: orgId, status: 'active', end_date: { lt: new Date() } },
    data: { status: 'ended' },
  });

  const existing = await db.schoolYear.findFirst({ where: { id } });
  if (existing) {
    // Keep dates in sync if window drifted (re-seed same id but window changed is unlikely since window is cached)
    if (
      existing.start_date?.getTime() !== win.start.getTime() ||
      existing.end_date?.getTime() !== win.end.getTime() ||
      existing.name !== win.name
    ) {
      await db.schoolYear.update({
        where: { id },
        data: { name: win.name, start_date: win.start, end_date: win.end },
      });
    }
    return existing.id;
  }

  const sy = await db.schoolYear.create({
    data: {
      id,
      org_id: orgId,
      name: win.name,
      status: 'pending',
      start_date: win.start,
      end_date: win.end,
    },
  });

  // Deactivate any other active school years for this org (should already be ended by the query above)
  await db.schoolYear.updateMany({
    where: { org_id: orgId, id: { not: id }, status: 'active' },
    data: { status: 'ended' },
  });

  console.log(`  school-year created: ${win.name} (${win.start.toISOString().slice(0, 10)} -> ${win.end.toISOString().slice(0, 10)}, pending)`);
  return sy.id;
}
