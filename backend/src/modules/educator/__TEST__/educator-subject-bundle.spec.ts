import { EducatorSubjectService } from '../educator-subject.service';
import { EducatorSubjectRepository } from '../educator-subject.repository';
import type { DatabaseService } from '@/core/database/database.provider';

/**
 * Bundle parity spec (TICK-EDUCATOR-002, condition 4): the bundle endpoint
 * must enforce the UNION of the link-path and slot-path validations, and
 * any failure must leave the link table untouched.
 */

type Assignment = {
  subjectId: string;
  sections: Array<{ sectionId: string; slots: number[] }>;
};

const sectionsDb = () =>
  new Map([
    ['sec-1', { levelId: 'lvl-1', name: 'Section 1' }],
    ['sec-2', { levelId: 'lvl-1', name: 'Section 2' }],
    ['sec-other', { levelId: 'lvl-2', name: 'Section X' }],
  ]);

// s1: 2 sessions/week x 60m = 120m per section. s-big: 7 x 120m = 840m.
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
    [
      's-big',
      {
        levelId: 'lvl-1',
        name: 'Marathon',
        programType: 'jhs',
        sessionsPerWeek: 7,
        sessionMinutes: 120,
      },
    ],
  ]);

const yearSubjectRows = (ids: string[] = ['s1', 's-big']) =>
  ids.map((id) => ({
    id,
    name: id,
    program_id: 'prog-1',
    level_id: 'lvl-1',
    course_id: null,
    strand_id: null,
  }));

const makeBundleService = (opts: {
  links?: Array<{ subject: { id: string }; section_slots?: unknown }>;
  linksSequence?: Array<Array<{ subject: { id: string }; section_slots?: unknown }>>;
  holder?: { educatorId: string; educatorName: string | null } | null;
  holderSequence?: Array<{ educatorId: string; educatorName: string | null } | null>;
  weekdays?: number[];
  assertSubjectsInOrg?: (orgId: string, ids: string[]) => Promise<void>;
  yearIds?: string[];
} = {}) => {
  const tx = {
    $queryRawUnsafe: jest.fn().mockResolvedValue([{ ok: 1 }]),
    educatorSubject: {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  const repo = {
    assertEducator: jest.fn().mockResolvedValue(undefined),
    assertSubjectsInOrg: jest.fn().mockResolvedValue(undefined),
    replaceSet: jest.fn().mockResolvedValue(2),
    setSlots: jest.fn().mockResolvedValue(undefined),
    replaceAllWithSlots: jest.fn().mockResolvedValue(undefined),
    acquireBundleLocks: jest.fn().mockResolvedValue(undefined),
    findByEducator:
      opts.linksSequence !== undefined
        ? jest
            .fn()
            .mockResolvedValueOnce(opts.linksSequence[0] ?? [])
            .mockResolvedValue(opts.linksSequence[1] ?? [])
        : jest.fn().mockResolvedValue(opts.links ?? []),
    findSubjectIds: jest.fn().mockResolvedValue([]),
    findSectionHolder:
      opts.holderSequence !== undefined
        ? jest
            .fn()
            .mockResolvedValueOnce(opts.holderSequence[0] ?? null)
            .mockResolvedValue(opts.holderSequence[1] ?? null)
        : jest.fn().mockResolvedValue(opts.holder ?? null),
    sectionsWithLevels: jest.fn().mockResolvedValue(sectionsDb()),
    subjectLevels: jest.fn().mockResolvedValue(levelsDb()),
  };
  if (opts.assertSubjectsInOrg) {
    repo.assertSubjectsInOrg.mockImplementation(opts.assertSubjectsInOrg);
  }
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
    get: jest
      .fn()
      .mockResolvedValue({ effectiveWeekdays: opts.weekdays ?? [1, 2, 3, 4, 5] }),
  };
  const occupancy = { load: jest.fn().mockResolvedValue([]) };
  const db: any = {
    $transaction: jest.fn(async (cb: any) => cb(tx)),
    program: {
      findMany: jest.fn().mockResolvedValue([{ id: 'prog-1', type: 'jhs' }]),
    },
    level: {
      findMany: jest
        .fn()
        .mockResolvedValue([{ id: 'lvl-1', name: 'Grade 7', program_id: 'prog-1' }]),
    },
    course: { findMany: jest.fn().mockResolvedValue([]) },
    strand: { findMany: jest.fn().mockResolvedValue([]) },
    subject: {
      findMany: jest.fn().mockResolvedValue(yearSubjectRows(opts.yearIds)),
    },
  };
  const service = new EducatorSubjectService(
    repo as any,
    db as unknown as DatabaseService,
    audit as any,
    cfg as any,
    profiles as any,
    occupancy as any,
  );
  return { service, repo, audit, db, tx };
};

const s1Pick: Assignment[] = [
  { subjectId: 's1', sections: [{ sectionId: 'sec-1', slots: [1, 2] }] },
];

const run = (
  service: EducatorSubjectService,
  subjectIds: string[] = ['s1'],
  assignments: Assignment[] = s1Pick,
) => service.setBundle('org-1', 'ed-1', 'sy-1', subjectIds, assignments, 'actor-1');

describe('setBundle', () => {
  it('writes links and slots atomically and audits once', async () => {
    const { service, repo, audit, db } = makeBundleService();
    const out = await run(service);
    expect(out).toEqual({ count: 1, updated: 1, pickedMin: 120 });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(repo.replaceAllWithSlots).toHaveBeenCalledTimes(1);
    // Locks precede the atomic write (both repo-level, in call order).
    const lockOrder =
      repo.acquireBundleLocks.mock.invocationCallOrder[0] ?? 0;
    const writeOrder =
      repo.replaceAllWithSlots.mock.invocationCallOrder[0] ?? 0;
    expect(lockOrder).toBeGreaterThan(0);
    expect(writeOrder).toBeGreaterThan(lockOrder);
    expect(repo.acquireBundleLocks).toHaveBeenCalledWith(
      expect.anything(),
      'ed-1',
      [{ subjectId: 's1', sectionId: 'sec-1' }],
    );
    expect(audit.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'educator_subject_bundle_set' }),
    );
    // Old endpoints untouched by the bundle path.
    expect(repo.replaceSet).not.toHaveBeenCalled();
    expect(repo.setSlots).not.toHaveBeenCalled();
  });

  it('accepts links-only bundles (parity with replaceSet)', async () => {
    const { service, repo } = makeBundleService();
    const out = await run(service, ['s1'], []);
    expect(out).toEqual({ count: 1, updated: 0, pickedMin: 0 });
    expect(repo.replaceAllWithSlots).toHaveBeenCalledTimes(1);
  });

  it('rejects assignments for unlisted subjects (tick-first rule)', async () => {
    const { service, repo, db } = makeBundleService();
    await expect(
      run(service, ['s1'], [
        { subjectId: 's-other', sections: [{ sectionId: 'sec-1', slots: [1] }] },
      ]),
    ).rejects.toThrow(/before assigning slots/);
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(repo.replaceAllWithSlots).not.toHaveBeenCalled();
  });

  it('rejects cross-org subjects (link-path org check)', async () => {
    const { service, repo, db } = makeBundleService({
      assertSubjectsInOrg: async () => {
        throw new Error('Subject does not belong to this organization.');
      },
    });
    await expect(run(service, ['s-evil'], [])).rejects.toThrow(
      /this organization/,
    );
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(repo.replaceAllWithSlots).not.toHaveBeenCalled();
  });

  it('rejects missing sections (404)', async () => {
    const { service, repo, db } = makeBundleService();
    repo.sectionsWithLevels.mockResolvedValue(new Map());
    await expect(
      run(service, ['s1'], [
        { subjectId: 's1', sections: [{ sectionId: 'sec-gone', slots: [1] }] },
      ]),
    ).rejects.toThrow(/do not exist in this organization/);
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(repo.replaceAllWithSlots).not.toHaveBeenCalled();
  });

  it('rejects subjects outside the school year', async () => {
    const { service, db, repo } = makeBundleService({ yearIds: ['s-other'] });
    await expect(run(service)).rejects.toThrow(/school year/);
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(repo.replaceAllWithSlots).not.toHaveBeenCalled();
  });

  it('rejects sections outside the subject level', async () => {
    const { service, db, repo } = makeBundleService();
    await expect(
      run(service, ['s1'], [
        { subjectId: 's1', sections: [{ sectionId: 'sec-other', slots: [1] }] },
      ]),
    ).rejects.toThrow(/does not belong to the level/);
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(repo.replaceAllWithSlots).not.toHaveBeenCalled();
  });

  it('rejects slot positions beyond the weekly count', async () => {
    const { service, db, repo } = makeBundleService();
    await expect(
      run(service, ['s1'], [
        { subjectId: 's1', sections: [{ sectionId: 'sec-1', slots: [9] }] },
      ]),
    ).rejects.toThrow(/does not exist/);
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(repo.replaceAllWithSlots).not.toHaveBeenCalled();
  });

  it('rejects pairs held by another educator (409)', async () => {
    const { service, db, repo } = makeBundleService({
      holder: { educatorId: 'ed-2', educatorName: 'Bob' },
    });
    await expect(run(service)).rejects.toThrow(/already assigned to Bob/);
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(repo.replaceAllWithSlots).not.toHaveBeenCalled();
  });

  it('rejects over-capacity bundles with numbers', async () => {
    // Saturday-only educator: 1 x 540m capacity; s-big alone needs 840m.
    // The pre-check computes over-capacity, so the bundle re-checks inside
    // the transaction and aborts before any write.
    const { service, db, repo, tx } = makeBundleService({ weekdays: [6] });
    await expect(
      run(service, ['s-big'], [
        {
          subjectId: 's-big',
          sections: [{ sectionId: 'sec-1', slots: [1, 2, 3, 4, 5, 6, 7] }],
        },
      ]),
    ).rejects.toThrow(/Over capacity/);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.educatorSubject.deleteMany).not.toHaveBeenCalled();
    expect(tx.educatorSubject.createMany).not.toHaveBeenCalled();
    expect(repo.replaceAllWithSlots).not.toHaveBeenCalled();
  });

  it('aborts inside the transaction when a holder appears after the pre-check', async () => {
    const { service, repo, tx } = makeBundleService({
      holderSequence: [null, { educatorId: 'ed-2', educatorName: 'Bob' }],
    });
    await expect(run(service)).rejects.toThrow(/already assigned to Bob/);
    expect(tx.educatorSubject.deleteMany).not.toHaveBeenCalled();
    expect(tx.educatorSubject.createMany).not.toHaveBeenCalled();
    expect(repo.replaceAllWithSlots).not.toHaveBeenCalled();
  });

  it('re-checks capacity on fresh in-transaction links', async () => {
    // Pre-check sees no other picks (120m fits Saturday's 540m). Inside the
    // txn an 840m link for another subject appears -> must abort.
    const { service, tx } = makeBundleService({
      weekdays: [6],
      linksSequence: [
        [],
        [
          {
            subject: { id: 's-big' },
            section_slots: [{ sectionId: 'sec-2', slots: [1, 2, 3, 4, 5, 6, 7] }],
          },
        ],
      ],
    });
    await expect(run(service)).rejects.toThrow(/Over capacity/);
    expect(tx.educatorSubject.deleteMany).not.toHaveBeenCalled();
    expect(tx.educatorSubject.createMany).not.toHaveBeenCalled();
  });
});

describe('acquireBundleLocks', () => {
  it('takes the educator lock first, then one ordered lock per pair', async () => {
    const calls: Array<{ sql: string; key: string }> = [];
    const tx: any = {
      $executeRawUnsafe: jest.fn(async (sql: string, key: string) => {
        calls.push({ sql, key });
        return 1;
      }),
    };
    const repo = new EducatorSubjectRepository({} as any);
    await repo.acquireBundleLocks(tx, 'ed-1', [
      { subjectId: 's2', sectionId: 'sec-9' },
      { subjectId: 's1', sectionId: 'sec-1' },
    ]);
    expect(calls.map((c) => c.key)).toEqual([
      'educ-bundle:ed-1',
      'educ-pair:s1:sec-1',
      'educ-pair:s2:sec-9',
    ]);
    for (const c of calls) {
      expect(c.sql).toContain('pg_advisory_xact_lock');
    }
  });
});

