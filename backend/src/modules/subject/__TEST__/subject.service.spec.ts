import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { SubjectService } from '../subject.service';

describe('SubjectService', () => {
  let service: SubjectService;
  let repo: any;
  const orgId = 'org-1';
  const programId = 'prog-1';
  const subjectId = 'subj-1';

  beforeEach(() => {
    repo = {
      findProgramById: jest.fn(),
      findDuplicateByName: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      setLocked: jest.fn(),
      findCourseById: jest.fn(),
      findStrandById: jest.fn(),
      findLevelById: jest.fn(),
      addSharing: jest.fn(),
      removeSharing: jest.fn(),
      findSharings: jest.fn(),
      clearSharings: jest.fn(),
    };
    service = new SubjectService(repo);
    jest.clearAllMocks();
  });

  const programCollege = { id: programId, type: 'college' };
  const programShs = { id: programId, type: 'shs' };
  const programElem = { id: programId, type: 'elementary' };

  describe('create', () => {
    it('throws NotFound when program missing', async () => {
      repo.findProgramById.mockResolvedValue(null);
      await expect(service.create(orgId, { name: 'Math', programId, subjectType: 'major', courseId: 'c1' } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('validates scope: college major requires courseId', async () => {
      repo.findProgramById.mockResolvedValue(programCollege);
      await expect(service.create(orgId, { name: 'Math', programId, subjectType: 'major' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('validates scope: shs major requires strandId', async () => {
      repo.findProgramById.mockResolvedValue(programShs);
      await expect(service.create(orgId, { name: 'Math', programId, subjectType: 'major' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('validates scope: minor requires levelId', async () => {
      repo.findProgramById.mockResolvedValue(programElem);
      await expect(service.create(orgId, { name: 'PE', programId, subjectType: 'minor' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws Conflict when duplicate exists', async () => {
      repo.findProgramById.mockResolvedValue(programElem);
      repo.findDuplicateByName.mockResolvedValue({ id: 'dup' });
      await expect(service.create(orgId, { name: 'Math', programId, levelId: 'lvl1', subjectType: 'major' } as any)).rejects.toBeInstanceOf(ConflictException);
    });
    it('creates major for elementary (no course/strand needed) successfully', async () => {
      repo.findProgramById.mockResolvedValue(programElem);
      repo.findDuplicateByName.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: subjectId, org_id: orgId, name: 'Math', program_id: programId, subject_type: 'major', is_locked: false });
      const res = await service.create(orgId, { name: 'Math', programId, levelId: 'lvl1', subjectType: 'major' } as any);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Math', subjectType: 'major' }));
      expect(res.title).toBe('Math');
    });
    it('creates college major with courseId', async () => {
      repo.findProgramById.mockResolvedValue(programCollege);
      repo.findDuplicateByName.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: subjectId, org_id: orgId, name: 'Math', program_id: programId, course_id: 'c1', subject_type: 'major', is_locked: false });
      const res = await service.create(orgId, { name: 'Math', programId, courseId: 'c1', levelId: 'lvl1', subjectType: 'major' } as any);
      expect(res.courseId).toBe('c1');
    });
  });

  describe('findAll / findById', () => {
    it('returns paginated data with mapping', async () => {
      repo.findAll.mockResolvedValue({ data: [{ id: subjectId, org_id: orgId, name: 'Math', subject_type: 'major', is_locked: false }], total: 1 });
      const res = await service.findAll(orgId, { page: 1, limit: 10 } as any);
      expect(res.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
      expect(res.data[0].title).toBe('Math');
    });
    it('throws NotFound for missing findById', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('returns mapped subject', async () => {
      repo.findById.mockResolvedValue({ id: subjectId, org_id: orgId, name: 'Math', subject_type: 'major', is_locked: true });
      const res = await service.findById(subjectId, orgId);
      expect(res.lockStatus).toBe('locked');
    });
  });

  describe('update', () => {
    it('throws NotFound when subject missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('nope', orgId, { name: 'X' } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws BadRequest when locked', async () => {
      repo.findById.mockResolvedValue({ id: subjectId, org_id: orgId, name: 'Math', is_locked: true });
      await expect(service.update(subjectId, orgId, { name: 'New' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('validates scope on program change', async () => {
      repo.findById.mockResolvedValue({ id: subjectId, org_id: orgId, name: 'Math', program_id: programId, subject_type: 'major', is_locked: false });
      // New program is college, but update does not provide courseId -> should fail
      repo.findProgramById.mockResolvedValue({ id: 'newProg', type: 'college' });
      await expect(service.update(subjectId, orgId, { programId: 'newProg', subjectType: 'major' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws Conflict on duplicate name', async () => {
      repo.findById.mockResolvedValue({ id: subjectId, org_id: orgId, name: 'Math', program_id: programId, subject_type: 'major', level_id: 'lvl1', is_locked: false });
      repo.findDuplicateByName.mockResolvedValue({ id: 'dup' });
      await expect(service.update(subjectId, orgId, { name: 'Math' } as any)).rejects.toBeInstanceOf(ConflictException);
    });
    it('clears sharings when program changes', async () => {
      repo.findById.mockResolvedValue({ id: subjectId, org_id: orgId, name: 'Math', program_id: programId, subject_type: 'major', is_locked: false });
      repo.findProgramById.mockResolvedValue(programElem);
      repo.findDuplicateByName.mockResolvedValue(null);
      repo.clearSharings.mockResolvedValue({});
      repo.update.mockResolvedValue({ id: subjectId, org_id: orgId, name: 'New', subject_type: 'major', is_locked: false });
      await service.update(subjectId, orgId, { programId: 'newProg', name: 'New' } as any);
      expect(repo.clearSharings).toHaveBeenCalledWith(subjectId, orgId);
    });
    it('updates successfully without scope change', async () => {
      repo.findById.mockResolvedValue({ id: subjectId, org_id: orgId, name: 'Math', program_id: programId, subject_type: 'major', level_id: 'lvl1', is_locked: false });
      repo.findDuplicateByName.mockResolvedValue(null);
      repo.update.mockResolvedValue({ id: subjectId, org_id: orgId, name: 'Updated', subject_type: 'major', is_locked: false });
      const res = await service.update(subjectId, orgId, { name: 'Updated' } as any);
      expect(res.title).toBe('Updated');
      expect(repo.clearSharings).not.toHaveBeenCalled();
    });
  });

  describe('lock / unlock', () => {
    it('lock throws NotFound', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.lock('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('lock throws when already locked', async () => {
      repo.findById.mockResolvedValue({ id: subjectId, is_locked: true });
      await expect(service.lock(subjectId, orgId)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('lock succeeds', async () => {
      repo.findById.mockResolvedValue({ id: subjectId, is_locked: false });
      repo.setLocked.mockResolvedValue({ id: subjectId, is_locked: true });
      const res = await service.lock(subjectId, orgId);
      expect(repo.setLocked).toHaveBeenCalledWith(subjectId, true);
      expect(res.lockStatus).toBe('locked');
    });
    it('unlock throws when already unlocked', async () => {
      repo.findById.mockResolvedValue({ id: subjectId, is_locked: false });
      await expect(service.unlock(subjectId, orgId)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('unlock succeeds', async () => {
      repo.findById.mockResolvedValue({ id: subjectId, is_locked: true });
      repo.setLocked.mockResolvedValue({ id: subjectId, is_locked: false });
      const res = await service.unlock(subjectId, orgId);
      expect(res.lockStatus).toBe('unlocked');
    });
  });

  describe('share', () => {
    it('rejects when not exactly one target', async () => {
      await expect(service.share(subjectId, orgId, {} as any)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.share(subjectId, orgId, { courseId: 'c1', strandId: 's1' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('rejects when subject not minor', async () => {
      repo.findById.mockResolvedValue({ id: subjectId, subject_type: 'major', program_id: programId, level_id: 'lvl1' });
      await expect(service.share(subjectId, orgId, { courseId: 'c1' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('rejects when minor has no program/level', async () => {
      repo.findById.mockResolvedValue({ id: subjectId, subject_type: 'minor', program_id: null, level_id: 'lvl1' });
      await expect(service.share(subjectId, orgId, { courseId: 'c1' } as any)).rejects.toBeInstanceOf(BadRequestException);
      repo.findById.mockResolvedValue({ id: subjectId, subject_type: 'minor', program_id: programId, level_id: null });
      await expect(service.share(subjectId, orgId, { courseId: 'c1' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('rejects when course not same program', async () => {
      repo.findById.mockResolvedValue({ id: subjectId, subject_type: 'minor', program_id: programId, level_id: 'lvl1' });
      repo.findCourseById.mockResolvedValue({ id: 'c1', program_id: 'otherProg' });
      await expect(service.share(subjectId, orgId, { courseId: 'c1' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('rejects level sharing to different level', async () => {
      repo.findById.mockResolvedValue({ id: subjectId, subject_type: 'minor', program_id: programId, level_id: 'lvl1' });
      repo.findLevelById.mockResolvedValue({ id: 'lvl2', program_id: programId });
      await expect(service.share(subjectId, orgId, { levelId: 'lvl2' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('succeeds for valid course sharing', async () => {
      repo.findById.mockResolvedValue({ id: subjectId, subject_type: 'minor', program_id: programId, level_id: 'lvl1' });
      repo.findCourseById.mockResolvedValue({ id: 'c1', program_id: programId });
      repo.addSharing.mockResolvedValue({ id: 'sharing-1' });
      const res = await service.share(subjectId, orgId, { courseId: 'c1' } as any);
      expect(repo.addSharing).toHaveBeenCalledWith(subjectId, orgId, expect.objectContaining({ courseId: 'c1' }));
      expect(res.id).toBe('sharing-1');
    });
  });

  describe('unshare / findSharings', () => {
    it('unshare throws NotFound when subject missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.unshare(subjectId, 'sharing-1', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('unshare succeeds', async () => {
      repo.findById.mockResolvedValue({ id: subjectId });
      repo.removeSharing.mockResolvedValue({});
      const res = await service.unshare(subjectId, 'sharing-1', orgId);
      expect(res).toEqual({ success: true });
    });
    it('findSharings throws NotFound when subject missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findSharings(subjectId, orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
