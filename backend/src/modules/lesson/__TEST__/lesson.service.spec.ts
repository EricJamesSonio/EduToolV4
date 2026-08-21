import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { LessonService } from '../lesson.service';

describe('LessonService', () => {
  let service: LessonService;
  let lessonRepo: any;
  let classRepo: any;
  let auditLog: any;
  let attendanceRepo: any;
  let conceptService: any;
  let weekService: any;
  let studentService: any;
  const orgId = 'org-1';
  const classId = 'class-1';
  const educatorId = 'edu-1';
  const lessonId = 'lesson-1';

  const detailOk = 'This is a valid lesson detail with more than ten words to pass validation check easily here.';
  const detailShort = 'Too short';

  beforeEach(() => {
    lessonRepo = {
      findByClassAndWeek: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findConcept: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    classRepo = { findById: jest.fn() };
    auditLog = { logActivityEvent: jest.fn().mockResolvedValue(undefined) };
    attendanceRepo = { findSessionsByClass: jest.fn() };
    conceptService = { triggerConceptExtraction: jest.fn().mockResolvedValue(undefined), getConcept: jest.fn(), reExtractConcept: jest.fn(), conceptBuild: jest.fn() };
    weekService = { getWeekStructure: jest.fn() };
    studentService = { getStudentLessons: jest.fn(), getStudentLesson: jest.fn() };
    service = new LessonService(lessonRepo, classRepo, auditLog, attendanceRepo, conceptService, weekService, studentService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('throws NotFound when class missing', async () => {
      classRepo.findById.mockResolvedValue(null);
      await expect(service.create(classId, orgId, educatorId, { title: 'T', detail: detailOk, weekNumber: 1, subIndex: 0 } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws Forbidden when not owner', async () => {
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: 'other' });
      await expect(service.create(classId, orgId, educatorId, { title: 'T', detail: detailOk, weekNumber: 1, subIndex: 0 } as any)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('throws BadRequest when detail <10 words', async () => {
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: educatorId });
      await expect(service.create(classId, orgId, educatorId, { title: 'T', detail: detailShort, weekNumber: 1, subIndex: 0 } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws BadRequest when duplicate week/subIndex', async () => {
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: educatorId });
      lessonRepo.findByClassAndWeek.mockResolvedValue({ id: 'existing' });
      await expect(service.create(classId, orgId, educatorId, { title: 'T', detail: detailOk, weekNumber: 1, subIndex: 0 } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('creates and logs and triggers concept', async () => {
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: educatorId });
      lessonRepo.findByClassAndWeek.mockResolvedValue(null);
      lessonRepo.create.mockResolvedValue({ id: lessonId, title: 'T' });
      const res = await service.create(classId, orgId, educatorId, { title: 'T', description: 'Desc', detail: detailOk, weekNumber: 1, subIndex: 0 } as any);
      expect(lessonRepo.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'T', detail: detailOk }));
      expect(auditLog.logActivityEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'lesson_created' }));
      expect(conceptService.triggerConceptExtraction).toHaveBeenCalledWith(lessonId, orgId, educatorId, detailOk);
      expect(res.id).toBe(lessonId);
    });
    it('does not throw if concept extraction fails (catch)', async () => {
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: educatorId });
      lessonRepo.findByClassAndWeek.mockResolvedValue(null);
      lessonRepo.create.mockResolvedValue({ id: lessonId, title: 'T' });
      conceptService.triggerConceptExtraction.mockRejectedValue(new Error('ai fail'));
      await expect(service.create(classId, orgId, educatorId, { title: 'T', detail: detailOk, weekNumber: 1, subIndex: 0 } as any)).resolves.toBeDefined();
    });
  });

  describe('findAll / findOne', () => {
    it('findAll throws NotFound when class missing', async () => {
      classRepo.findById.mockResolvedValue(null);
      await expect(service.findAll(classId, orgId, educatorId, {} as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('findAll throws Forbidden when not owner', async () => {
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: 'other' });
      await expect(service.findAll(classId, orgId, educatorId, {} as any)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('findOne throws NotFound when lesson missing', async () => {
      lessonRepo.findById.mockResolvedValue(null);
      await expect(service.findOne('nope', orgId, educatorId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('findOne throws Forbidden when not owner', async () => {
      lessonRepo.findById.mockResolvedValue({ id: lessonId, class_id: classId });
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: 'other' });
      await expect(service.findOne(lessonId, orgId, educatorId)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('findOne returns with concept', async () => {
      lessonRepo.findById.mockResolvedValue({ id: lessonId, class_id: classId });
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: educatorId });
      lessonRepo.findConcept.mockResolvedValue({ id: 'c-1' });
      const res = await service.findOne(lessonId, orgId, educatorId);
      expect(res.concept).toEqual({ id: 'c-1' });
    });
  });

  describe('update', () => {
    it('throws NotFound when lesson missing', async () => {
      lessonRepo.findById.mockResolvedValue(null);
      await expect(service.update('nope', orgId, educatorId, {} as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws Forbidden when not owner', async () => {
      lessonRepo.findById.mockResolvedValue({ id: lessonId, class_id: classId });
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: 'other' });
      await expect(service.update(lessonId, orgId, educatorId, {} as any)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('throws BadRequest when detail too short', async () => {
      lessonRepo.findById.mockResolvedValue({ id: lessonId, class_id: classId });
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: educatorId });
      await expect(service.update(lessonId, orgId, educatorId, { detail: detailShort } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws BadRequest when week conflict', async () => {
      lessonRepo.findById.mockResolvedValue({ id: lessonId, class_id: classId, week_number: 1, sub_index: 0 });
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: educatorId });
      lessonRepo.findByClassAndWeek.mockResolvedValue({ id: 'other', class_id: classId });
      await expect(service.update(lessonId, orgId, educatorId, { weekNumber: 1, subIndex: 0 } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('updates and logs', async () => {
      lessonRepo.findById.mockResolvedValue({ id: lessonId, class_id: classId, week_number: 1, sub_index: 0 });
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: educatorId });
      lessonRepo.findByClassAndWeek.mockResolvedValue(null);
      lessonRepo.update.mockResolvedValue({ id: lessonId, title: 'Updated' });
      const res = await service.update(lessonId, orgId, educatorId, { title: 'Updated' } as any);
      expect(lessonRepo.update).toHaveBeenCalled();
      expect(auditLog.logActivityEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'lesson_updated' }));
      expect(res.title).toBe('Updated');
    });
  });

  describe('delete / sync', () => {
    it('delete throws NotFound', async () => {
      lessonRepo.findById.mockResolvedValue(null);
      await expect(service.delete('nope', orgId, educatorId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('delete succeeds and logs', async () => {
      lessonRepo.findById.mockResolvedValue({ id: lessonId, class_id: classId });
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: educatorId });
      const res = await service.delete(lessonId, orgId, educatorId);
      expect(lessonRepo.delete).toHaveBeenCalledWith(lessonId);
      expect(res.success).toBe(true);
    });
    it('syncLessonsFromAttendance creates missing lessons', async () => {
      attendanceRepo.findSessionsByClass.mockResolvedValue([{ week_number: 1, sub_index: 0 }, { week_number: 2, sub_index: 0 }]);
      lessonRepo.findAll.mockResolvedValue([{ week_number: 1, sub_index: 0, id: 'existing' }]);
      await service.syncLessonsFromAttendance(classId, orgId);
      expect(lessonRepo.create).toHaveBeenCalledWith(expect.objectContaining({ weekNumber: 2 }));
      expect(lessonRepo.update).toHaveBeenCalled();
    });
    it('sync does nothing when no sessions', async () => {
      attendanceRepo.findSessionsByClass.mockResolvedValue([]);
      await service.syncLessonsFromAttendance(classId, orgId);
      expect(lessonRepo.create).not.toHaveBeenCalled();
    });
  });
});
