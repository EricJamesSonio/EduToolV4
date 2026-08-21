import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * Build a Prisma "where" clause for case-insensitive name uniqueness checks.
 * 
 * @param name - the name to check
 * @param orgId - the organization ID (scoping)
 * @param excludeId - optional ID to exclude (for update operations)
 * @param scopes - optional additional where conditions (e.g. programId, levelId, programType, schoolYearId)
 * @returns Prisma where clause compatible with most entity name fields
 */
export function buildUniqueNameWhere(
  name: string,
  orgId: string,
  excludeId?: string,
  scopes: { [key: string]: any } = {},
) {
  const where: { [key: string]: any } = {
    org_id: orgId,
    name: {
      equals: name,
      mode: 'insensitive' as const,
    },
  };

  // Apply any additional scopes
  if (scopes.programId) {
    where.program_id = scopes.programId;
  }
  if (scopes.levelId) {
    where.level_id = scopes.levelId;
  }
  if (scopes.courseId) {
    where.course_id = scopes.courseId;
  }
  if (scopes.strandId) {
    where.strand_id = scopes.strandId;
  }
  if (scopes.programType) {
    where.program_type = scopes.programType;
  }
  if (scopes.schoolYearId) {
    where.school_year_id = scopes.schoolYearId;
  }

  // Exclude the current record on updates
  if (excludeId) {
    where.id = { not: excludeId };
  }

  return where;
}

/**
 * Assert that an entity name is unique within its scope.
 * Throws ConflictException if a duplicate is found.
 * 
 * @param findFirstFn - async function that returns the first matching entity (e.g. repo.findByName)
 * @param message - error message to show on duplicate
 */
export async function assertUniqueName<T>(
  findFirstFn: () => Promise<T | null>,
  message: string,
): Promise<void> {
  const existing = await findFirstFn();
  if (existing) {
    throw new ConflictException(message);
  }
}