import { EducatorSubjectService } from '../educator-subject.service';
import { EducatorSubjectRepository } from '../educator-subject.repository';
import type { DatabaseService } from '@/core/database/database.provider';

describe('EducatorSubjectService', () => {
  const makeService = (db: any = {}) => {
    const repo = {
      assertEducator: jest.fn().mockResolvedValue(undefined),
      assertSubjectsInOrg: jest.fn().mockResolvedValue(undefined),
      replaceSet: jest.fn().mockResolvedValue(2),
      findByEducator: jest.fn().mockResolvedValue([]),
      findEducatorsForSubject: jest.fn().mockResolvedValue([]),
      findGlobalKeys: jest.fn().mockResolvedValue([]),
      findGlobalEducatorsByKeys: jest.fn().mockResolvedValue([]),
      subjectKeyParts: jest.fn().mockResolvedValue(new Map()),
      upsertGlobalKeys: jest.fn().mockResolvedValue(undefined),
      deleteGlobalKeys: jest.fn().mockResolvedValue(undefined),
      deleteGlobalKeysByKey: jest.fn().mockResolvedValue(undefined),
      replaceYearPicks: jest.fn().mockResolvedValue(undefined),
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
      $transaction: jest.fn(async (cb: any) =>
        cb({ educatorSubject: { deleteMany: jest.fn() } }),
      ),
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
    const keyOf = (name: string) =>
      `${name.toLowerCase()}|jhs|grade 7||`;
    const partsFor = (ids: string[]) =>
      new Map(
        ids.map((id) => [
          id,
          {
            name: id === 's1' ? 'Math' : 'Science',
            programType: 'jhs',
            levelName: 'Grade 7',
            courseName: null,
            strandName: null,
          },
        ]),
      );

    it('upserts global keys for the new set', async () => {
      const { service, repo } = makeService();
      repo.subjectKeyParts.mockResolvedValue(partsFor(['s1', 's2']));
      const out = await service.replaceSet('org-1', 'ed-1', ['s1', 's2', 's1'], 'actor-1');
      expect(out).toEqual({ count: 2 });
      expect(repo.upsertGlobalKeys).toHaveBeenCalledWith(
        'org-1',
        'ed-1',
        expect.arrayContaining([
          expect.objectContaining({ key: keyOf('Math') }),
          expect.objectContaining({ key: keyOf('Science') }),
        ]),
        expect.anything(),
      );
    });

    it('validates every subject belongs to the org', async () => {
      const { service, repo } = makeService();
      repo.subjectKeyParts.mockResolvedValue(partsFor(['s1']));
      await service.replaceSet('org-1', 'ed-1', ['s1'], 'actor-1');
      expect(repo.assertSubjectsInOrg).toHaveBeenCalledWith('org-1', ['s1']);
    });

    it('deletes keys (and their picks) dropped from the set', async () => {
      const { service, repo } = makeService();
      repo.subjectKeyParts.mockResolvedValue(partsFor(['s1']));
      repo.findGlobalKeys.mockResolvedValue([
        { subject_key: keyOf('Math') },
        { subject_key: keyOf('Science') },
      ]);
      repo.findByEducator.mockResolvedValue([
        { subject: { id: 's-old' }, section_ids: [], section_slots: [] },
      ]);
      // s-old resolves to the removed Science key.
      repo.subjectKeyParts.mockResolvedValue(
        new Map([
          ...partsFor(['s1']).entries(),
          [
            's-old',
            {
              name: 'Science',
              programType: 'jhs',
              levelName: 'Grade 7',
              courseName: null,
              strandName: null,
            },
          ],
        ]) as any,
      );
      await service.replaceSet('org-1', 'ed-1', ['s1'], 'actor-1');
      expect(repo.deleteGlobalKeys).toHaveBeenCalledWith(
        'org-1',
        'ed-1',
        [keyOf('Science')],
        expect.anything(),
      );
    });

    it('rejects subjects with no program lineage', async () => {
      const { service, repo } = makeService();
      repo.subjectKeyParts.mockResolvedValue(new Map());
      await expect(
        service.replaceSet('org-1', 'ed-1', ['s1'], 'actor-1'),
      ).rejects.toThrow(/school year lineage/);
    });

    it('writes an audit entry', async () => {
      const { service, repo, audit } = makeService();
      repo.subjectKeyParts.mockResolvedValue(partsFor(['s1']));
      await service.replaceSet('org-1', 'ed-1', ['s1'], 'actor-1');
      expect(audit.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'educator_subjects_replaced',
          orgId: 'org-1',
        }),
      );
    });
  });

  describe('listForEducator', () => {
    /** One in-year link (with a ghost section) plus one out-of-year link. */
    const yearLinks = () => [
      {
        section_ids: ['sec-1', 'sec-ghost'],
        section_slots: [
          { sectionId: 'sec-1', slots: [1, 2] },
          { sectionId: 'sec-ghost', slots: [1] },
        ],
        subject: {
          id: 'sub-1',
          name: 'Math',
          program_id: null,
          level_id: 'lvl-to',
          course_id: null,
          strand_id: null,
          program: null,
          level: { name: 'Grade 7', deleted_at: null },
          course: null,
          strand: null,
        },
      },
      {
        section_ids: [],
        section_slots: [],
        subject: {
          id: 'sub-old',
          name: 'Old',
          program_id: null,
          level_id: 'lvl-other',
          course_id: null,
          strand_id: null,
          program: null,
          level: { name: 'Grade 7', deleted_at: null },
          course: null,
          strand: null,
        },
      },
    ];
    const yearDb = () => ({
      program: {
        findMany: jest.fn().mockResolvedValue([{ id: 'prog-1', type: 'jhs' }]),
      },
      level: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'lvl-to', name: 'Grade 7', program_id: 'prog-1' },
        ]),
      },
      course: { findMany: jest.fn().mockResolvedValue([]) },
      strand: { findMany: jest.fn().mockResolvedValue([]) },
      subject: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'sub-1',
            name: 'Math',
            program_id: null,
            level_id: 'lvl-to',
            course_id: null,
            strand_id: null,
          },
        ]),
      },
      section: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'sec-1', name: 'A', level_id: 'lvl-to' },
        ]),
      },
    });

    const MATH_KEY = 'math|jhs|grade 7||';
    const mathKeyRow = () => [
      {
        subject_key: MATH_KEY,
        display_name: 'Math',
        program_type: 'jhs',
        level_name: 'Grade 7',
        course_name: '',
        strand_name: '',
      },
    ];

    it('returns the eligibility view from global keys when no year is given', async () => {
      const { service, repo } = makeService(yearDb());
      repo.findGlobalKeys.mockResolvedValue(mathKeyRow());
      const rows = await service.listForEducator('org-1', 'ed-1');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        id: MATH_KEY,
        name: 'Math',
        sections: [],
      });
    });

    it('scopes rows to the year and resolves sections server-side', async () => {
      const { service, repo } = makeService(yearDb());
      repo.findGlobalKeys.mockResolvedValue(mathKeyRow());
      repo.findByEducator.mockResolvedValue(yearLinks());
      const rows = await service.listForEducator('org-1', 'ed-1', 'year-1');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        id: 'sub-1',
        sectionIds: ['sec-1'],
        sectionSlots: [{ sectionId: 'sec-1', slots: [1, 2] }],
        sections: [
          {
            sectionId: 'sec-1',
            name: 'A',
            levelName: 'Grade 7',
            slots: [1, 2],
          },
        ],
      });
    });

    it('omits unresolvable sections instead of leaking raw ids', async () => {
      const { service, repo } = makeService(yearDb());
      repo.findGlobalKeys.mockResolvedValue(mathKeyRow());
      repo.findByEducator.mockResolvedValue(yearLinks());
      const rows = await service.listForEducator('org-1', 'ed-1', 'year-1');
      expect(JSON.stringify(rows)).not.toContain('sec-ghost');
    });

    it('shows a linked subject with no picks yet as links-only', async () => {
      const { service, repo } = makeService(yearDb());
      repo.findGlobalKeys.mockResolvedValue(mathKeyRow());
      repo.findByEducator.mockResolvedValue([]);
      repo.subjectKeyParts.mockResolvedValue(
        new Map([
          [
            'sub-1',
            {
              name: 'Math',
              programType: 'jhs',
              levelName: 'Grade 7',
              courseName: null,
              strandName: null,
              programId: null,
              levelId: 'lvl-to',
              courseId: null,
              strandId: null,
              deletedAt: null,
            },
          ],
        ]),
      );
      const rows = await service.listForEducator('org-1', 'ed-1', 'year-1');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        id: 'sub-1',
        name: 'Math',
        sectionIds: [],
        sections: [],
      });
    });

    it('hides a linked subject missing from the year without cleanup', async () => {
      const h = makeService(yearDb());
      h.repo.findGlobalKeys.mockResolvedValue(mathKeyRow());
      h.repo.findByEducator.mockResolvedValue(yearLinks());
      // Year 2 owns no programs/levels: Math exists only in year 1, so the
      // global key simply matches nothing — no cleanup, no breakage.
      const db = (h.service as any).db;
      db.program.findMany.mockImplementation((args: any) =>
        args?.where?.school_year_id === 'year-1'
          ? [{ id: 'prog-1', type: 'jhs' }]
          : [],
      );
      db.level.findMany.mockImplementation((args: any) =>
        args?.where?.school_year_id === 'year-1'
          ? [{ id: 'lvl-to', name: 'Grade 7', program_id: 'prog-1' }]
          : [],
      );
      const rows = await h.service.listForEducator('org-1', 'ed-1', 'year-2');
      expect(rows).toHaveLength(0);
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
      // s1's global key: math|jhs|l1|| (linked for every happy-path test).
      h.repo.findGlobalKeys.mockResolvedValue([
        { subject_key: 'math|jhs|l1||' },
      ]);
      h.repo.subjectKeyParts.mockResolvedValue(
        new Map([
          [
            's1',
            {
              name: 'Math',
              programType: 'jhs',
              levelName: 'L1',
              courseName: null,
              strandName: null,
            },
          ],
        ]) as any,
      );
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

  describe('global keys', () => {
    const MATH_KEY = 'math|jhs|l1||';
    /** Two years, same Math (different subject ids), same key. */
    const twoYearDb = () => {
      const byYear = (sy: string) =>
        sy === 'sy-1'
          ? [{ id: 'prog-1', type: 'jhs' }]
          : [{ id: 'prog-2', type: 'jhs' }];
      const levelsByYear = (sy: string) =>
        sy === 'sy-1'
          ? [{ id: 'lvl-1', name: 'L1', program_id: 'prog-1' }]
          : [{ id: 'lvl-2', name: 'L1', program_id: 'prog-2' }];
      return {
        program: {
          findMany: jest.fn().mockImplementation((args: any) =>
            byYear(args?.where?.school_year_id),
          ),
        },
        level: {
          findMany: jest.fn().mockImplementation((args: any) =>
            levelsByYear(args?.where?.school_year_id),
          ),
        },
        course: { findMany: jest.fn().mockResolvedValue([]) },
        strand: { findMany: jest.fn().mockResolvedValue([]) },
        subject: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 's1',
              name: 'Math',
              program_id: null,
              level_id: 'lvl-1',
              course_id: null,
              strand_id: null,
            },
            {
              id: 's2',
              name: 'Math',
              program_id: null,
              level_id: 'lvl-2',
              course_id: null,
              strand_id: null,
            },
          ]),
        },
        section: { findMany: jest.fn().mockResolvedValue([]) },
      };
    };

    it('resolves eligibility in year 2 from a year-1 link via the key', async () => {
      const { service, repo } = makeService(twoYearDb());
      repo.findGlobalKeys.mockResolvedValue([{ subject_key: MATH_KEY }]);
      repo.findByEducator.mockResolvedValue([]);
      repo.subjectKeyParts.mockResolvedValue(
        new Map([
          [
            's2',
            {
              name: 'Math',
              programType: 'jhs',
              levelName: 'L1',
              courseName: null,
              strandName: null,
            },
          ],
        ]) as any,
      );
      const rows = await service.listForEducator('org-1', 'ed-1', 'sy-2');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ id: 's2', name: 'Math' });
    });

    it('hides an archived subject and shows it again after restore', async () => {
      const archived = () => ({
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
        course: { findMany: jest.fn().mockResolvedValue([]) },
        strand: { findMany: jest.fn().mockResolvedValue([]) },
        subject: {
          findMany: jest.fn().mockImplementation((args: any) => archivedSubjects(args)),
        },
        section: { findMany: jest.fn().mockResolvedValue([]) },
      });
      let deleted: Date | null = new Date();
      // The mock emulates the real query's deleted_at filter: archived rows
      // are invisible to the year resolution, restored rows come back.
      const archivedSubjects = (args: any) =>
        [
          {
            id: 's1',
            name: 'Math',
            program_id: null,
            level_id: 'lvl-1',
            course_id: null,
            strand_id: null,
            deleted_at: deleted,
          },
        ].filter((s) =>
          args?.where?.deleted_at === null ? s.deleted_at === null : true,
        );
      const { service, repo } = makeService(archived() as any);
      repo.findGlobalKeys.mockResolvedValue([{ subject_key: MATH_KEY }]);
      repo.findByEducator.mockResolvedValue([]);
      expect(await service.listForEducator('org-1', 'ed-1', 'sy-1')).toHaveLength(0);
      // Restore: the same global key resolves again with no relinking.
      deleted = null;
      expect(await service.listForEducator('org-1', 'ed-1', 'sy-1')).toHaveLength(1);
    });

    it('prunes a key when no live subject carries it anymore', async () => {
      const { service, repo } = makeService();
      repo.subjectKeyParts.mockResolvedValue(
        new Map([
          [
            'other',
            {
              name: 'Science',
              programType: 'jhs',
              levelName: 'L1',
              courseName: null,
              strandName: null,
              deletedAt: null,
            },
          ],
        ]) as any,
      );
      await service.pruneOrphanedSubjectKey({} as any, 'org-1', {
        name: 'Math',
        programType: 'jhs',
        levelName: 'L1',
        courseName: null,
        strandName: null,
      });
      expect(repo.deleteGlobalKeysByKey).toHaveBeenCalledWith(
        'org-1',
        [MATH_KEY],
        expect.anything(),
      );
    });

    it('keeps the key when another live subject still carries it', async () => {
      const { service, repo } = makeService();
      repo.subjectKeyParts.mockResolvedValue(
        new Map([
          [
            's2',
            {
              name: 'Math',
              programType: 'jhs',
              levelName: 'L1',
              courseName: null,
              strandName: null,
              deletedAt: null,
            },
          ],
        ]) as any,
      );
      await service.pruneOrphanedSubjectKey({} as any, 'org-1', {
        name: 'Math',
        programType: 'jhs',
        levelName: 'L1',
        courseName: null,
        strandName: null,
      });
      expect(repo.deleteGlobalKeysByKey).not.toHaveBeenCalled();
    });

    it('resolves generator eligibility for a year-2 subject via the key', async () => {
      // Real repository over a mocked db: s2 (year 2) shares year-1 Math's
      // key, and ed-9 holds that key — eligibility must follow the key.
      const db: any = {
        subject: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 's2',
              name: 'Math',
              program_id: null,
              level_id: 'lvl-2',
              course_id: null,
              strand_id: null,
              deleted_at: null,
            },
          ]),
        },
        level: {
          findMany: jest
            .fn()
            .mockResolvedValue([
              { id: 'lvl-2', name: 'L1', program_id: 'prog-2' },
            ]),
        },
        course: { findMany: jest.fn().mockResolvedValue([]) },
        strand: { findMany: jest.fn().mockResolvedValue([]) },
        program: {
          findMany: jest.fn().mockResolvedValue([{ id: 'prog-2', type: 'jhs' }]),
        },
        educatorTeachableSubject: {
          findMany: jest.fn().mockResolvedValue([
            { subject_key: MATH_KEY, educator_id: 'ed-9' },
          ]),
        },
      };
      const repo = new EducatorSubjectRepository(db);
      const eligible = await repo.getEligibleEducatorsBySubject('org-1', [
        's2',
      ]);
      expect(eligible.get('s2')).toEqual(['ed-9']);
      expect(
        db.educatorTeachableSubject.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            subject_key: { in: [MATH_KEY] },
          }),
        }),
      );
    });
  });
});
