import { NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EnrollmentService } from '../enrollment.service';
import { SubjectPrerequisiteService } from '../../subject-prerequisite/subject-prerequisite.service';

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

  let prereqService: { checkEligibilityBatch: jest.Mock };
  beforeEach(() => {
    repo = {
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
    prereqService = {
      checkEligibilityBatch: jest.fn().mockResolvedValue(
        new Map([[subjectId, { eligible: true, missing: [] }]]),
      ),
    };
    service = new EnrollmentService(repo, prereqService as unknown as never, db);
    jest.clearAllMocks();
    prereqService.checkEligibilityBatch.mockResolvedValue(
      new Map([[subjectId, { eligible: true, missing: [] }]]),
    );
    (resolveSubjectAcademicStructure as jest.Mock).mockResolvedValue({ programId: 'prog-1' });
    (isEligibleForClassStructure as jest.Mock).mockReturnValue(true);
  });

  describe('checkEligibility', () => {
    it('delegates to subjectPrerequisiteService.checkEligibilityBatch', async () => {
      prereqService.checkEligibilityBatch.mockResolvedValue(
        new Map([[subjectId, { eligible: true, missing: [] }]]),
      );
      const res = await service.checkEligibility(subjectId, studentId, orgId);
      expect(prereqService.checkEligibilityBatch).toHaveBeenCalledWith([subjectId], studentId, orgId);
      expect(res).toEqual({ eligible: true, missing: [] });
    });

    it('returns ineligible when subjectPrerequisiteService reports missing prereqs', async () => {
      prereqService.checkEligibilityBatch.mockResolvedValue(
        new Map([
          [
            subjectId,
            {
              eligible: false,
              missing: [
                { subject_id: 'pre-1', subject_name: 'Math 101', reason: 'not_taken' },
              ],
            },
          ],
        ]),
      );
      const res = await service.checkEligibility(subjectId, studentId, orgId);
      expect(res.eligible).toBe(false);
      expect(res.missing[0].reason).toBe('not_taken');
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
      prereqService.checkEligibilityBatch.mockResolvedValue(
        new Map([
          [
            subjectId,
            {
              eligible: false,
              missing: [{ subject_id: 'pre-1', subject_name: 'Math', reason: 'not_taken' }],
            },
          ],
        ]),
      );
      await expect(service.enroll(classId, subjectId, semesterId, 30, studentId, orgId)).rejects.toBeInstanceOf(BadRequestException);
      expect(prereqService.checkEligibilityBatch).toHaveBeenCalledWith([subjectId], studentId, orgId);
    });

    it('throws Conflict when duplicate subject+semester', async () => {
      mockAcademicEligible();
      prereqService.checkEligibilityBatch.mockResolvedValue(
        new Map([[subjectId, { eligible: true, missing: [] }]]),
      );
      repo.findDuplicate.mockResolvedValue({ id: 'dup' });
      await expect(service.enroll(classId, subjectId, semesterId, 30, studentId, orgId)).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws Conflict when already enrolled in same class (not removed)', async () => {
      mockAcademicEligible();
      prereqService.checkEligibilityBatch.mockResolvedValue(
        new Map([[subjectId, { eligible: true, missing: [] }]]),
      );
      repo.findDuplicate.mockResolvedValue(null);
      repo.findByStudent.mockResolvedValue({ id: 'enr-1', status: 'active' });
      await expect(service.enroll(classId, subjectId, semesterId, 30, studentId, orgId)).rejects.toBeInstanceOf(ConflictException);
    });

    it('allows re-enroll when previous was removed', async () => {
      mockAcademicEligible();
      prereqService.checkEligibilityBatch.mockResolvedValue(
        new Map([[subjectId, { eligible: true, missing: [] }]]),
      );
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
      prereqService.checkEligibilityBatch.mockResolvedValue(
        new Map([[subjectId, { eligible: true, missing: [] }]]),
      );
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
      prereqService.checkEligibilityBatch.mockResolvedValue(
        new Map([[subjectId, { eligible: true, missing: [] }]]),
      );
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
      prereqService.checkEligibilityBatch.mockResolvedValue(
        new Map([[subjectId, { eligible: true, missing: [] }]]),
      );
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

  describe('Prerequisite override semantics & path agreement', () => {
    it('completed override with no grade allows checkEligibility and enroll to succeed', async () => {
      const realPrereqRepo = {
        getPrerequisitesWithGradesForSubjects: jest.fn().mockResolvedValue(
          new Map([
            [
              subjectId,
              [
                {
                  subject_id: 'pre-1',
                  subject_name: 'Math',
                  grade: null,
                },
              ],
            ],
          ]),
        ),
      };
      const realDb = {
        subjectCompletionOverride: {
          findMany: jest.fn().mockResolvedValue([
            { student_id: studentId, subject_id: 'pre-1', status: 'completed' },
          ]),
        },
      };
      const realPrereqService = new SubjectPrerequisiteService(
        realPrereqRepo as any,
        { findByClassId: jest.fn() } as any,
        realDb as any,
      );

      const realEnrollmentService = new EnrollmentService(repo, realPrereqService, realDb as any);

      // UI batch result
      const batchResult = await realPrereqService.checkEligibilityBatch([subjectId], studentId, orgId);
      const uiVerdict = batchResult.get(subjectId);
      expect(uiVerdict?.eligible).toBe(true);

      // checkEligibility result
      const checkResult = await realEnrollmentService.checkEligibility(subjectId, studentId, orgId);
      expect(checkResult.eligible).toBe(true);

      // enroll() result
      repo.findClassEnrollmentContext.mockResolvedValue({ subject_id: subjectId, school_year_id: 'sy-1', section_id: null });
      repo.findStudentAcademicStructure.mockResolvedValue({ programId: 'prog-1' });
      repo.findDuplicate.mockResolvedValue(null);
      repo.findByStudent.mockResolvedValue(null);
      repo.countActive.mockResolvedValue(0);
      repo.create.mockResolvedValue({ id: 'enr-1', status: 'active' });

      const enrollRes = await realEnrollmentService.enroll(classId, subjectId, semesterId, 30, studentId, orgId);
      expect(enrollRes).toEqual({ id: 'enr-1', status: 'active' });

      // Ensure UI batch result and enroll() result always agree
      expect(uiVerdict?.eligible).toBe(checkResult.eligible);
    });

    it('pending override or no grade blocks checkEligibility and enroll', async () => {
      const realPrereqRepo = {
        getPrerequisitesWithGradesForSubjects: jest.fn().mockResolvedValue(
          new Map([
            [
              subjectId,
              [
                {
                  subject_id: 'pre-1',
                  subject_name: 'Math',
                  grade: null,
                },
              ],
            ],
          ]),
        ),
      };
      // For pending override, DB query filtering for status: 'completed' yields empty array
      const realDbPending = {
        subjectCompletionOverride: {
          findMany: jest.fn().mockImplementation(async ({ where }: any) => {
            if (where.status === 'completed') return [];
            return [{ student_id: studentId, subject_id: 'pre-1', status: 'pending' }];
          }),
        },
      };
      const realPrereqServicePending = new SubjectPrerequisiteService(
        realPrereqRepo as any,
        { findByClassId: jest.fn() } as any,
        realDbPending as any,
      );
      const realEnrollmentServicePending = new EnrollmentService(repo, realPrereqServicePending, realDbPending as any);

      // Pending override -> blocked
      const checkPending = await realEnrollmentServicePending.checkEligibility(subjectId, studentId, orgId);
      expect(checkPending.eligible).toBe(false);
      expect(checkPending.missing[0].reason).toBe('not_taken');

      repo.findClassEnrollmentContext.mockResolvedValue({ subject_id: subjectId, school_year_id: 'sy-1', section_id: null });
      repo.findStudentAcademicStructure.mockResolvedValue({ programId: 'prog-1' });

      await expect(
        realEnrollmentServicePending.enroll(classId, subjectId, semesterId, 30, studentId, orgId),
      ).rejects.toBeInstanceOf(BadRequestException);

      // No override -> blocked
      const realDbNoOverride = {
        subjectCompletionOverride: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };
      const realPrereqServiceNoOverride = new SubjectPrerequisiteService(
        realPrereqRepo as any,
        { findByClassId: jest.fn() } as any,
        realDbNoOverride as any,
      );
      const realEnrollmentServiceNoOverride = new EnrollmentService(repo, realPrereqServiceNoOverride, realDbNoOverride as any);

      const checkNoOverride = await realEnrollmentServiceNoOverride.checkEligibility(subjectId, studentId, orgId);
      expect(checkNoOverride.eligible).toBe(false);

      await expect(
        realEnrollmentServiceNoOverride.enroll(classId, subjectId, semesterId, 30, studentId, orgId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
