/**
 * constants.ts
 *
 * Single source of truth for the fixed values every domain seeder depends
 * on: the seed password, the target school year window, the per-admin
 * program/educator/student allocation, and the progKey <-> grading-scheme
 * preset-name mapping (shared by seedGradingSchemes and seedClasses so the
 * two can never drift into mismatched namespaces).
 */

export const SALT_ROUNDS = 10;
export const SEED_PASSWORD = 'seed123';
export const SY_START = new Date('2025-07-01');
export const SY_END = new Date('2026-06-30');
export const SY_NAME = 'SY 2025-2026';

export const PROGRAM_SCHEME_PRESET_NAME: Record<string, string> = {
  daycare: 'Daycare Scheme',
  kinder: 'Kindergarten Scheme',
  elementary: 'Elementary Scheme',
  jhs: 'High School Scheme',
  shs: 'Senior High School Scheme',
  college: 'College Scheme',
};

export const SCHEME_PRESET_NAME_TO_PROGRAM: Record<string, string> =
  Object.fromEntries(
    Object.entries(PROGRAM_SCHEME_PRESET_NAME).map(([k, v]) => [v, k]),
  );

export interface AdminSeedConfig {
  adminIndex: number;
  programs: string[];
  educators: number;
  students: number;
}

export const ADMIN_CONFIGS: AdminSeedConfig[] = [
  {
    adminIndex: 0,
    programs: ['daycare', 'kinder', 'elementary', 'jhs', 'shs', 'college'],
    educators: 30,
    students: 500,
  },
  { adminIndex: 1, programs: ['daycare'], educators: 20, students: 100 },
  { adminIndex: 2, programs: ['jhs', 'shs'], educators: 25, students: 300 },
  { adminIndex: 3, programs: ['jhs'], educators: 20, students: 200 },
  { adminIndex: 4, programs: ['college'], educators: 25, students: 300 },
  { adminIndex: 5, programs: ['daycare'], educators: 20, students: 100 },
  { adminIndex: 6, programs: ['shs', 'college'], educators: 25, students: 250 },
  {
    adminIndex: 7,
    programs: ['kinder', 'daycare'],
    educators: 20,
    students: 150,
  },
];
