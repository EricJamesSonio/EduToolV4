import { PrismaClient } from '@prisma/client';

/**
 * Re-seeding semantics for soft-deleted (archived) rows.
 *
 * Seeders upsert by deterministic seed ID, so they always FIND an archived row
 * instead of creating a duplicate. Re-seeding means "this entity should be live
 * again", so the seeder un-archives the row (deleted_at -> NULL) instead of
 * silently leaving it hidden: a restored entity must never stay archived, and a
 * re-run must never produce a duplicate row.
 *
 * Each helper returns true when the row was archived and is now restored,
 * false when the row was already live (or missing entirely).
 */

export async function restoreCourseIfArchived(
  db: PrismaClient,
  id: string,
): Promise<boolean> {
  const archived = await db.course.findFirst({
    where: { id, deleted_at: { not: null } },
    select: { id: true },
  });
  if (!archived) return false;
  await db.course.update({ where: { id }, data: { deleted_at: null } });
  return true;
}

export async function restoreStrandIfArchived(
  db: PrismaClient,
  id: string,
): Promise<boolean> {
  const archived = await db.strand.findFirst({
    where: { id, deleted_at: { not: null } },
    select: { id: true },
  });
  if (!archived) return false;
  await db.strand.update({ where: { id }, data: { deleted_at: null } });
  return true;
}

export async function restoreLevelIfArchived(
  db: PrismaClient,
  id: string,
): Promise<boolean> {
  const archived = await db.level.findFirst({
    where: { id, deleted_at: { not: null } },
    select: { id: true },
  });
  if (!archived) return false;
  await db.level.update({ where: { id }, data: { deleted_at: null } });
  return true;
}

export async function restoreSectionIfArchived(
  db: PrismaClient,
  id: string,
): Promise<boolean> {
  const archived = await db.section.findFirst({
    where: { id, deleted_at: { not: null } },
    select: { id: true },
  });
  if (!archived) return false;
  await db.section.update({ where: { id }, data: { deleted_at: null } });
  return true;
}