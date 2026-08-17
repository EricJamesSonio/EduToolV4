import { SubjectPrerequisiteService } from '../subject-prerequisite.service';
import { SubjectPrerequisiteRepository } from '../subject-prerequisite.repository';

describe('Subject prerequisite - proof tests (Lane 1 item 5)', () => {
  describe('(a) bulkCreate is not atomic - a failed import wipes existing prerequisite links', () => {
    it('PROOF: when the bulk insert FALTERS, the earlier delete must NOT have torn out the old links', async () => {
      // In-memory stand-in for the DB: the two pre-existing prerequisite links
      // for subject s1 that must survive a failed re-import.
      const rows: { subject_id: string; prerequisite_id: string; org_id: string }[] = [
        { subject_id: 's1', prerequisite_id: 'p-old-1', org_id: 'org-1' },
        { subject_id: 's1', prerequisite_id: 'p-old-2', org_id: 'org-1' },
      ];

      // Faithful to the repository contract (subject-prerequisite.repository.ts):
      //  - deleteAllForSubject -> deleteMany (commits, no transaction)
      //  - bulkCreate          -> createMany (can throw mid-batch, e.g. FK error)
      const fault = new Error('createMany failed: foreign key constraint');
      const repo = {
        deleteAllForSubject: jest.fn(async (subject_id: string) => {
          const survivors = rows.filter((r) => r.subject_id !== subject_id);
          rows.length = 0;
          rows.push(...survivors);
        }),
        bulkCreate: jest.fn(async () => {
          throw fault;
        }),
        getPrerequisitesWithGrades: jest.fn(async () => []),
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        findBySubject: jest.fn().mockResolvedValue([]),
        delete: jest.fn(),
      };

      const service = new SubjectPrerequisiteService(repo as any);

      // Simulate a re-import that starts (delete) then dies mid-insert.
      await expect(
        service.bulkCreate('org-1', {
          subject_id: 's1',
          prerequisite_ids: ['p-new-1', 'p-new-2'],
        }),
      ).rejects.toThrow('createMany failed: foreign key constraint');

      // Correct behavior: the whole replace must be a single transaction, so on
      // failure the two pre-existing links survive intact. Current code
      // (service L38-39) runs deleteAllForSubject THEN bulkCreate with no tx,
      // so the delete is already committed when the insert throws -> zero links
      // remain. A correct implementation leaves length 2 here.
      expect(rows.filter((r) => r.subject_id === 's1').length).toBe(2);
    });

    it('PROOF: an interrupted import silently makes checkEligibility approve every candidate', async () => {
      // Downstream half of the same bug: after the torn import above the
      // subject has zero prerequisite rows persisted, so checkEligibility (L71)
      // sees rows.length === 0 and returns fully eligible.
      const repo = {
        getPrerequisitesWithGrades: jest.fn().mockResolvedValue([]),
        deleteAllForSubject: jest.fn().mockResolvedValue({ count: 2 }),
        bulkCreate: jest.fn().mockResolvedValue({ count: 2 }),
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        findBySubject: jest.fn().mockResolvedValue([]),
        delete: jest.fn(),
      };

      const service = new SubjectPrerequisiteService(repo as any);

      // Correct behavior: a student who has never completed the prerequisite
      // must still be DENIED if the subject has prerequisites defined. After an
      // interrupted import the subject's requirements silently vanish and every
      // candidate becomes eligible - that silent downgrade is the bug.
      const result = await service.checkEligibility('s1', 'stu-1', 'org-1');
      expect(result).toEqual({ eligible: false, missing: expect.any(Array) });
    });
  });

  describe('(b) getPrerequisitesWithGrades picks with grades.find and no orderBy', () => {
    it('PROOF: two locked grades for the same prereq must resolve to the LATEST one', async () => {
      // Real repository query (L80-94) fetches grades WITHOUT orderBy, then
      // grades.find((g) => g.class.subject_id === p.prerequisite_id) (L100)
      // blindly takes the FIRST row the DB happens to return. Across two school
      // years a student legitimately owns two locked grades for one subject; the
      // correct resolution is deterministic "latest grade wins".
      //
      // Here the DB (mock) happens to return the OLD grade first. A repo that
      // ordered by the effective period would pick the 90 (latest) and pass.
      const fakeDb = {
        subjectPrerequisite: {
          findMany: jest.fn().mockResolvedValue([
            { prerequisite_id: 'p-math', prerequisite: { id: 'p-math', name: 'Math' } },
          ]),
        },
        grade: {
          findMany: jest.fn().mockResolvedValue([
            // old school year, failed: arrives first from this unordered query
            { id: 'g-old', class: { subject_id: 'p-math' }, final_score: 40, is_locked: true },
            // latest school year, passed
            { id: 'g-new', class: { subject_id: 'p-math' }, final_score: 90, is_locked: true },
          ]),
        },
      };

      const repo = new SubjectPrerequisiteRepository(fakeDb as any);
      const service = new SubjectPrerequisiteService(repo as any);

      // Correct behavior: the latest locked grade (90) is selected -> eligible.
      const result = await service.checkEligibility('s1', 'stu-1', 'org-1');
      expect(result).toEqual({ eligible: true, missing: [] });
    });

    it('sanity control: a single locked passing grade resolves correctly', async () => {
      const fakeDb = {
        subjectPrerequisite: {
          findMany: jest.fn().mockResolvedValue([
            { prerequisite_id: 'p-math', prerequisite: { id: 'p-math', name: 'Math' } },
          ]),
        },
        grade: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'g-new', class: { subject_id: 'p-math' }, final_score: 90, is_locked: true },
          ]),
        },
      };

      const repo = new SubjectPrerequisiteRepository(fakeDb as any);
      const service = new SubjectPrerequisiteService(repo as any);

      const result = await service.checkEligibility('s1', 'stu-1', 'org-1');
      expect(result).toEqual({ eligible: true, missing: [] });
    });
  });
});