import { EducatorSubjectService } from '../educator-subject.service';
import type { DatabaseService } from '@/core/database/database.provider';

/** A subject row in one school year, hanging off a level. */
const subject = (id: string, name: string, levelId = 'lvl-from') => ({
  id,
  name,
  subject_type: 'minor',
  program_id: null,
  level_id: levelId,
  course_id: null,
  strand_id: null,
});

describe('EducatorSubjectService', () => {
  const makeService = (db: any = {}) => {
    const repo = {
      assertEducator: jest.fn().mockResolvedValue(undefined),
      assertSubjectsInOrg: jest.fn().mockResolvedValue(undefined),
      replaceSet: jest.fn().mockResolvedValue(2),
      addMany: jest.fn().mockResolvedValue({ count: 1 }),
      findByEducator: jest.fn().mockResolvedValue([]),
      findSubjectIds: jest.fn().mockResolvedValue([]),
      findEducatorsForSubject: jest.fn().mockResolvedValue([]),
    };
    const audit = { logAdminAction: jest.fn().mockResolvedValue(undefined) };
    const merged = {
      educatorSubject: { findMany: jest.fn().mockResolvedValue([]) },
      account: { findMany: jest.fn().mockResolvedValue([]) },
      program: { findMany: jest.fn().mockResolvedValue([]) },
      level: { findMany: jest.fn().mockResolvedValue([]) },
      course: { findMany: jest.fn().mockResolvedValue([]) },
      strand: { findMany: jest.fn().mockResolvedValue([]) },
      subject: { findMany: jest.fn().mockResolvedValue([]) },
      ...db,
    };
    const service = new EducatorSubjectService(
      repo as any,
      merged as unknown as DatabaseService,
      audit as any,
    );
    return { service, repo, audit };
  };

  describe('replaceSet', () => {
    it('deduplicates before writing', async () => {
      const { service, repo } = makeService();
      await service.replaceSet('org-1', 'ed-1', ['s1', 's2', 's1'], 'actor-1');
      expect(repo.replaceSet).toHaveBeenCalledWith('org-1', 'ed-1', ['s1', 's2']);
    });

    it('validates every subject belongs to the org', async () => {
      const { service, repo } = makeService();
      await service.replaceSet('org-1', 'ed-1', ['s1'], 'actor-1');
      expect(repo.assertSubjectsInOrg).toHaveBeenCalledWith('org-1', ['s1']);
    });

    it('writes an audit entry', async () => {
      const { service, audit } = makeService();
      await service.replaceSet('org-1', 'ed-1', ['s1'], 'actor-1');
      expect(audit.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'educator_subjects_replaced',
          orgId: 'org-1',
        }),
      );
    });

    it('can clear the whole set', async () => {
      const { service, repo } = makeService();
      await service.replaceSet('org-1', 'ed-1', [], 'actor-1');
      expect(repo.replaceSet).toHaveBeenCalledWith('org-1', 'ed-1', []);
    });
  });

  describe('carryOver', () => {
    /** db whose "from" year has `from` and "to" year has `to`. */
    const carryDb = (
      from: any[],
      to: any[],
      links: Array<{ educator_id: string; subject_id: string }> = [],
      levelNames: [string, string] = ['Grade 7', 'Grade 7'],
    ) => ({
      educatorSubject: { findMany: jest.fn().mockResolvedValue(links) },
      account: { findMany: jest.fn().mockResolvedValue([{ id: 'ed-1' }]) },
      program: {
        findMany: jest.fn().mockResolvedValue([{ id: 'prog-1', type: 'jhs' }]),
      },
      level: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'lvl-from', name: levelNames[0], program_id: 'prog-1' },
          { id: 'lvl-to', name: levelNames[1], program_id: 'prog-1' },
        ]),
      },
      course: { findMany: jest.fn().mockResolvedValue([]) },
      strand: { findMany: jest.fn().mockResolvedValue([]) },
      subject: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce(from)
          .mockResolvedValueOnce(to),
      },
    });

    it('refuses to copy a year onto itself', async () => {
      const { service } = makeService();
      await expect(
        service.carryOver('org-1', 'sy-1', 'sy-1', undefined, 'actor-1'),
      ).rejects.toThrow(/different school year/);
    });

    it('matches on name + program type + level name', async () => {
      const db = carryDb(
        [subject('s-from', 'Mathematics')],
        [subject('s-to', 'mathematics', 'lvl-to')],
        [{ educator_id: 'ed-1', subject_id: 's-from' }],
      );
      const { service, repo } = makeService(db);
      const out = await service.carryOver('org-1', 'sy-1', 'sy-2', undefined, 'a');
      expect(out.created).toBe(1);
      expect(repo.addMany).toHaveBeenCalledWith('org-1', 'ed-1', ['s-to']);
      expect(out.unmatched).toEqual([]);
    });

    it('does NOT match the same name at a different level', async () => {
      // Including level name in the key is the whole point: "Mathematics" at
      // Grade 7 must not attach to Mathematics at Grade 8.
      const db = carryDb(
        [subject('s-from', 'Mathematics')],
        [subject('s-to', 'Mathematics', 'lvl-to')],
        [{ educator_id: 'ed-1', subject_id: 's-from' }],
        ['Grade 7', 'Grade 8'],
      );
      const { service } = makeService(db);
      const out = await service.carryOver('org-1', 'sy-1', 'sy-2', undefined, 'a');
      expect(out.created).toBe(0);
      expect(out.unmatched).toHaveLength(1);
    });

    it('reports an unmatched subject instead of guessing', async () => {
      const db = carryDb(
        [subject('s-from', 'Advanced Physics')],
        [subject('s-to', 'Mathematics', 'lvl-to')],
        [{ educator_id: 'ed-1', subject_id: 's-from' }],
      );
      const { service } = makeService(db);
      const out = await service.carryOver('org-1', 'sy-1', 'sy-2', undefined, 'a');
      expect(out.created).toBe(0);
      expect(out.unmatched[0]).toMatchObject({
        educatorId: 'ed-1',
        subjectName: 'Advanced Physics',
      });
    });

    it('ignores links whose subject is outside the "from" year', async () => {
      const db = carryDb([], [], [{ educator_id: 'ed-1', subject_id: 'ghost' }]);
      const { service } = makeService(db);
      const out = await service.carryOver('org-1', 'sy-1', 'sy-2', undefined, 'a');
      expect(out.created).toBe(0);
      expect(out.unmatched).toEqual([]);
    });

    it('groups multiple links for one educator into a single write', async () => {
      const db = carryDb(
        [subject('s1', 'Math'), subject('s2', 'Science')],
        [subject('t1', 'Math', 'lvl-to'), subject('t2', 'Science', 'lvl-to')],
        [
          { educator_id: 'ed-1', subject_id: 's1' },
          { educator_id: 'ed-1', subject_id: 's2' },
        ],
      );
      const { service, repo } = makeService(db);
      await service.carryOver('org-1', 'sy-1', 'sy-2', undefined, 'a');
      expect(repo.addMany).toHaveBeenCalledTimes(1);
      expect(repo.addMany).toHaveBeenCalledWith('org-1', 'ed-1', ['t1', 't2']);
    });
  });
});