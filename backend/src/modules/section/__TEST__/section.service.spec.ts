import { NotFoundException, ConflictException } from '@nestjs/common';
import { SectionService } from '../section.service';

describe('SectionService', () => {
  let service: SectionService;
  let repo: any;
  let db: any;
  let audit: any;
  const orgId = 'org-1';
  const actorId = 'actor-1';
  const sectionId = 'sec-1';

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      hasStudents: jest.fn(),
      countStudentsInSection: jest.fn(),
    };
    db = {
      level: { findFirst: jest.fn() },
      course: { findFirst: jest.fn() },
      strand: { findFirst: jest.fn() },
      section: { findFirst: jest.fn() },
    };
    audit = { logAdminAction: jest.fn().mockResolvedValue(undefined) };
    service = new SectionService(repo, db, audit);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('throws NotFound when level missing', async () => {
      db.level.findFirst.mockResolvedValue(null);
      await expect(service.create(orgId, { levelId: 'lvl-1', schoolYearId: 'sy-1', name: 'A', capacity: 30 } as any, actorId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws NotFound when course missing', async () => {
      db.level.findFirst.mockResolvedValue({ id: 'lvl-1' });
      db.course.findFirst.mockResolvedValue(null);
      await expect(service.create(orgId, { levelId: 'lvl-1', courseId: 'bad', schoolYearId: 'sy-1', name: 'A', capacity: 30 } as any, actorId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws NotFound when strand missing', async () => {
      db.level.findFirst.mockResolvedValue({ id: 'lvl-1' });
      db.strand.findFirst.mockResolvedValue(null);
      await expect(service.create(orgId, { levelId: 'lvl-1', strandId: 'bad', schoolYearId: 'sy-1', name: 'A', capacity: 30 } as any, actorId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws Conflict when duplicate name', async () => {
      db.level.findFirst.mockResolvedValue({ id: 'lvl-1' });
      db.section.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(service.create(orgId, { levelId: 'lvl-1', schoolYearId: 'sy-1', name: 'A', capacity: 30 } as any, actorId)).rejects.toBeInstanceOf(ConflictException);
    });
    it('creates and audits', async () => {
      db.level.findFirst.mockResolvedValue({ id: 'lvl-1' });
      db.section.findFirst.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: sectionId, name: 'A', capacity: 30 });
      const res = await service.create(orgId, { levelId: 'lvl-1', schoolYearId: 'sy-1', name: 'A', capacity: 30 } as any, actorId);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'A', capacity: 30 }));
      expect(audit.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'section_created' }));
      expect(res.id).toBe(sectionId);
    });
    it('creates with course and strand when valid', async () => {
      db.level.findFirst.mockResolvedValue({ id: 'lvl-1' });
      db.course.findFirst.mockResolvedValue({ id: 'course-1' });
      db.strand.findFirst.mockResolvedValue({ id: 'strand-1' });
      db.section.findFirst.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: sectionId });
      await service.create(orgId, { levelId: 'lvl-1', courseId: 'course-1', strandId: 'strand-1', schoolYearId: 'sy-1', name: 'B', capacity: 25 } as any, actorId);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ courseId: 'course-1', strandId: 'strand-1' }));
    });
  });

  describe('findAll / findById', () => {
    it('findAll returns paginated', async () => {
      repo.findAll.mockResolvedValue({ data: [{ id: sectionId }], total: 1 });
      const res = await service.findAll(orgId, { page: 1, limit: 10 } as any);
      expect(res.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
    });
    it('findById throws NotFound', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('findById returns section', async () => {
      repo.findById.mockResolvedValue({ id: sectionId, name: 'A' });
      expect(await service.findById(sectionId, orgId)).toEqual({ id: sectionId, name: 'A' });
    });
  });

  describe('update', () => {
    it('throws NotFound when section missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('nope', orgId, {} as any, actorId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws Conflict when capacity < enrolled', async () => {
      repo.findById.mockResolvedValue({ id: sectionId, name: 'A', level_id: 'lvl-1', school_year_id: 'sy-1', course_id: null, strand_id: null });
      repo.countStudentsInSection.mockResolvedValue(10);
      await expect(service.update(sectionId, orgId, { capacity: 5 } as any, actorId)).rejects.toBeInstanceOf(ConflictException);
    });
    it('throws Conflict when duplicate name on update', async () => {
      repo.findById.mockResolvedValue({ id: sectionId, name: 'A', level_id: 'lvl-1', school_year_id: 'sy-1', course_id: null, strand_id: null });
      repo.countStudentsInSection.mockResolvedValue(0);
      db.section.findFirst.mockResolvedValue({ id: 'other', name: 'B' });
      await expect(service.update(sectionId, orgId, { name: 'B' } as any, actorId)).rejects.toBeInstanceOf(ConflictException);
    });
    it('allows same name for same id', async () => {
      repo.findById.mockResolvedValue({ id: sectionId, name: 'A', level_id: 'lvl-1', school_year_id: 'sy-1', course_id: null, strand_id: null });
      repo.countStudentsInSection.mockResolvedValue(0);
      db.section.findFirst.mockResolvedValue({ id: sectionId, name: 'A' });
      repo.update.mockResolvedValue({ id: sectionId, name: 'A' });
      const res = await service.update(sectionId, orgId, { name: 'A' } as any, actorId);
      expect(res.name).toBe('A');
    });
    it('updates and audits', async () => {
      repo.findById.mockResolvedValue({ id: sectionId, name: 'A', level_id: 'lvl-1', school_year_id: 'sy-1', course_id: null, strand_id: null });
      repo.countStudentsInSection.mockResolvedValue(0);
      db.section.findFirst.mockResolvedValue(null);
      repo.update.mockResolvedValue({ id: sectionId, name: 'New', capacity: 40 });
      const res = await service.update(sectionId, orgId, { name: 'New', capacity: 40 } as any, actorId);
      expect(repo.update).toHaveBeenCalledWith(sectionId, expect.objectContaining({ name: 'New', capacity: 40 }));
      expect(audit.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'section_updated' }));
      expect(res.name).toBe('New');
    });
  });

  describe('remove', () => {
    it('throws NotFound when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove('nope', orgId, actorId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws Conflict when has students', async () => {
      repo.findById.mockResolvedValue({ id: sectionId, name: 'A' });
      repo.hasStudents.mockResolvedValue(true);
      await expect(service.remove(sectionId, orgId, actorId)).rejects.toBeInstanceOf(ConflictException);
    });
    it('soft deletes and audits', async () => {
      repo.findById.mockResolvedValue({ id: sectionId, name: 'A' });
      repo.hasStudents.mockResolvedValue(false);
      await service.remove(sectionId, orgId, actorId);
      expect(repo.softDelete).toHaveBeenCalledWith(sectionId);
      expect(audit.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'section_deleted' }));
    });
  });
});
