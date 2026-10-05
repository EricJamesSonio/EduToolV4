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
      setSlots: jest.fn().mockResolvedValue(undefined),
      findSectionHolder: jest.fn().mockResolvedValue(null),
      getAssignmentsBySubject: jest.fn().mockResolvedValue(new Map()),
      sectionsWithLevels: jest.fn().mockResolvedValue(new Map()),
      subjectLevels: jest.fn().mockResolvedValue(new Map()),
    };
    const audit = { logAdminAction: jest.fn().mockResolvedValue(undefined) };
    const cfg = {
      getByOrg: jest.fn().mockResolvedValue({
        startTime: '08:00',
        endTime: '17:00',
        slotDuration: 30,
        activeWeekdays: [1, 2, 3, 4, 5],
        breaks: [],
      }),
    };
    const profiles = {
      get: jest.fn().mockResolvedValue({ effectiveWeekdays: [1, 2, 3, 4, 5] }),
    };
    const occupancy = { load: jest.fn().mockResolvedValue([]) };
    const merged = {
      educatorSubject: { findMany: jest.fn().mockResolvedValue([]) },
      account: { findMany: jest.fn().mockResolvedValue([]) },
      program: { findMany: jest.fn().mockResolvedValue([]) },
      level: { findMany: jest.fn().mockResolvedValue([]) },
      course: { findMany: jest.fn().mockResolvedValue([]) },
      strand: { findMany: jest.fn().mockResolvedValue([]) },
      subject: { findMany: jest.fn().mockResolvedValue([]) },
      section: { findMany: jest.fn().mockResolvedValue([]) },
      ...db,
    };
    const service = new EducatorSubjectService(
      repo as any,
      merged as unknown as DatabaseService,
      audit as any,
      cfg as any,
      profiles as any,
      occupancy as any,
    );
    return { service, repo, audit, cfg, profiles, occupancy };
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
      links: Array<{
        educator_id: string;
        subject_id: string;
        section_ids?: string[];
        section_slots?: Array<{ sectionId: string; slots: number[] }>;
      }> = [],
      levelNames: [string, string] = ['Grade 7', 'Grade 7'],
      sections: [any[], any[]] = [[], []],
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
      // from-year sections first, target-year sections second.
      section: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce(sections[0])
          .mockResolvedValueOnce(sections[1]),
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

    it('carries matched section assignments to the equivalent target sections', async () => {
      const db = carryDb(
        [subject('s-from', 'Mathematics')],
        [subject('s-to', 'mathematics', 'lvl-to')],
        [
          {
            educator_id: 'ed-1',
            subject_id: 's-from',
            section_ids: ['sec-from'],
            section_slots: [{ sectionId: 'sec-from', slots: [1, 2] }],
          },
        ],
        ['Grade 7', 'Grade 7'],
        [
          [{ id: 'sec-from', name: 'Section A', level_id: 'lvl-from' }],
          [{ id: 'sec-to', name: 'Section A', level_id: 'lvl-to' }],
        ],
      );
      const { service, repo } = makeService(db);
      const out = await service.carryOver('org-1', 'sy-1', 'sy-2', undefined, 'a');
      expect(out.sectionsCarried).toBe(1);
      expect(repo.setSlots).toHaveBeenCalledWith('org-1', 'ed-1', [
        {
          subjectId: 's-to',
          sections: [{ sectionId: 'sec-to', slots: [1, 2] }],
        },
      ]);
      expect(out.unmatched).toEqual([]);
    });

    it('reports a section with no target-year equivalent instead of guessing', async () => {
      const db = carryDb(
        [subject('s-from', 'Mathematics')],
        [subject('s-to', 'mathematics', 'lvl-to')],
        [
          {
            educator_id: 'ed-1',
            subject_id: 's-from',
            section_ids: ['sec-from'],
            section_slots: [{ sectionId: 'sec-from', slots: [1] }],
          },
        ],
        ['Grade 7', 'Grade 7'],
        [
          [{ id: 'sec-from', name: 'Section A', level_id: 'lvl-from' }],
          [{ id: 'sec-to', name: 'Section B', level_id: 'lvl-to' }],
        ],
      );
      const { service } = makeService(db);
      const out = await service.carryOver('org-1', 'sy-1', 'sy-2', undefined, 'a');
      expect(out.sectionsCarried).toBe(0);
      expect(out.unmatched).toHaveLength(1);
      expect(out.unmatched[0]).toMatchObject({
        educatorId: 'ed-1',
        subjectName: 'Mathematics',
      });
      expect(out.unmatched[0].reason).toMatch(/Section "Section A"/);
    });

    it('skips target pairs already held by another educator', async () => {
      const db = carryDb(
        [subject('s-from', 'Mathematics')],
        [subject('s-to', 'mathematics', 'lvl-to')],
        [
          {
            educator_id: 'ed-1',
            subject_id: 's-from',
            section_ids: ['sec-from'],
            section_slots: [{ sectionId: 'sec-from', slots: [1] }],
          },
        ],
        ['Grade 7', 'Grade 7'],
        [
          [{ id: 'sec-from', name: 'Section A', level_id: 'lvl-from' }],
          [{ id: 'sec-to', name: 'Section A', level_id: 'lvl-to' }],
        ],
      );
      const { service, repo } = makeService(db);
      repo.getAssignmentsBySubject.mockResolvedValue(
        new Map([
          [
            's-to',
            [
              {
                subjectId: 's-to',
                sectionId: 'sec-to',
                educatorId: 'ed-2',
                educatorName: 'Bob',
                slots: [1],
                wholePair: false,
                createdAt: new Date(),
              },
            ],
          ],
        ]),
      );
      const out = await service.carryOver('org-1', 'sy-1', 'sy-2', undefined, 'a');
      expect(out.sectionsCarried).toBe(0);
      expect(repo.setSlots).not.toHaveBeenCalled();
      expect(out.unmatched).toHaveLength(1);
      expect(out.unmatched[0].reason).toMatch(/already handled by Bob/);
    });
  });

  describe('setSlots', () => {
    const sectionsDb = () =>
      new Map([
        ['sec-1', { levelId: 'lvl-1', name: 'Section 1' }],
        ['sec-2', { levelId: 'lvl-1', name: 'Section 2' }],
        ['sec-other', { levelId: 'lvl-2', name: 'Section X' }],
      ]);
    // s1: 2 sessions/week x 60m = 120m per section.
    const levelsDb = () =>
      new Map([
        [
          's1',
          {
            levelId: 'lvl-1',
            name: 'Math',
            programType: 'jhs',
            sessionsPerWeek: 2,
            sessionMinutes: 60,
          },
        ],
      ]);

    const slotsService = () => {
      const h = makeService({
        program: {
          findMany: jest.fn().mockResolvedValue([{ id: 'prog-1', type: 'jhs' }]),
        },
        level: {
          findMany: jest
            .fn()
            .mockResolvedValue([
              { id: 'lvl-1', name: 'L1', program_id: 'prog-1' },
            ]),
        },
        subject: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 's1',
              name: 'Math',
              program_id: 'prog-1',
              level_id: 'lvl-1',
              course_id: null,
              strand_id: null,
            },
          ]),
        },
      });
      h.repo.findSubjectIds.mockResolvedValue(['s1']);
      h.repo.sectionsWithLevels.mockResolvedValue(sectionsDb());
      h.repo.subjectLevels.mockResolvedValue(levelsDb());
      return h;
    };

    const pick = (
      sections: Array<{ sectionId: string; slots: number[] }> = [
        { sectionId: 'sec-1', slots: [2, 1, 2] },
      ],
    ) => [{ subjectId: 's1', sections }];

    it('saves deduped slot picks', async () => {
      const { service, repo } = slotsService();
      const out = await service.setSlots('org-1', 'ed-1', 'sy-1', pick(), 'actor-1');
      expect(repo.setSlots).toHaveBeenCalledWith('org-1', 'ed-1', [
        {
          subjectId: 's1',
          sections: [{ sectionId: 'sec-1', slots: [1, 2] }],
        },
      ]);
      expect(out).toEqual({ updated: 1 });
    });

    it('rejects slots for a subject the educator does not teach', async () => {
      const { service } = slotsService();
      await expect(
        service.setSlots(
          'org-1',
          'ed-1',
          'sy-1',
          [{ subjectId: 's-unknown', sections: [{ sectionId: 'sec-1', slots: [1] }] }],
          'actor-1',
        ),
      ).rejects.toThrow(/before assigning slots/);
    });

    it('rejects a section outside the subject level', async () => {
      const { service } = slotsService();
      await expect(
        service.setSlots(
          'org-1',
          'ed-1',
          'sy-1',
          [{ subjectId: 's1', sections: [{ sectionId: 'sec-other', slots: [1] }] }],
          'actor-1',
        ),
      ).rejects.toThrow(/does not belong to the level/);
    });

    it('rejects a section outside the org', async () => {
      const { service } = slotsService();
      await expect(
        service.setSlots(
          'org-1',
          'ed-1',
          'sy-1',
          [{ subjectId: 's1', sections: [{ sectionId: 'ghost', slots: [1] }] }],
          'actor-1',
        ),
      ).rejects.toThrow(/do not exist in this organization/);
    });

    it('rejects a slot position beyond the weekly count', async () => {
      const { service } = slotsService();
      await expect(
        service.setSlots(
          'org-1',
          'ed-1',
          'sy-1',
          [{ subjectId: 's1', sections: [{ sectionId: 'sec-1', slots: [3] }] }],
          'actor-1',
        ),
      ).rejects.toThrow(/position 3 does not exist/);
    });

    it('rejects a subject outside the school year', async () => {
      const h = slotsService();
      // Year-aware programs: only sy-1 owns prog-1 here.
      const programFind = jest.fn().mockImplementation((args: any) =>
        args?.where?.school_year_id === 'sy-1'
          ? [{ id: 'prog-1', type: 'jhs' }]
          : [],
      );
      (h.service as any).db = {
        ...((h.service as any).db as any),
        program: { findMany: programFind },
      };
      await expect(
        h.service.setSlots('org-1', 'ed-1', 'sy-empty', pick(), 'actor-1'),
      ).rejects.toThrow(/do not belong to this school year/);
    });

    it('409s when another educator holds the pair, naming the holder', async () => {
      const { service, repo } = slotsService();
      repo.findSectionHolder.mockResolvedValue({
        educatorId: 'ed-2',
        educatorName: 'Bob',
      });
      await expect(
        service.setSlots('org-1', 'ed-1', 'sy-1', pick(), 'actor-1'),
      ).rejects.toThrow(/already assigned to Bob/);
      expect(repo.setSlots).not.toHaveBeenCalled();
    });

    it('blocks picks that overflow weekly capacity, with numbers', async () => {
      const { service, occupancy } = slotsService();
      // 44h of existing classes; capacity is 5 days x 9h = 45h.
      occupancy.load.mockResolvedValue([
        {
          classId: 'c',
          weekday: 1,
          startMin: 0,
          endMin: 2640,
          educatorId: 'ed-1',
          sectionId: 'sec-1',
          roomId: null,
        },
      ]);
      await expect(
        service.setSlots('org-1', 'ed-1', 'sy-1', pick(), 'actor-1'),
      ).rejects.toThrow(/Over capacity: 46\.0h of 45\.0h/);
    });

    it('capacity() reports the breakdown for the assignment UI', async () => {
      const { service, repo } = slotsService();
      repo.findByEducator.mockResolvedValue([
        {
          subject: { id: 's1' },
          section_ids: ['sec-1'],
          section_slots: [{ sectionId: 'sec-1', slots: [1, 2] }],
        },
      ]);
      const out = await service.capacity('org-1', 'ed-1', 'sy-1');
      expect(out).toEqual({
        capacityMin: 2700,
        existingMin: 0,
        pickedMin: 120,
        remainingMin: 2580,
        effectiveWeekdays: [1, 2, 3, 4, 5],
        windowStart: '08:00',
        windowEnd: '17:00',
        slotDuration: 30,
      });
    });
  });
});