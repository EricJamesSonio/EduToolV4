import { NotFoundException } from '@nestjs/common';
import { ExportService } from '../export.service';

describe('ExportService', () => {
  let service: ExportService;
  let gradeRepo: any;

  beforeEach(() => {
    gradeRepo = {
      findClassWithSubject: jest.fn(),
      findTermsBySemester: jest.fn(),
      findGradingSchemeForClass: jest.fn(),
      findByStudent: jest.fn(),
      findSubmissionsForTerm: jest.fn(),
      findManualScores: jest.fn(),
      db: {
        profile: { findFirst: jest.fn() },
        schoolYear: { findFirst: jest.fn() },
        organization: { findFirst: jest.fn() },
        subject: { findFirst: jest.fn() },
      },
    };
    service = new ExportService(gradeRepo);
    jest.clearAllMocks();
  });

  describe('buildClassCsv', () => {
    it('throws NotFound when class missing', async () => {
      gradeRepo.findClassWithSubject.mockResolvedValue(null);
      await expect(service.buildClassCsv('nope', 'org-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('builds CSV with header and student rows', async () => {
      gradeRepo.findClassWithSubject.mockResolvedValue({ id: 'class-1', semester_id: 'sem-1', enrollments: [{ student_id: 'stu-1' }, { student_id: 'stu-2' }] });
      gradeRepo.findTermsBySemester.mockResolvedValue([{ id: 'term-1', name: 'Term 1' }]);
      gradeRepo.findGradingSchemeForClass.mockResolvedValue({ components: [{ name: 'Quiz', type: 'quiz', weight: 50 }, { name: 'Manual', type: 'manual', weight: 50 }] });
      gradeRepo.db.profile.findFirst.mockResolvedValue({ full_name: 'John Doe', metadata: { studentId: 'STU-001' } });
      gradeRepo.findSubmissionsForTerm.mockResolvedValue([]);
      gradeRepo.findManualScores.mockResolvedValue([]);
      gradeRepo.findByStudent.mockResolvedValue(null);

      const csv = await service.buildClassCsv('class-1', 'org-1');
      expect(csv).toContain('"Student ID"');
      expect(csv).toContain('"Full Name"');
      expect(csv).toContain('"Term 1 - Quiz"');
      expect(csv).toContain('"Term 1 - Manual"');
      expect(csv).toContain('"Term 1 - Final Score"');
      // Should have header + 2 student rows = 3 lines
      expect(csv.split('\n')).toHaveLength(3);
      expect(csv).toContain('John Doe');
    });

    it('escapes quotes in CSV', async () => {
      gradeRepo.findClassWithSubject.mockResolvedValue({ id: 'class-1', semester_id: 'sem-1', enrollments: [{ student_id: 'stu-1' }] });
      gradeRepo.findTermsBySemester.mockResolvedValue([]);
      gradeRepo.findGradingSchemeForClass.mockResolvedValue({ components: [] });
      gradeRepo.db.profile.findFirst.mockResolvedValue({ full_name: 'John "Johnny" Doe', metadata: {} });
      const csv = await service.buildClassCsv('class-1', 'org-1');
      expect(csv).toContain('""Johnny""');
    });

    it('includes scores for manual and quiz', async () => {
      gradeRepo.findClassWithSubject.mockResolvedValue({ id: 'class-1', semester_id: 'sem-1', enrollments: [{ student_id: 'stu-1' }] });
      gradeRepo.findTermsBySemester.mockResolvedValue([{ id: 'term-1', name: 'Term 1' }]);
      gradeRepo.findGradingSchemeForClass.mockResolvedValue({ components: [{ name: 'Quiz', type: 'quiz', weight: 100 }] });
      gradeRepo.db.profile.findFirst.mockResolvedValue({ full_name: 'John', metadata: {} });
      gradeRepo.findSubmissionsForTerm.mockResolvedValue([{ student_id: 'stu-1', score: 8, manual_score: null, assessment: { type: 'quiz', total_items: 10 } }]);
      gradeRepo.findManualScores.mockResolvedValue([]);
      gradeRepo.findByStudent.mockResolvedValue({ final_score: 80, final_grade: 'B' });

      const csv = await service.buildClassCsv('class-1', 'org-1');
      expect(csv).toContain('8/10');
      expect(csv).toContain('80');
      expect(csv).toContain('B');
    });
  });

  describe('buildClassCard', () => {
    it('throws NotFound when class missing', async () => {
      gradeRepo.findClassWithSubject.mockResolvedValue(null);
      await expect(service.buildClassCard('nope', 'stu-1', 'org-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFound when student not enrolled', async () => {
      gradeRepo.findClassWithSubject.mockResolvedValue({ id: 'class-1', enrollments: [{ student_id: 'other' }], semester_id: 'sem-1', educator_id: 'edu-1', subject_id: 'subj-1', school_year_id: 'sy-1' });
      await expect(service.buildClassCard('class-1', 'stu-1', 'org-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('builds PDF buffer', async () => {
      gradeRepo.findClassWithSubject.mockResolvedValue({ id: 'class-1', enrollments: [{ student_id: 'stu-1' }], semester_id: 'sem-1', educator_id: 'edu-1', subject_id: 'subj-1', school_year_id: 'sy-1' });
      gradeRepo.findTermsBySemester.mockResolvedValue([{ id: 'term-1', name: 'Term 1' }]);
      gradeRepo.findGradingSchemeForClass.mockResolvedValue({ components: [{ name: 'Quiz', type: 'quiz', weight: 100 }] });
      gradeRepo.db.profile.findFirst
        .mockResolvedValueOnce({ full_name: 'John Doe', metadata: { studentId: 'STU-001' } })
        .mockResolvedValueOnce({ full_name: 'Prof Smith' });
      gradeRepo.db.subject.findFirst.mockResolvedValue({ name: 'Math' });
      gradeRepo.db.schoolYear.findFirst.mockResolvedValue({ name: '2024-2025' });
      gradeRepo.db.organization.findFirst.mockResolvedValue({ name: 'Test School' });
      gradeRepo.findSubmissionsForTerm.mockResolvedValue([]);
      gradeRepo.findManualScores.mockResolvedValue([]);
      gradeRepo.findByStudent.mockResolvedValue(null);

      const buf = await service.buildClassCard('class-1', 'stu-1', 'org-1');
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.length).toBeGreaterThan(100);
      // PDF header
      expect(buf.toString('utf8', 0, 4)).toBe('%PDF');
    });
  });
});
