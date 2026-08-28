import { NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EnrollmentService } from '../enrollment.service';

jest.mock('../enrollment-eligibility.util', () => ({
  resolveSubjectAcademicStructure: jest.fn(),
  isEligibleForClassStructure: jest.fn(),
}));

import { resolveSubjectAcademicStructure, isEligibleForClassStructure } from '../enrollment-eligibility.util';

describe('EnrollmentService', () => {
  let service: EnrollmentService;
  let repo: any;
  let db: any;
  const orgId = 'org-1';
  const classId = 'class-1';
  const subjectId = 'subj-1';
  const semesterId = 'sem-1';
  const studentId = 'stu-1';

  let gradingScaleRepo: { findByClassId: jest.Mock };
  beforeEach(() => {
    repo = {
      getPrerequisitesWithGrades: jest.fn(),
      findClassEnrollmentContext: jest.fn(),
      findStudentAcademicStructure: jest.fn(),
      findDuplicate: jest.fn(),
      findByStudent: jest.fn(),
      countActive: jest.fn(),
      create: jest.fn(),
      findByClass: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      remove: jest.fn(),
      findByStudentAcrossOrg: jest.fn(),
      findOneByStudentAndClass: jest.fn(),
    };
    db = {};
    gradingScaleRepo = { findByClassId: jest.fn().mockResolvedValue(null) };
    service = new EnrollmentService(repo, gradingScaleRepo as unknown as never, db);
    jest.clearAllMocks();
    gradingScaleRepo.findByClassId.mockResolvedValue(null);
    (resolveSubjectAcademicStructure as jest.Mock).mockResolvedValue({ programId: 'prog-1' });
    (isEligibleForClassStructure as jest.Mock).mockReturnValue(true);
  });

  describe('checkEligibility', () => {
    it('returns eligible when no prerequisites', async () => {
      repo.getPrerequisitesWithGrades.mockResolvedValue([]);
      expect(await service.checkEligibility(subjectId, studentId, orgId)).toEqual({ eligible: true, missing: [] });
    });
    it('reports not_taken when grade missing', async () => {
      repo.getPrerequisitesWithGrades.mockResolvedValue([{ subject_id: 'pre-1', subject_name: 'Math 101', grade: null }]);
      const res = await service.checkEligibility(subjectId, studentId, orgId);
      expect(res.eligible).toBe(false);
      expect(res.missing[0].reason).toBe('not_taken');
    });
    it('reports not_locked when grade exists but not locked', async () => {
      repo.getPrerequisitesWithGrades.mockResolvedValue([{ subject_id: 'pre-1', subject_name: 'Math', grade: { is_locked: false, final_score: 90, class: { id: 'class-1' } } }]);
      const res = await service.checkEligibility(subjectId, studentId, orgId);
      expect(res.missing[0].reason).toBe('not_locked');
    });
    it('reports not_passed when score < 75', async () => {
      repo.getPrerequisitesWithGrades.mockResolvedValue([{ subject_id: 'pre-1', subject_name: 'Math', grade: { is_locked: true, final_score: 60, class: { id: 'class-1' } } }]);
      const res = await service.checkEligibility(subjectId, studentId, orgId);
      expect(res.missing[0].reason).toBe('not_passed');
    });
    it('passes when all locked and >=75', async () => {
      repo.getPrerequisitesWithGrades.mockResolvedValue([{ subject_id: 'pre-1', subject_name: 'Math', grade: { is_locked: true, final_score: 80, class: { id: 'class-1' } } }]);
      const res = await service.checkEligibility(subjectId, studentId, orgId);
      expect(res.eligible).toBe(true);
    });
    it('handles mixed missing and passed', async () => {
      repo.getPrerequisitesWithGrades.mockResolvedValue([
        { subject_id: 'pre-1', subject_name: 'A', grade: { is_locked: true, final_score: 90, class: { id: 'class-1' } } },
        { subject_id: 'pre-2', subject_name: 'B', grade: null },
      ]);
      const res = await service.checkEligibility(subjectId, studentId, orgId);
      expect(res.eligible).toBe(false);
      expect(res.missing).toHaveLength(1);
      expect(res.missing[0].subject_id).toBe('pre-2');
    });
  });

  describe('enroll', () => {
    function mockAcademicEligible() {
      repo.findClassEnrollmentContext.mockResolvedValue({ subject_id: subjectId, school_year_id: 'sy-1', section_id: null });
      (resolveSubjectAcademicStructure as jest.Mock).mockResolvedValue({ programId: 'prog-1' });
      repo.findStudentAcademicStructure.mockResolvedValue({ programId: 'prog-1' });
      (isEligibleForClassStructure as jest.Mock).mockReturnValue(true);
    }

    it('throws NotFound when class context missing (academic eligibility)', async () => {
      repo.findClassEnrollmentContext.mockResolvedValue(null);
      await expect(service.enroll(classId, subjectId, semesterId, 30, studentId, orgId)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequest when student not eligible (no placement)', async () => {
      repo.findClassEnrollmentContext.mockResolvedValue({ subject_id: subjectId, school_year_id: 'sy-1', section_id: null });
      (resolveSubjectAcademicStructure as jest.Mock).mockResolvedValue({ programId: 'prog-1' });
      repo.findStudentAcademicStructure.mockResolvedValue(null);
      (isEligibleForClassStructure as jest.Mock).mockReturnValue(false);
      await expect(service.enroll(classId, subjectId, semesterId, 30, studentId, orgId)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when prerequisite not met', async () => {
      mockAcademicEligible();
      repo.getPrerequisitesWithGrades.mockResolvedValue([{ subject_id: 'pre-1', subject_name: 'Math', grade: null }]);
      await expect(service.enroll(classId, subjectId, semesterId, 30, studentId, orgId)).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.getPrerequisitesWithGrades).toHaveBeenCalled();
    });

    it('throws Conflict when duplicate subject+semester', async () => {
      mockAcademicEligible();
      repo.getPrerequisitesWithGrades.mockResolvedValue([]);
      repo.findDuplicate.mockResolvedValue({ id: 'dup' });
      await expect(service.enroll(classId, subjectId, semesterId, 30, studentId, orgId)).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws Conflict when already enrolled in same class (not removed)', async () => {
      mockAcademicEligible();
      repo.getPrerequisitesWithGrades.mockResolvedValue([]);
      repo.findDuplicate.mockResolvedValue(null);
      repo.findByStudent.mockResolvedValue({ id: 'enr-1', status: 'active' });
      await expect(service.enroll(classId, subjectId, semesterId, 30, studentId, orgId)).rejects.toBeInstanceOf(ConflictException);
    });

    it('allows re-enroll when previous was removed', async () => {
      mockAcademicEligible();
      repo.getPrerequisitesWithGrades.mockResolvedValue([]);
      repo.findDuplicate.mockResolvedValue(null);
      repo.findByStudent.mockResolvedValue({ id: 'enr-1', status: 'removed' });
      repo.countActive.mockResolvedValue(0);
      repo.create.mockResolvedValue({ id: 'new-enr' });
      const res = await service.enroll(classId, subjectId, semesterId, 30, studentId, orgId);
      if (!res || !('id' in res)) throw new Error('expected enrollment result with id');
      expect(res.id).toBe('new-enr');
    });

    it('returns overflow when capacity reached', async () => {
      mockAcademicEligible();
      repo.getPrerequisitesWithGrades.mockResolvedValue([]);
      repo.findDuplicate.mockResolvedValue(null);
      repo.findByStudent.mockResolvedValue(null);
      repo.countActive.mockResolvedValue(30);
      const res: any = await service.enroll(classId, subjectId, semesterId, 30, studentId, orgId);
      expect(res.overflow).toBe(true);
      expect(res.message).toContain('full capacity');
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('skips capacity check when capacity 0 (unlimited)', async () => {
      mockAcademicEligible();
      repo.getPrerequisitesWithGrades.mockResolvedValue([]);
      repo.findDuplicate.mockResolvedValue(null);
      repo.findByStudent.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'enr-1' });
      const res = await service.enroll(classId, subjectId, semesterId, 0, studentId, orgId);
      expect(repo.countActive).not.toHaveBeenCalled();
      if (!res || !('id' in res)) throw new Error('expected enrollment result with id');
      expect(res.id).toBe('enr-1');
    });

    it('creates enrollment when all gates pass', async () => {
      mockAcademicEligible();
      repo.getPrerequisitesWithGrades.mockResolvedValue([]);
      repo.findDuplicate.mockResolvedValue(null);
      repo.findByStudent.mockResolvedValue(null);
      repo.countActive.mockResolvedValue(5);
      repo.create.mockResolvedValue({ id: 'enr-1', status: 'active' });
      const res = await service.enroll(classId, subjectId, semesterId, 30, studentId, orgId);
      expect(repo.create).toHaveBeenCalledWith({ orgId, classId, studentId, status: 'active' });
      if (!res || !('id' in res)) throw new Error('expected enrollment result with id');
      expect(res.id).toBe('enr-1');
    });
  });

  describe('updateStatus / remove', () => {
    it('updateStatus throws NotFound when not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.updateStatus(classId, 'enr-1', orgId, { status: 'active' } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('updateStatus throws when classId mismatch', async () => {
      repo.findById.mockResolvedValue({ id: 'enr-1', class_id: 'other-class' });
      await expect(service.updateStatus(classId, 'enr-1', orgId, { status: 'active' } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('updateStatus succeeds', async () => {
      repo.findById.mockResolvedValue({ id: 'enr-1', class_id: classId });
      repo.updateStatus.mockResolvedValue({ id: 'enr-1', status: 'active' });
      const res = await service.updateStatus(classId, 'enr-1', orgId, { status: 'active' } as any);
      expect(repo.updateStatus).toHaveBeenCalledWith('enr-1', 'active');
      expect(res.status).toBe('active');
    });
    it('remove throws NotFound when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove(classId, 'enr-1', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('remove throws Conflict when already removed', async () => {
      repo.findById.mockResolvedValue({ id: 'enr-1', class_id: classId, status: 'removed' });
      await expect(service.remove(classId, 'enr-1', orgId)).rejects.toBeInstanceOf(ConflictException);
    });
    it('remove succeeds', async () => {
      repo.findById.mockResolvedValue({ id: 'enr-1', class_id: classId, status: 'active' });
      repo.remove.mockResolvedValue({ id: 'enr-1', status: 'removed' });
      const res = await service.remove(classId, 'enr-1', orgId);
      expect(repo.remove).toHaveBeenCalledWith('enr-1');
      expect(res.status).toBe('removed');
    });
  });

  describe('student queries', () => {
    it('getStudentEnrollmentForClass throws Forbidden when not enrolled', async () => {
      repo.findOneByStudentAndClass.mockResolvedValue(null);
      await expect(service.getStudentEnrollmentForClass(classId, studentId, orgId)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('getStudentEnrollmentForClass returns enrollment', async () => {
      repo.findOneByStudentAndClass.mockResolvedValue({ id: 'enr-1' });
      expect(await service.getStudentEnrollmentForClass(classId, studentId, orgId)).toEqual({ id: 'enr-1' });
    });
    it('countActive delegates', async () => {
      repo.countActive.mockResolvedValue(5);
      expect(await service.countActive(classId)).toBe(5);
    });
  });
});
