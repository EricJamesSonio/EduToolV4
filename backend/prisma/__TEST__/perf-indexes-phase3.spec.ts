import * as fs from 'fs';
import * as path from 'path';

// Phase 3: drift guard — the single migration must contain every identified
// index, the Prisma schema must declare every non-partial one (drift-free
// sync), and the CONCURRENTLY companion must mirror the same set.
// Runs without a database (pure file assertions).

const PRISMA_DIR = path.resolve(__dirname, '..');
const MIGRATION_SQL = path.join(
  PRISMA_DIR,
  'migrations',
  '20260928000001_perf_hot_path_indexes_2',
  'migration.sql',
);
const COMPANION_SQL = path.join(
  PRISMA_DIR,
  'scripts',
  'apply-perf-indexes-2-concurrently.sql',
);
const SCHEMA = path.join(PRISMA_DIR, 'schema.prisma');

// Non-partial indexes: must exist in schema.prisma (as @@index), migration.sql
// (plain CREATE INDEX) and the companion (CONCURRENTLY).
const SCHEMA_INDEXES = [
  'ManualScore_org_id_class_id_term_id_idx',
  'Submission_org_id_student_id_idx',
  'Submission_assessment_id_status_idx',
  'Grade_org_id_student_id_is_locked_idx',
  'Question_assessment_id_idx',
  'SubmissionAnswer_submission_id_idx',
  'AttendanceSession_class_id_date_idx',
  'AuditLog_org_id_entity_type_entity_id_idx',
  'AuditLog_org_id_actor_id_idx',
  'Meeting_class_id_is_ephemeral_status_idx',
];

// Partial indexes: migration-only by design (Prisma cannot express WHERE).
const PARTIAL_INDEXES = [
  'Notification_org_id_account_id_created_at_active_idx',
  'Submission_reopened_until_active_idx',
];

describe('Phase 3 perf index coverage (no DB required)', () => {
  it('migration.sql contains the full index set', () => {
    const sql = fs.readFileSync(MIGRATION_SQL, 'utf8');
    for (const name of [...SCHEMA_INDEXES, ...PARTIAL_INDEXES]) {
      expect(sql).toContain(`"${name}"`);
    }
  });

  it('schema.prisma declares every non-partial index', () => {
    const schema = fs.readFileSync(SCHEMA, 'utf8');
    const indexLines = schema
      .split('\n')
      .filter((line) => line.trim().startsWith('@@index'));
    const expectations: Array<[string, string]> = [
      ['ManualScore', '@@index([org_id, class_id, term_id])'],
      ['Submission', '@@index([org_id, student_id])'],
      ['Submission', '@@index([assessment_id, status])'],
      ['Grade', '@@index([org_id, student_id, is_locked])'],
      ['Question', '@@index([assessment_id])'],
      ['SubmissionAnswer', '@@index([submission_id])'],
      ['AttendanceSession', '@@index([class_id, date])'],
      ['AuditLog', '@@index([org_id, entity_type, entity_id])'],
      ['AuditLog', '@@index([org_id, actor_id])'],
      ['Meeting', '@@index([class_id, is_ephemeral, status])'],
    ];
    for (const [, line] of expectations) {
      expect(indexLines.some((l) => l.trim() === line)).toBe(true);
    }
    expect(indexLines.length).toBeGreaterThanOrEqual(expectations.length);
  });

  it('CONCURRENTLY companion mirrors the same set', () => {
    const companion = fs.readFileSync(COMPANION_SQL, 'utf8');
    for (const name of [...SCHEMA_INDEXES, ...PARTIAL_INDEXES]) {
      expect(companion).toContain(
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS "${name}"`,
      );
    }
  });

  it('migration stays transaction-safe (no CONCURRENTLY statements)', () => {
    const statements = fs
      .readFileSync(MIGRATION_SQL, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('--'));
    for (const line of statements) {
      expect(line).not.toMatch(/CONCURRENTLY/i);
    }
  });
});
