import {
  restoreCourseIfArchived,
  restoreLevelIfArchived,
  restoreSectionIfArchived,
  restoreStrandIfArchived,
} from '../seed-restore';

/**
 * Re-seeding must handle archived rows: seeders find an archived row by its
 * deterministic seed id, and re-seeding must un-archive it (never leave it
 * hidden, never create a duplicate).
 */
describe('seed-restore helpers', () => {
  const makeDb = () => ({
    course: { findFirst: jest.fn(), update: jest.fn() },
    strand: { findFirst: jest.fn(), update: jest.fn() },
    level: { findFirst: jest.fn(), update: jest.fn() },
    section: { findFirst: jest.fn(), update: jest.fn() },
  });

  const cases = [
    ['course', restoreCourseIfArchived],
    ['strand', restoreStrandIfArchived],
    ['level', restoreLevelIfArchived],
    ['section', restoreSectionIfArchived],
  ] as const;

  for (const [model, restore] of cases) {
    describe(model, () => {
      it('un-archives an archived row and reports true', async () => {
        const db: any = makeDb();
        db[model].findFirst.mockResolvedValue({ id: 'row-1' });
        db[model].update.mockResolvedValue({ id: 'row-1', deleted_at: null });

        await expect(restore(db, 'row-1')).resolves.toBe(true);

        // Only archived rows are looked for...
        expect(db[model].findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'row-1', deleted_at: { not: null } },
          }),
        );
        // ...and the restore clears the flag.
        expect(db[model].update).toHaveBeenCalledWith({
          where: { id: 'row-1' },
          data: { deleted_at: null },
        });
      });

      it('leaves a live row untouched and reports false', async () => {
        const db: any = makeDb();
        db[model].findFirst.mockResolvedValue(null);

        await expect(restore(db, 'row-1')).resolves.toBe(false);
        expect(db[model].update).not.toHaveBeenCalled();
      });
    });
  }
});
