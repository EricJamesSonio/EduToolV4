import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AssessmentCoreService } from '../core/assessment-core.service';

describe('AssessmentCoreService', () => {
  let service: AssessmentCoreService;

  const repo = {
    findById: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AssessmentCoreService(repo as any);
  });

  describe('findAssessmentOrThrow', () => {
    it('throws when assessment does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.findAssessmentOrThrow('assessment-1', 'org-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns assessment when found', async () => {
      const assessment = { id: 'a1' };

      repo.findById.mockResolvedValue(assessment);

      await expect(
        service.findAssessmentOrThrow('a1', 'org1'),
      ).resolves.toEqual(assessment);
    });
  });

  describe('assertBelongsToClass', () => {
    it('throws when assessment belongs to another class', () => {
      expect(() =>
        service.assertBelongsToClass(
          { class_id: 'class-a' },
          'class-b',
        ),
      ).toThrow(ForbiddenException);
    });

    it('allows matching class', () => {
      expect(() =>
        service.assertBelongsToClass(
          { class_id: 'class-a' },
          'class-a',
        ),
      ).not.toThrow();
    });
  });

  describe('release/editability rules', () => {
    it('is released when release date is in the past', () => {
      const assessment = {
        release_date: new Date(Date.now() - 1000),
      };

      expect(service.isReleased(assessment)).toBe(true);
    });

    it('is not released when release date is in the future', () => {
      const assessment = {
        release_date: new Date(Date.now() + 100000),
      };

      expect(service.isReleased(assessment)).toBe(false);
    });

    it('is not editable after release date', () => {
      const assessment = {
        release_date: new Date(Date.now() - 1000),
      };

      expect(service.isEditable(assessment)).toBe(false);
    });
  });

  describe('canViewScore', () => {
    it('prevents score viewing before publication', () => {
      expect(
        service.canViewScore(
          { is_published: false },
          false,
        ),
      ).toBe(false);
    });

    it('allows viewing when grade lock enabled', () => {
      expect(
        service.canViewScore(
          { is_published: false },
          true,
        ),
      ).toBe(true);
    });
  });

  describe('buildResultWithSections', () => {
    it('defaults null scores to zero', () => {
      const result = service.buildResultWithSections(
        {},
        {},
      );

      expect(result).toEqual({
        systemScore: 0,
        manualScore: 0,
        totalScore: 0,
        manualMaxScore: null,
      });
    });

    it('calculates combined score correctly', () => {
      const result = service.buildResultWithSections(
        {
          system_section_score: 15,
          manual_section_score: 10,
        },
        {
          manual_max_score: 20,
        },
      );

      expect(result).toEqual({
        systemScore: 15,
        manualScore: 10,
        totalScore: 25,
        manualMaxScore: 20,
      });
    });
  });

  describe('buildResult', () => {
    it('hides review and score when grades are not visible', () => {
      const result = service.buildResult(
        {
          status: 'submitted',
          submitted_at: '2025-01-01',
          score: 10,
        },
        {
          is_published: false,
          total_items: 20,
        },
        false,
        [
          {
            id: 'q1',
            question_text: 'Question',
          },
        ],
        [],
      );

      expect(result.score).toBeNull();
      expect(result.questions).toBeUndefined();
    });

    it('includes hybrid section scores for hybrid assessments', () => {
      const result = service.buildResult(
        {
          status: 'graded',
          submitted_at: '2025-01-01',
          system_section_score: 15,
          manual_section_score: 5,
          manual_score: 20,
        },
        {
          is_published: true,
          total_items: 20,
          grading_mode: 'hybrid',
          manual_max_score: 10,
        },
        false,
      );

      expect(result.systemScore).toBe(15);
      expect(result.manualScore).toBe(5);
      expect(result.manualMaxScore).toBe(10);
      expect(result.score).toBe(20);
    });
  });
});