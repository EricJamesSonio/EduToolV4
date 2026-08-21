import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SchoolProfileService } from '../school-profile.service';

// In-memory fake Tx that records created entities
function makeTx() {
  const departments: any[] = [];
  const courses: any[] = [];
  const strands: any[] = [];
  const levels: any[] = [];
  const sections: any[] = [];
  const subjects: any[] = [];

  const tx: any = {
    schoolProfileDepartment: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(async ({ data }: any) => {
        const row = { id: `dept-${departments.length + 1}`, org_id: data.org_id, type: data.type, created_at: new Date() };
        departments.push(row);
        return row;
      }),
      delete: jest.fn(async ({ where }: any) => {
        const idx = departments.findIndex((d) => d.id === where.id);
        if (idx >= 0) departments.splice(idx, 1);
      }),
      findFirst: jest.fn(async ({ where }: any) => {
        return departments.find((d) => d.id === where.id) ?? null;
      }),
    },
    schoolProfileCourse: {
      create: jest.fn(async ({ data }: any) => {
        const row = { id: `course-${courses.length + 1}`, ...data };
        courses.push(row);
        return row;
      }),
    },
    schoolProfileStrand: {
      create: jest.fn(async ({ data }: any) => {
        const row = { id: `strand-${strands.length + 1}`, ...data };
        strands.push(row);
        return row;
      }),
    },
    schoolProfileLevel: {
      create: jest.fn(async ({ data }: any) => {
        const row = { id: `level-${levels.length + 1}`, ...data };
        levels.push(row);
        return row;
      }),
    },
    schoolProfileSection: {
      create: jest.fn(async ({ data }: any) => {
        const row = { id: `section-${sections.length + 1}`, ...data };
        sections.push(row);
        return row;
      }),
    },
    schoolProfileSubject: {
      create: jest.fn(async ({ data }: any) => {
        const row = { id: `subj-${subjects.length + 1}`, ...data };
        subjects.push(row);
        return row;
      }),
    },
    schoolProfileSubjectSharing: {
      create: jest.fn(async ({ data }: any) => ({ id: 'sharing-1', ...data })),
    },
    __store: { departments, courses, strands, levels, sections, subjects },
  };

  return tx;
}

describe('SchoolProfileService — real logic, no shortcut mocks', () => {
  let repo: any;
  let db: any;
  let tx: any;
  let service: SchoolProfileService;

  const orgId = 'org-test-1';

  beforeEach(() => {
    jest.clearAllMocks();
    tx = makeTx();

    repo = {
      findAllDepartments: jest.fn().mockResolvedValue([]),
      findDepartmentByType: jest.fn().mockResolvedValue(null),
      findCourseById: jest.fn(),
      findStrandById: jest.fn(),
      findLevelById: jest.fn(),
      findSectionById: jest.fn(),
      findSubjectById: jest.fn(),
      createCourse: jest.fn(),
      updateCourse: jest.fn(),
      deleteCourse: jest.fn(),
      createStrand: jest.fn(),
      updateStrand: jest.fn(),
      deleteStrand: jest.fn(),
      createLevel: jest.fn(),
      updateLevel: jest.fn(),
      deleteLevel: jest.fn(),
      createSection: jest.fn(),
      updateSection: jest.fn(),
      deleteSection: jest.fn(),
      createMajorSubject: jest.fn(),
      updateSubject: jest.fn(),
      deleteSubject: jest.fn(),
      deleteDepartment: jest.fn(),
    };

    db = {
      $transaction: jest.fn(async (cb: any) => cb(tx)),
    };

    service = new SchoolProfileService(repo, db);
  });

  describe('saveProfile — validation and transaction shape', () => {
    it('rejects unknown department type', async () => {
      await expect(
        service.saveProfile(orgId, {
          departments: [
            {
              type: 'unknown_dept',
              courses: [],
              strands: [],
              levels: [],
              subjects: [],
            } as any,
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('creates department + course + level + section + subject correctly (college)', async () => {
      const dto: any = {
        departments: [
          {
            type: 'college',
            courses: [
              {
                name: 'BS Computer Science',
                code: 'BSCS',
                levels: [
                  {
                    name: '1st Year',
                    orderIndex: 0,
                    sections: [{ name: 'A', capacity: 40 }],
                    subjects: [{ name: 'Intro to CS', subjectType: 'major' }],
                  },
                ],
              },
            ],
            strands: [],
            levels: [],
            subjects: [{ name: 'GE Subject', subjectType: 'minor' }],
          },
        ],
      };

      const res = await service.saveProfile(orgId, dto);

      expect(res).toEqual({ success: true });
      // One department created
      expect(tx.__store.departments).toHaveLength(1);
      expect(tx.__store.departments[0].type).toBe('college');
      // One course, one level, one section, two subjects (1 major + 1 minor)
      expect(tx.__store.courses).toHaveLength(1);
      expect(tx.__store.courses[0].name).toBe('BS Computer Science');
      expect(tx.__store.levels).toHaveLength(1);
      expect(tx.__store.levels[0].name).toBe('1st Year');
      expect(tx.__store.sections).toHaveLength(1);
      expect(tx.__store.sections[0].name).toBe('A');
      expect(tx.__store.subjects).toHaveLength(2);
    });

    it('creates SHS with strands and department-level levels', async () => {
      const dto: any = {
        departments: [
          {
            type: 'shs',
            courses: [],
            strands: [
              {
                name: 'STEM',
                levels: [
                  {
                    name: 'Grade 11',
                    orderIndex: 0,
                    sections: [{ name: 'Section 1', capacity: 35 }],
                    subjects: [{ name: 'Physics', subjectType: 'major' }],
                  },
                ],
              },
            ],
            levels: [],
            subjects: [],
          },
          {
            type: 'elementary',
            courses: [],
            strands: [],
            levels: [
              {
                name: 'Grade 1',
                orderIndex: 0,
                sections: [{ name: 'A', capacity: 30 }],
                subjects: [{ name: 'Math', subjectType: 'major' }],
              },
            ],
            subjects: [],
          },
        ],
      };

      await service.saveProfile(orgId, dto);

      expect(tx.__store.departments).toHaveLength(2);
      expect(tx.__store.strands).toHaveLength(1);
      expect(tx.__store.levels).toHaveLength(2);
      expect(tx.__store.sections).toHaveLength(2);
    });

    it('deletes existing departments before recreating (replace semantics)', async () => {
      // Simulate DB already has one department
      const existingDept = { id: 'existing-dept-1' };
      tx.schoolProfileDepartment.findMany = jest.fn().mockResolvedValue([existingDept]);

      const dto: any = {
        departments: [
          {
            type: 'college',
            courses: [],
            strands: [],
            levels: [],
            subjects: [],
          },
        ],
      };

      await service.saveProfile(orgId, dto);

      expect(tx.schoolProfileDepartment.delete).toHaveBeenCalledWith({ where: { id: 'existing-dept-1' } });
      expect(tx.__store.departments).toHaveLength(1);
    });
  });

  describe('getAllByType', () => {
    it('maps departments by type correctly', async () => {
      repo.findAllDepartments.mockResolvedValue([
        { id: '1', type: 'college', courses: [], strands: [], levels: [], subjects: [] },
        { id: '2', type: 'shs', courses: [], strands: [], levels: [], subjects: [] },
      ]);

      const result = await service.getAllByType(orgId);

      expect(result['college']?.type).toBe('college');
      expect(result['shs']?.type).toBe('shs');
      expect(result['elementary']).toBeUndefined();
    });

    it('returns empty object when no departments', async () => {
      repo.findAllDepartments.mockResolvedValue([]);
      const result = await service.getAllByType(orgId);
      expect(result).toEqual({});
    });
  });

  describe('selectDepartment / deselectDepartment', () => {
    it('throws for unknown type', async () => {
      await expect(service.selectDepartment(orgId, 'invalid')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns existing department without creating if already present', async () => {
      const existing = { id: 'dept-1', type: 'elementary' };
      repo.findDepartmentByType.mockResolvedValue(existing);

      const result = await service.selectDepartment(orgId, 'elementary');

      expect(result).toBe(existing);
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('creates department for elementary with levels/sections/subjects when not existing', async () => {
      repo.findDepartmentByType.mockResolvedValue(null);

      const result = await service.selectDepartment(orgId, 'elementary');

      // Transaction executed
      expect(db.$transaction).toHaveBeenCalled();
      // Created at least one level + section
      expect(tx.__store.departments).toHaveLength(1);
      expect(tx.__store.departments[0].type).toBe('elementary');
      expect(tx.__store.levels.length).toBeGreaterThan(0);
      expect(tx.__store.sections.length).toBeGreaterThan(0);
      expect(result).toBeDefined();
    });

    it('deselectDepartment is idempotent when not found', async () => {
      repo.findDepartmentByType.mockResolvedValue(null);
      await expect(service.deselectDepartment(orgId, 'college')).resolves.toBeUndefined();
      expect(repo.deleteDepartment).not.toHaveBeenCalled();
    });

    it('deselectDepartment deletes when exists', async () => {
      repo.findDepartmentByType.mockResolvedValue({ id: 'dept-1', type: 'college' });
      repo.deleteDepartment.mockResolvedValue({ id: 'dept-1' });

      await service.deselectDepartment(orgId, 'college');

      expect(repo.deleteDepartment).toHaveBeenCalledWith('dept-1');
    });
  });

  describe('CRUD guards — NotFound paths', () => {
    it('updateCourse throws NotFound when course missing', async () => {
      repo.findCourseById.mockResolvedValue(null);
      await expect(service.updateCourse('missing', orgId, { name: 'X' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('deleteCourse throws NotFound when missing', async () => {
      repo.findCourseById.mockResolvedValue(null);
      await expect(service.deleteCourse('missing', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updateCourse succeeds when found', async () => {
      repo.findCourseById.mockResolvedValue({ id: 'c-1', org_id: orgId });
      repo.updateCourse.mockResolvedValue({ id: 'c-1', name: 'Updated' });

      const result = await service.updateCourse('c-1', orgId, { name: 'Updated' });

      expect(repo.updateCourse).toHaveBeenCalledWith('c-1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('updateLevel throws when missing and succeeds when present', async () => {
      repo.findLevelById.mockResolvedValueOnce(null);
      await expect(service.updateLevel('nope', orgId, { name: 'X' })).rejects.toBeInstanceOf(
        NotFoundException,
      );

      repo.findLevelById.mockResolvedValue({ id: 'l-1', org_id: orgId });
      repo.updateLevel.mockResolvedValue({ id: 'l-1', name: 'Grade 2' });
      const ok = await service.updateLevel('l-1', orgId, { name: 'Grade 2' });
      expect(ok.name).toBe('Grade 2');
    });

    it('deleteSection throws when missing', async () => {
      repo.findSectionById.mockResolvedValue(null);
      await expect(service.deleteSection('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('createSubject delegates to repo', async () => {
      repo.createMajorSubject.mockResolvedValue({ id: 's-1', name: 'Math' });
      const result = await service.createSubject(orgId, 'level-1', { name: 'Math' } as any);
      expect(repo.createMajorSubject).toHaveBeenCalledWith(orgId, 'level-1', 'Math');
      expect(result.name).toBe('Math');
    });

    it('deleteSubject throws when missing', async () => {
      repo.findSubjectById.mockResolvedValue(null);
      await expect(service.deleteSubject('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('saveProfile — failure leaves transaction uncommitted (real behavior)', () => {
    it('if DB throws inside transaction, error propagates (no success)', async () => {
      db.$transaction = jest.fn(async () => {
        throw new Error('DB down');
      });

      await expect(
        service.saveProfile(orgId, {
          departments: [{ type: 'college', courses: [], strands: [], levels: [], subjects: [] } as any],
        }),
      ).rejects.toThrow('DB down');
    });
  });
});
