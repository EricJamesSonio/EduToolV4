import { NotFoundException } from '@nestjs/common';
import { LevelService } from '../level.service';

describe('LevelService', () => {
  let service: LevelService;
  let repo: any;
  let db: any;
  const orgId = 'org-1';
  const programId = 'prog-1';
  const schoolYearId = 'sy-1';

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findBySchoolYear: jest.fn(),
      findByCourseAndSchoolYear: jest.fn(),
      findByStrandAndSchoolYear: jest.fn(),
      findByProgramAndSchoolYear: jest.fn(),
      seedFromDefaults: jest.fn(),
      findById: jest.fn(),
      findByIdIncludingArchived: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      deleteByProgramAndSchoolYear: jest.fn(),
      bulkCreate: jest.fn(),
    };
    db = {
      program: { findFirst: jest.fn() },
      studentProgramEnrollment: { count: jest.fn() },
      enrollmentApplication: { count: jest.fn() },
      class: { count: jest.fn() },
      $transaction: jest.fn(async (cb) => {
        if (Array.isArray(cb)) return Promise.all(cb);
        const tx: any = {
          subjectPrerequisite: { deleteMany: jest.fn().mockResolvedValue({}) },
          subjectSharing: { deleteMany: jest.fn().mockResolvedValue({}) },
          subject: { deleteMany: jest.fn().mockResolvedValue({}) },
          section: { deleteMany: jest.fn().mockResolvedValue({}) },
          level: { delete: jest.fn().mockResolvedValue({ id: 'deleted' }) },
        };
        return cb(tx);
      }),
    };
    db.level = { findMany: jest.fn(), update: jest.fn(), delete: jest.fn(), deleteMany: jest.fn(), findFirst: jest.fn(), count: jest.fn() };
    db.section = { findMany: jest.fn(), deleteMany: jest.fn(), updateMany: jest.fn() };
    db.subject = { findMany: jest.fn(), deleteMany: jest.fn() };
    db.subjectPrerequisite = { deleteMany: jest.fn() };
    db.subjectSharing = { deleteMany: jest.fn(), count: jest.fn() };
    db.course = { findFirst: jest.fn() };
    db.strand = { findFirst: jest.fn() };
    service = new LevelService(repo, db);
    jest.clearAllMocks();
  });

  describe('getDefaults / updateDefaults', () => {
    it('getDefaults delegates to db', async () => {
      db.level.findMany.mockResolvedValue([{ id: '1' }]);
      expect(await service.getDefaults(orgId)).toEqual([{ id: '1' }]);
      expect(db.level.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { org_id: orgId, deleted_at: null } }));
    });
    it('updateDefaults filters to ids and transactional updates', async () => {
      const dto: any = { levels: [{ id: '1', name: 'New' }, { name: 'NoId' }, { id: '2', name: 'Second' }] };
      db.level.update.mockResolvedValue({});
      await service.updateDefaults(orgId, dto);
      expect(db.$transaction).toHaveBeenCalled();
      // Should have 2 updates (filter id)
      const txCalls = db.$transaction.mock.calls[0][0];
      expect(txCalls).toHaveLength(2);
    });
  });

  describe('getAll etc', () => {
    it('getAll delegates', async () => {
      repo.findAll.mockResolvedValue([{ id: '1' }]);
      expect(await service.getAll(orgId, schoolYearId)).toEqual([{ id: '1' }]);
    });
    it('getBySchoolYear delegates', async () => {
      repo.findBySchoolYear.mockResolvedValue([{ id: '1' }]);
      expect(await service.getBySchoolYear(orgId, schoolYearId)).toEqual([{ id: '1' }]);
    });
    it('getByCourse delegates', async () => {
      repo.findByCourseAndSchoolYear.mockResolvedValue([{ id: '1' }]);
      expect(await service.getByCourse(orgId, schoolYearId, 'course-1')).toEqual([{ id: '1' }]);
    });
    it('getByStrand delegates', async () => {
      repo.findByStrandAndSchoolYear.mockResolvedValue([{ id: '1' }]);
      expect(await service.getByStrand(orgId, schoolYearId, 'strand-1')).toEqual([{ id: '1' }]);
    });
    it('getByProgram delegates', async () => {
      repo.findByProgramAndSchoolYear.mockResolvedValue([{ id: '1' }]);
      expect(await service.getByProgram(orgId, programId, schoolYearId)).toEqual([{ id: '1' }]);
    });
  });

  describe('createOne / updateOne', () => {
    it('createOne delegates', async () => {
      db.program.findFirst.mockResolvedValue({ id: programId, type: 'elementary' });
      repo.create.mockResolvedValue({ id: 'lvl-1' });
      const res = await service.createOne(orgId, { programId, schoolYearId, name: 'Grade 1' } as any);
      expect(repo.create).toHaveBeenCalledWith(orgId, expect.objectContaining({ name: 'Grade 1' }));
      expect(res.id).toBe('lvl-1');
    });
    it('createOne rejects an archived or missing course parent', async () => {
      db.program.findFirst.mockResolvedValue({ id: programId, type: 'college' });
      db.course.findFirst.mockResolvedValue(null);
      await expect(
        service.createOne(orgId, { programId, schoolYearId, courseId: 'course-1', count: 1 } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(db.course.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'course-1', org_id: orgId, deleted_at: null }),
        }),
      );
      expect(repo.create).not.toHaveBeenCalled();
    });
    it('updateOne throws NotFound when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.updateOne('nope', orgId, { name: 'X' } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('updateOne succeeds', async () => {
      repo.findById.mockResolvedValue({ id: 'lvl-1' });
      repo.update.mockResolvedValue({ id: 'lvl-1', name: 'Updated' });
      const res = await service.updateOne('lvl-1', orgId, { name: 'Updated' } as any);
      expect(repo.update).toHaveBeenCalledWith('lvl-1', { name: 'Updated' });
      expect(res.name).toBe('Updated');
    });
  });

  describe('addNextLevel', () => {
    it('throws NotFound when program missing', async () => {
      db.program.findFirst.mockResolvedValue(null);
      await expect(service.addNextLevel(orgId, programId, schoolYearId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('creates Level 1 when no existing', async () => {
      db.program.findFirst.mockResolvedValue({ id: programId, name: 'Elementary', type: 'elementary' });
      repo.findByProgramAndSchoolYear.mockResolvedValue([]);
      repo.create.mockResolvedValue({ id: 'lvl-1', name: 'Elementary Level 1' });
      const res = await service.addNextLevel(orgId, programId, schoolYearId);
      expect(repo.create).toHaveBeenCalledWith(orgId, expect.objectContaining({ name: 'Elementary Level 1' }));
      expect(res.name).toContain('Level 1');
    });
    it('increments from existing level numbers (Grade 1, Grade 2 -> Level 3)', async () => {
      db.program.findFirst.mockResolvedValue({ id: programId, name: 'TestProg', type: 'elementary' });
      repo.findByProgramAndSchoolYear.mockResolvedValue([{ name: 'Grade 1' }, { name: 'Grade 2' }]);
      repo.create.mockResolvedValue({ id: 'lvl-3', name: 'TestProg Level 3' });
      const res = await service.addNextLevel(orgId, programId, schoolYearId);
      expect(res.name).toBe('TestProg Level 3');
    });
    it('handles 1st Year style and picks max', async () => {
      db.program.findFirst.mockResolvedValue({ id: programId, name: 'College', type: 'college' });
      repo.findByProgramAndSchoolYear.mockResolvedValue([{ name: '1st Year' }, { name: '2nd Year' }]);
      repo.create.mockResolvedValue({ id: 'lvl-3', name: 'College Level 3' });
      const res = await service.addNextLevel(orgId, programId, schoolYearId);
      expect(res.name).toContain('Level 3');
    });
  });

  describe('deleteOne', () => {
    it('throws NotFound when level missing', async () => {
      repo.findByIdIncludingArchived.mockResolvedValue(null);
      await expect(service.deleteOne('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('returns archived without touching anything when already archived', async () => {
      repo.findByIdIncludingArchived.mockResolvedValue({ id: 'lvl-1', deleted_at: new Date() });
      expect(await service.deleteOne('lvl-1', orgId)).toBe('archived');
      expect(db.$transaction).not.toHaveBeenCalled();
      expect(db.studentProgramEnrollment.count).not.toHaveBeenCalled();
    });
    it('archives (instead of throwing) when enrollments exist', async () => {
      repo.findByIdIncludingArchived.mockResolvedValue({ id: 'lvl-1', deleted_at: null });
      db.section.findMany.mockResolvedValue([{ id: 'sec-1' }]);
      db.subject.findMany.mockResolvedValue([{ id: 'subj-1' }]);
      db.studentProgramEnrollment.count.mockResolvedValue(1);
      db.enrollmentApplication.count.mockResolvedValue(0);
      db.class.count.mockResolvedValue(0);
      db.subjectSharing.count.mockResolvedValue(0);
      db.section.updateMany.mockResolvedValue({});
      db.level.update.mockResolvedValue({});

      expect(await service.deleteOne('lvl-1', orgId)).toBe('archived');
      // The level and its live sections are hidden together.
      expect(db.section.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ level_id: 'lvl-1', deleted_at: null }),
        }),
      );
      expect(db.level.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lvl-1' },
          data: expect.objectContaining({ deleted_at: expect.any(Date) }),
        }),
      );
      expect(db.level.delete).not.toHaveBeenCalled();
    });
    it('archives when the level has subjects (subjects count as data)', async () => {
      repo.findByIdIncludingArchived.mockResolvedValue({ id: 'lvl-1', deleted_at: null });
      db.section.findMany.mockResolvedValue([]);
      db.subject.findMany.mockResolvedValue([{ id: 'subj-1' }]);
      db.studentProgramEnrollment.count.mockResolvedValue(0);
      db.enrollmentApplication.count.mockResolvedValue(0);
      db.class.count.mockResolvedValue(0);
      db.subjectSharing.count.mockResolvedValue(0);
      db.section.updateMany.mockResolvedValue({});
      db.level.update.mockResolvedValue({});

      expect(await service.deleteOne('lvl-1', orgId)).toBe('archived');
      expect(db.level.delete).not.toHaveBeenCalled();
      // Subjects are never wiped by a level delete.
      expect(db.subject.deleteMany).not.toHaveBeenCalled();
    });
    it('archives when applications exist for the level', async () => {
      repo.findByIdIncludingArchived.mockResolvedValue({ id: 'lvl-1', deleted_at: null });
      db.section.findMany.mockResolvedValue([{ id: 'sec-1' }]);
      db.subject.findMany.mockResolvedValue([]);
      db.studentProgramEnrollment.count.mockResolvedValue(0);
      db.enrollmentApplication.count.mockResolvedValue(2);
      db.class.count.mockResolvedValue(0);
      db.subjectSharing.count.mockResolvedValue(0);
      db.section.updateMany.mockResolvedValue({});
      db.level.update.mockResolvedValue({});

      expect(await service.deleteOne('lvl-1', orgId)).toBe('archived');
      expect(db.enrollmentApplication.count).toHaveBeenCalled();
    });
    it('hard-deletes and cleans up when no dependencies', async () => {
      repo.findByIdIncludingArchived.mockResolvedValue({ id: 'lvl-1', deleted_at: null });
      db.section.findMany.mockResolvedValue([]);
      db.subject.findMany.mockResolvedValue([]);
      db.studentProgramEnrollment.count.mockResolvedValue(0);
      db.enrollmentApplication.count.mockResolvedValue(0);
      db.class.count.mockResolvedValue(0);
      db.subjectSharing.count.mockResolvedValue(0);
      const res = await service.deleteOne('lvl-1', orgId);
      expect(db.$transaction).toHaveBeenCalled();
      expect(res).toBe('deleted');
      expect(db.level.delete).not.toHaveBeenCalled(); // hard delete happens on tx.level
    });
    it('handles class count when no subjects/sections', async () => {
      repo.findByIdIncludingArchived.mockResolvedValue({ id: 'lvl-1', deleted_at: null });
      db.section.findMany.mockResolvedValue([]);
      db.subject.findMany.mockResolvedValue([]);
      db.studentProgramEnrollment.count.mockResolvedValue(0);
      db.enrollmentApplication.count.mockResolvedValue(0);
      db.class.count.mockResolvedValue(0);
      db.subjectSharing.count.mockResolvedValue(0);
      await service.deleteOne('lvl-1', orgId);
      // class count should be 0 not queried with OR when no ids (checked via Promise.resolve)
      expect(db.class.count).not.toHaveBeenCalled(); // because filters empty -> Promise.resolve(0)
    });
  });

  describe('bulkGenerate', () => {
    it('throws NotFound when program missing', async () => {
      db.program.findFirst.mockResolvedValue(null);
      await expect(service.bulkGenerate(orgId, { programId, schoolYearId, count: 2 } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('generates elementary Grade names and calls repo', async () => {
      db.program.findFirst.mockResolvedValue({ id: programId, type: 'elementary' });
      repo.deleteByProgramAndSchoolYear.mockResolvedValue({});
      repo.bulkCreate.mockResolvedValue([{ id: '1' }, { id: '2' }]);
      const res = await service.bulkGenerate(orgId, { programId, schoolYearId, count: 2 } as any);
      expect(repo.deleteByProgramAndSchoolYear).toHaveBeenCalledWith(orgId, programId, schoolYearId, undefined, undefined);
      expect(repo.bulkCreate).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ name: 'Grade 1' }), expect.objectContaining({ name: 'Grade 2' })]));
      expect(res).toHaveLength(2);
    });
    it('generates college ordinals', async () => {
      db.program.findFirst.mockResolvedValue({ id: programId, type: 'college' });
      repo.deleteByProgramAndSchoolYear.mockResolvedValue({});
      repo.bulkCreate.mockResolvedValue([]);
      await service.bulkGenerate(orgId, { programId, schoolYearId, count: 3 } as any);
      expect(repo.bulkCreate).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ name: '1st Year' }), expect.objectContaining({ name: '3rd Year' })]));
    });
    it('generates senior_high slice', async () => {
      db.program.findFirst.mockResolvedValue({ id: programId, type: 'senior_high' });
      repo.deleteByProgramAndSchoolYear.mockResolvedValue({});
      repo.bulkCreate.mockResolvedValue([]);
      await service.bulkGenerate(orgId, { programId, schoolYearId, count: 1 } as any);
      expect(repo.bulkCreate).toHaveBeenCalledWith([expect.objectContaining({ name: 'Grade 11' })]);
    });
    it('defaults to numeric names', async () => {
      db.program.findFirst.mockResolvedValue({ id: programId, type: 'custom' });
      repo.deleteByProgramAndSchoolYear.mockResolvedValue({});
      repo.bulkCreate.mockResolvedValue([]);
      await service.bulkGenerate(orgId, { programId, schoolYearId, count: 2 } as any);
      expect(repo.bulkCreate).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ name: '1' }), expect.objectContaining({ name: '2' })]));
    });
  });
});
