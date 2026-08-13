// backend/src/modules/concern/data/default-categories.data.ts

/**
 * Default concern categories seeded for every org. Used by the org-seeder and
 * by the lazy self-healing backfill (`ConcernCoreRepository.ensureDefaultCategories`)
 * so the category list is never empty.
 */
export const DEFAULT_CONCERN_CATEGORIES = [
  'Account Issues',
  'Enrollment Concerns',
  'Payment or Fees',
  'Technical Problems',
  'Schedule or Class Issues',
  'General Inquiry',
] as const;
