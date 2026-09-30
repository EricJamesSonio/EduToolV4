import 'reflect-metadata';
import { validate } from 'class-validator';
import {
  ASSESSMENT_TYPE_VALUES,
  AssessmentComponentType,
  ComponentType,
} from '../constants/assessment-type.constants';
import {
  ComponentType as DtoComponentType,
  GradingSchemeComponentDto,
} from '../dto/grading-scheme.dto';
import { ASSESSMENT_TYPES } from '@/modules/assessment/dto/assessment.dto';

// TICK-ASSESS-001: pins the single source of truth so the
// assignment/participation/behavior omission cannot silently recur.
describe('assessment-type constants (TICK-ASSESS-001)', () => {
  const EXPECTED_14 = [
    'written_work',
    'performance_task',
    'quarterly_assessment',
    'exam',
    'quiz',
    'assignment',
    'project',
    'recitation',
    'participation',
    'behavior',
    'attendance',
    'activity',
    'custom',
    'other',
  ];

  it('canonical list holds all 14 types including assignment/participation/behavior', () => {
    expect([...ASSESSMENT_TYPE_VALUES].sort()).toEqual([...EXPECTED_14].sort());
    expect(ASSESSMENT_TYPE_VALUES).toHaveLength(14);
  });

  it('ComponentType enum values exactly match the canonical list', () => {
    expect(Object.values(ComponentType).sort()).toEqual(
      [...ASSESSMENT_TYPE_VALUES].sort(),
    );
  });

  it('grading-scheme DTO re-exports the canonical enum (no parallel declaration)', () => {
    expect(DtoComponentType).toBe(ComponentType);
  });

  it('assessment DTO ASSESSMENT_TYPES is the canonical list', () => {
    expect(ASSESSMENT_TYPES).toBe(ASSESSMENT_TYPE_VALUES);
    expect([...ASSESSMENT_TYPES].sort()).toEqual([...EXPECTED_14].sort());
  });

  it.each([['assignment'], ['participation'], ['behavior']])(
    'GradingSchemeComponentDto accepts type "%s"',
    async (type) => {
      const dto = new GradingSchemeComponentDto();
      dto.name = 'Test';
      dto.type = type as AssessmentComponentType as DtoComponentType;
      dto.weight = 10;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    },
  );
});

