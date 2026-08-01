import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../analytics.service';
import { AnalyticsRepository } from '../analytics.repository';
import { NotFoundException } from '@nestjs/common';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let repo: jest.Mocked<AnalyticsRepository>;

  const mockRepo = {
    getActiveSchoolYear: jest.fn(),
    countStudents: jest.fn(),
    countPendingStudents: jest.fn(),
    countEducators: jest.fn(),
    countClasses: jest.fn(),
    getEnrollmentBreakdown: jest.fn(),
    getLockedGrades: jest.fn(),
    getEducatorLoad: jest.fn(),
    countUnlockedClasses: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: AnalyticsRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    repo = module.get(AnalyticsRepository);
    jest.clearAllMocks();
  });

  // ── resolveSchoolYear behavior (indirectly tested) ───────────────

  it('should use provided schoolYearId', async () => {
    repo.countStudents.mockResolvedValue(10);
    repo.countPendingStudents.mockResolvedValue(2);
    repo.countEducators.mockResolvedValue(5);
    repo.countClasses.mockResolvedValue(3);

    const result = await service.getOverview('org1', 'sy1');

    expect(result.schoolYearId).toBe('sy1');
  });

  it('should fallback to active school year', async () => {
    repo.getActiveSchoolYear.mockResolvedValue({ id: 'active-sy' });

    repo.countStudents.mockResolvedValue(10);
    repo.countPendingStudents.mockResolvedValue(2);
    repo.countEducators.mockResolvedValue(5);
    repo.countClasses.mockResolvedValue(3);

    const result = await service.getOverview('org1');

    expect(repo.getActiveSchoolYear).toHaveBeenCalled();
    expect(result.schoolYearId).toBe('active-sy');
  });

  it('should throw if no active school year', async () => {
    repo.getActiveSchoolYear.mockResolvedValue(null);

    await expect(service.getOverview('org1')).rejects.toThrow(
      NotFoundException,
    );
  });

  // ── getOverview ───────────────────────────────────

  it('should return overview metrics', async () => {
    repo.countStudents.mockResolvedValue(100);
    repo.countPendingStudents.mockResolvedValue(10);
    repo.countEducators.mockResolvedValue(20);
    repo.countClasses.mockResolvedValue(5);

    const result = await service.getOverview('org1', 'sy1');

    expect(result).toEqual({
      totalStudents: 100,
      pendingStudents: 10,
      totalEducators: 20,
      totalClasses: 5,
      schoolYearId: 'sy1',
    });
  });

  // ── getEnrollmentBreakdown ────────────────────────

  it('should return enrollment breakdown', async () => {
    repo.getEnrollmentBreakdown.mockResolvedValue({
      data: [
        {
          levelSection: 'Grade 1 - A',
          programName: 'Kinder',
          gradeLevel: 'Grade 1',
          sectionName: 'A',
          activeCount: 40,
          pendingCount: 2,
          totalCount: 42,
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const result = await service.getEnrollmentBreakdown('org1', 'sy1');

    expect(repo.getEnrollmentBreakdown).toHaveBeenCalledWith('org1', 'sy1', 1, 20);
    expect(result.meta.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].levelSection).toBe('Grade 1 - A');
  });

  // ── getGradeAnalytics ─────────────────────────────

  it('should return empty analytics if no grades', async () => {
    repo.getLockedGrades.mockResolvedValue([]);

    const result = await service.getGradeAnalytics('org1', {} as any, 'sy1');

    expect(result).toEqual({
      passingRate: 0,
      distribution: {},
    });
  });

  it('should calculate passing rate and distribution', async () => {
    repo.getLockedGrades.mockResolvedValue([
      { final_score: 80, final_grade: 'A' },
      { final_score: 70, final_grade: 'B' },
      { final_score: 90, final_grade: 'A' },
    ]);

    const result = await service.getGradeAnalytics('org1', {} as any, 'sy1');

    expect(result.passingRate).toBeCloseTo(2 / 3);
    expect(result.distribution).toEqual({
      A: 2,
      B: 1,
    });
  });

  // ── getEducatorLoad ───────────────────────────────

  it('should return educator load', async () => {
    repo.getEducatorLoad.mockResolvedValue([{ educatorId: 'e1', load: 3 }]);

    const result = await service.getEducatorLoad('org1', 'sy1');

    expect(result).toEqual([{ educatorId: 'e1', load: 3 }]);
  });

  // ── getAlerts ─────────────────────────────────────

  it('should return alerts', async () => {
    repo.countPendingStudents.mockResolvedValue(5);
    repo.countUnlockedClasses.mockResolvedValue(2);

    const result = await service.getAlerts('org1', 'sy1');

    expect(result).toEqual({
      pendingStudents: 5,
      unlockedClasses: 2,
    });
  });
});