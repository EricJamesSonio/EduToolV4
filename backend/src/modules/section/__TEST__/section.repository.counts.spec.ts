import { SectionRepository } from '../section.repository';

// Section occupancy is derived from StudentProgramEnrollment (the source of
// truth for assignment), never from Profile.metadata.sectionId, which older
// flows write and section reassignment never clears. These tests pin the
// counting rules so the section list/detail counts cannot drift away from the
// Students tab roster again.

type FakeDb = {
  section: { findMany: jest.Mock };
  studentProgramEnrollment: { findMany: jest.Mock };
  profile: { findMany: jest.Mock };
  studentSchoolYear: { findMany: jest.Mock };
  account: { findMany: jest.Mock };
};

const ORG = 'org-1';
const SY = 'sy-1';
const SECTION = 'sec-1';

const makeRepo = (overrides: Partial<Record<keyof FakeDb, object>> = {}) => {
  const db: FakeDb = {
    section: {
      findMany: jest
        .fn()
        .mockResolvedValue([{ id: SECTION, school_year_id: SY }]),
      ...overrides.section,
    },
    studentProgramEnrollment: {
      findMany: jest.fn().mockResolvedValue([]),
      ...overrides.studentProgramEnrollment,
    },
    profile: {
      findMany: jest.fn().mockResolvedValue([]),
      ...overrides.profile,
    },
    studentSchoolYear: {
      findMany: jest.fn().mockResolvedValue([]),
      ...overrides.studentSchoolYear,
    },
    account: {
      findMany: jest.fn().mockResolvedValue([]),
      ...overrides.account,
    },
  };
  return { repo: new SectionRepository(db as never), db };
};

const enrollment = (studentId: string, sectionId = SECTION) => ({
  section_id: sectionId,
  studentSchoolYear: { student_id: studentId },
});

describe('SectionRepository.countStudentsInSection — enrollment-based counting', () => {
  it('counts active enrollments scoped to the section school year and org', async () => {
    const { repo, db } = makeRepo({
      studentProgramEnrollment: {
        findMany: jest
          .fn()
          .mockResolvedValue([enrollment('stu-1'), enrollment('stu-2')]),
      },
      account: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'stu-1' }, { id: 'stu-2' }]),
      },
    });

    await expect(repo.countStudentsInSection(ORG, SECTION)).resolves.toBe(2);

    expect(db.studentProgramEnrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          org_id: ORG,
          section_id: { in: [SECTION] },
          status: 'active',
          studentSchoolYear: expect.objectContaining({
            org_id: ORG,
            school_year_id: { in: [SY] },
            status: { not: 'unenrolled' },
          }),
        }),
      }),
    );
    expect(db.account.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ['stu-1', 'stu-2'] },
          org_id: ORG,
          role: 'student',
          deleted_at: null,
        }),
      }),
    );
  });

  it('does not count a student whose account is soft-deleted', async () => {
    const { repo, db } = makeRepo({
      studentProgramEnrollment: {
        findMany: jest
          .fn()
          .mockResolvedValue([enrollment('stu-1'), enrollment('stu-2')]),
      },
      account: { findMany: jest.fn().mockResolvedValue([{ id: 'stu-1' }]) },
    });

    await expect(repo.countStudentsInSection(ORG, SECTION)).resolves.toBe(1);
  });

  it('counts each student once even with several enrollment rows', async () => {
    const { repo, db } = makeRepo({
      studentProgramEnrollment: {
        findMany: jest
          .fn()
          .mockResolvedValue([enrollment('stu-1'), enrollment('stu-1')]),
      },
      account: { findMany: jest.fn().mockResolvedValue([{ id: 'stu-1' }]) },
    });

    await expect(repo.countStudentsInSection(ORG, SECTION)).resolves.toBe(1);
    expect(db.account.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { in: ['stu-1'] } }),
      }),
    );
  });

  it('returns 0 for a section the org does not own without extra queries', async () => {
    const { repo, db } = makeRepo({
      section: { findMany: jest.fn().mockResolvedValue([]) },
    });

    await expect(
      repo.countStudentsInSection(ORG, 'sec-other'),
    ).resolves.toBe(0);
    expect(db.studentProgramEnrollment.findMany).not.toHaveBeenCalled();
    expect(db.profile.findMany).not.toHaveBeenCalled();
  });

  it('hasStudents mirrors the count', async () => {
    const withStudent = makeRepo({
      studentProgramEnrollment: {
        findMany: jest.fn().mockResolvedValue([enrollment('stu-1')]),
      },
      account: { findMany: jest.fn().mockResolvedValue([{ id: 'stu-1' }]) },
    });
    const empty = makeRepo();

    await expect(withStudent.repo.hasStudents(ORG, SECTION)).resolves.toBe(
      true,
    );
    await expect(empty.repo.hasStudents(ORG, SECTION)).resolves.toBe(false);
  });
});

describe('SectionRepository.countStudentsInSection — legacy metadata guard', () => {
  it('ignores legacy Profile.metadata.sectionId rows outside the school year', async () => {
    const { repo, db } = makeRepo({
      profile: {
        findMany: jest.fn().mockResolvedValue([
          { account_id: 'stu-9', metadata: { sectionId: SECTION } },
        ]),
      },
      studentSchoolYear: { findMany: jest.fn().mockResolvedValue([]) },
    });

    await expect(repo.countStudentsInSection(ORG, SECTION)).resolves.toBe(0);
    expect(db.account.findMany).not.toHaveBeenCalled();
  });

  it('still counts a legacy student enrolled in the section school year', async () => {
    const { repo, db } = makeRepo({
      profile: {
        findMany: jest.fn().mockResolvedValue([
          { account_id: 'stu-9', metadata: { sectionId: SECTION } },
        ]),
      },
      studentSchoolYear: {
        findMany: jest.fn().mockResolvedValue([
          { student_id: 'stu-9', school_year_id: SY },
        ]),
      },
      account: { findMany: jest.fn().mockResolvedValue([{ id: 'stu-9' }]) },
    });

    await expect(repo.countStudentsInSection(ORG, SECTION)).resolves.toBe(1);
    expect(db.studentSchoolYear.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          org_id: ORG,
          student_id: { in: ['stu-9'] },
          school_year_id: { in: [SY] },
          status: { not: 'unenrolled' },
        }),
      }),
    );
  });

  it('does not double count a student matched by both sources', async () => {
    const { repo } = makeRepo({
      studentProgramEnrollment: {
        findMany: jest.fn().mockResolvedValue([enrollment('stu-9')]),
      },
      profile: {
        findMany: jest.fn().mockResolvedValue([
          { account_id: 'stu-9', metadata: { sectionId: SECTION } },
        ]),
      },
      studentSchoolYear: {
        findMany: jest.fn().mockResolvedValue([
          { student_id: 'stu-9', school_year_id: SY },
        ]),
      },
      account: { findMany: jest.fn().mockResolvedValue([{ id: 'stu-9' }]) },
    });

    await expect(repo.countStudentsInSection(ORG, SECTION)).resolves.toBe(1);
  });
});


describe('SectionRepository.countStudentsInSections — batching', () => {
  it('resolves every section with one section lookup (no N+1)', async () => {
    const db = {
      section: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'sec-1', school_year_id: SY },
          { id: 'sec-2', school_year_id: SY },
        ]),
      },
      studentProgramEnrollment: {
        findMany: jest.fn().mockResolvedValue([
          enrollment('stu-1', 'sec-1'),
          enrollment('stu-2', 'sec-1'),
        ]),
      },
      profile: { findMany: jest.fn().mockResolvedValue([]) },
      studentSchoolYear: { findMany: jest.fn().mockResolvedValue([]) },
      account: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'stu-1' }, { id: 'stu-2' }]),
      },
    };
    const repo = new SectionRepository(db as never);

    const counts = await repo.countStudentsInSections('org-1', [
      'sec-1',
      'sec-2',
      'sec-1',
    ]);

    expect(counts.get('sec-1')).toBe(2);
    expect(counts.get('sec-2')).toBe(0);
    expect(db.section.findMany).toHaveBeenCalledTimes(1);
    expect(db.studentProgramEnrollment.findMany).toHaveBeenCalledTimes(1);
    expect(db.studentProgramEnrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          section_id: { in: ['sec-1', 'sec-2'] },
        }),
      }),
    );
  });

  it('returns an empty map for an empty id list without hitting the db', async () => {
    const { repo, db } = makeRepo();

    await expect(
      repo.countStudentsInSections('org-1', []),
    ).resolves.toEqual(new Map());
    expect(db.section.findMany).not.toHaveBeenCalled();
  });
});

describe('SectionRepository.findAll — studentCount source', () => {
  it('derives studentCount from enrollment rows, not profile metadata', async () => {
    const db = {
      section: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: SECTION, school_year_id: SY, name: 'A' }]),
        count: jest.fn().mockResolvedValue(1),
      },
      studentProgramEnrollment: {
        findMany: jest.fn().mockResolvedValue([enrollment('stu-1')]),
      },
      profile: { findMany: jest.fn().mockResolvedValue([]) },
      studentSchoolYear: { findMany: jest.fn().mockResolvedValue([]) },
      account: { findMany: jest.fn().mockResolvedValue([{ id: 'stu-1' }]) },
    };
    const repo = new SectionRepository(db as never);

    const result = await repo.findAll(ORG, { schoolYearId: SY });

    expect(result.data[0].studentCount).toBe(1);
    // one findMany for the page itself, one for the count resolution
    expect(db.section.findMany).toHaveBeenCalledTimes(2);
  });
});

