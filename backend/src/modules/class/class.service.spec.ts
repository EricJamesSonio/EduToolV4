import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ClassService } from './class.service';
import { ClassRepository } from './class.repository';

const mockRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  replaceSchedules: jest.fn(),
  findEducatorSchedules: jest.fn(),
  findSectionSchedules: jest.fn(),
  createEnrollment: jest.fn(),
  findEnrollments: jest.fn(),
  findEnrollmentById: jest.fn(),
  findEnrollmentByStudent: jest.fn(),
  findDuplicateEnrollment: jest.fn(),
  countActiveEnrollments: jest.fn(),
  updateEnrollmentStatus: jest.fn(),
  findActiveClassesByEducator: jest.fn(),
  hasActiveEnrollments: jest.fn(),
};

const ORG_ID = 'org-1';
const CLASS_ID = 'class-1';

const mockClass = {
  id: CLASS_ID,
  org_id: ORG_ID,
  subject_id: 'subj-1',
  educator_id: 'edu-1',
  section_id: null,
  school_year_id: 'sy-1',
  semester_id: 'sem-1',
  capacity: 30,
  created_at: new Date(),
  deleted_at: null,
  schedules: [],
};

const baseDto = {
  subjectId: 'subj-1',
  educatorId: 'edu-1',
  schoolYearId: 'sy-1',
  semesterId: 'sem-1',
  capacity: 30,
  schedules: [{ weekday: 1, startTime: '08:00', endTime: '09:00' }],
};

describe('ClassService', () => {
  let service: ClassService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassService,
        { provide: ClassRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ClassService>(ClassService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('creates class with no conflicts', async () => {
      mockRepo.findEducatorSchedules.mockResolvedValue([]);
      mockRepo.create.mockResolvedValue(mockClass);
      mockRepo.replaceSchedules.mockResolvedValue([]);
      mockRepo.findById.mockResolvedValue(mockClass);

      const result = await service.create(ORG_ID, baseDto);
      expect(result).toEqual(mockClass);
    });

    it('throws ConflictException on educator time conflict', async () => {
      mockRepo.findEducatorSchedules.mockResolvedValue([
        {
          class_id: 'other-class',
          weekday: 1,
          start_time: new Date('2000-01-01T07:30:00'),
          end_time: new Date('2000-01-01T08:30:00'),
          class: mockClass,
        },
      ]);

      await expect(service.create(ORG_ID, baseDto)).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when startTime >= endTime', async () => {
      await expect(
        service.create(ORG_ID, {
          ...baseDto,
          schedules: [{ weekday: 1, startTime: '09:00', endTime: '08:00' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── findById ────────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('returns class when found', async () => {
      mockRepo.findById.mockResolvedValue(mockClass);
      const result = await service.findById(CLASS_ID, ORG_ID);
      expect(result).toEqual(mockClass);
    });

    it('throws NotFoundException when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findById('bad', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ── archive ─────────────────────────────────────────────────────────────────

  describe('archive()', () => {
    it('soft deletes the class', async () => {
      mockRepo.findById.mockResolvedValue(mockClass);
      mockRepo.softDelete.mockResolvedValue({ ...mockClass, deleted_at: new Date() });

      await expect(service.archive(CLASS_ID, ORG_ID)).resolves.not.toThrow();
    });

    it('throws NotFoundException for unknown class', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.archive('bad', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ── enrollStudent ────────────────────────────────────────────────────────────

  describe('enrollStudent()', () => {
    it('enrolls student successfully', async () => {
      const enrollment = { id: 'enr-1', class_id: CLASS_ID, student_id: 'stu-1', status: 'active' };
      mockRepo.findById.mockResolvedValue(mockClass);
      mockRepo.findDuplicateEnrollment.mockResolvedValue(null);
      mockRepo.findEnrollmentByStudent.mockResolvedValue(null);
      mockRepo.countActiveEnrollments.mockResolvedValue(0);
      mockRepo.createEnrollment.mockResolvedValue(enrollment);

      const result = await service.enrollStudent(CLASS_ID, ORG_ID, { studentId: 'stu-1' });
      expect(result).toEqual(enrollment);
    });

    it('returns overflow signal when class is full', async () => {
      mockRepo.findById.mockResolvedValue(mockClass); // capacity 30
      mockRepo.findDuplicateEnrollment.mockResolvedValue(null);
      mockRepo.findEnrollmentByStudent.mockResolvedValue(null);
      mockRepo.countActiveEnrollments.mockResolvedValue(30); // at capacity

      const result = await service.enrollStudent(CLASS_ID, ORG_ID, { studentId: 'stu-1' }) as any;
      expect(result.overflow).toBe(true);
    });

    it('throws ConflictException on duplicate enrollment', async () => {
      mockRepo.findById.mockResolvedValue(mockClass);
      mockRepo.findDuplicateEnrollment.mockResolvedValue({ id: 'existing' });

      await expect(
        service.enrollStudent(CLASS_ID, ORG_ID, { studentId: 'stu-1' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── reassignEducator ─────────────────────────────────────────────────────────

  describe('reassignEducator()', () => {
    it('reassigns educator with no conflicts', async () => {
      mockRepo.findById.mockResolvedValue({ ...mockClass, schedules: [] });
      mockRepo.findEducatorSchedules.mockResolvedValue([]);
      mockRepo.update.mockResolvedValue({ ...mockClass, educator_id: 'edu-2' });

      const result = await service.reassignEducator(CLASS_ID, ORG_ID, {
        educatorId: 'edu-2',
        reason: 'Maternity leave',
      });

      expect(result.educator_id).toBe('edu-2');
    });

    it('throws BadRequestException if same educator', async () => {
      mockRepo.findById.mockResolvedValue(mockClass); // educator_id = 'edu-1'

      await expect(
        service.reassignEducator(CLASS_ID, ORG_ID, { educatorId: 'edu-1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});