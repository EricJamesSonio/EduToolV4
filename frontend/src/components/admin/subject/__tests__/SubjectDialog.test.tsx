import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import type { Subject, SubjectType } from '@/types/admin/subject.types';
import { buildSubjectPayload, toWeeklySessionDraft, applyWeeklySessionDraft } from '@/components/admin/subject/SubjectDialog';

// Mock data for testing
const mockSubjects: Subject[] = [
  {
    id: '1',
    orgId: 'org1',
    title: 'Mathematics',
    subjectType: 'major' as SubjectType,
    programId: 'prog1',
    programName: 'BS Computer Science',
    programType: 'college',
    realProgramId: 'prog1',
    levelId: 'level1',
    levelName: 'First Year',
    courseId: 'course1',
    courseName: 'BS Computer Science',
    strandId: null,
    strandName: null,
    educatorId: null,
    educatorName: null,
    lockStatus: 'unlocked',
    yearLevel: null,
    termLabel: null,
    sessionsPerWeek: null,
    sessionMinutes: null,
    sessionDurations: [],
    effectiveSessionsPerWeek: 2,
    effectiveSessionMinutes: 90,
    effectiveSessionDurations: [90, 90],
    sessionRequirementSource: 'default',
    prerequisites: [],
    prereqFor: [],
    sharings: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    orgId: 'org1',
    title: 'Physics',
    subjectType: 'minor' as SubjectType,
    programId: 'prog1',
    programName: 'BS Computer Science',
    programType: 'college',
    realProgramId: 'prog1',
    levelId: 'level1',
    levelName: 'First Year',
    courseId: null,
    courseName: null,
    strandId: null,
    strandName: null,
    educatorId: null,
    educatorName: null,
    lockStatus: 'unlocked',
    yearLevel: null,
    termLabel: null,
    sessionsPerWeek: null,
    sessionMinutes: null,
    sessionDurations: [],
    effectiveSessionsPerWeek: 2,
    effectiveSessionMinutes: 90,
    effectiveSessionDurations: [90, 90],
    sessionRequirementSource: 'default',
    prerequisites: [],
    prereqFor: [],
    sharings: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

// Test the duplicate checking logic
describe('SubjectDialog Duplicate Validation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const checkDuplicateSubject = (
    values: any,
    allSubjects: Subject[],
    isEdit: boolean = false,
    isMinor: boolean = false,
    programType: string = 'college'
  ): Subject | null => {
    if (isEdit) return null;
    
    return allSubjects.find(existingSubject => {
      const nameMatch = existingSubject.title.toLowerCase() === values.name.toLowerCase().trim();
      const typeMatch = existingSubject.subjectType === values.subjectType;
      const programMatch = existingSubject.programId === values.programId;
      
      // For minor subjects, check level match (if level is specified)
      const levelMatch = isMinor 
        ? (values.levelId ? existingSubject.levelId === values.levelId : true)
        : existingSubject.levelId === values.levelId;
      
      // For major subjects, check course/strand match
      const courseStrandMatch = !isMinor && programType === 'college'
        ? existingSubject.courseId === values.courseId
        : !isMinor && programType === 'shs'
        ? existingSubject.strandId === values.strandId
        : true;
      
      return nameMatch && typeMatch && programMatch && levelMatch && courseStrandMatch;
    }) || null;
  };

  test('should detect duplicate major subject with same name, program, level, and course', () => {
    const formValues = {
      name: 'Mathematics',
      subjectType: 'major' as SubjectType,
      programId: 'prog1',
      levelId: 'level1',
      courseId: 'course1',
      strandId: '',
    };

    const duplicate = checkDuplicateSubject(formValues, mockSubjects, false, false, 'college');
    
    expect(duplicate).toBeTruthy();
    expect(duplicate?.title).toBe('Mathematics');
    expect(duplicate?.subjectType).toBe('major');
  });

  test('should detect duplicate minor subject with same name, program, and level', () => {
    const formValues = {
      name: 'Physics',
      subjectType: 'minor' as SubjectType,
      programId: 'prog1',
      levelId: 'level1',
      courseId: '',
      strandId: '',
    };

    const duplicate = checkDuplicateSubject(formValues, mockSubjects, false, true, 'college');
    
    expect(duplicate).toBeTruthy();
    expect(duplicate?.title).toBe('Physics');
    expect(duplicate?.subjectType).toBe('minor');
  });

  test('should not detect duplicate when name is different', () => {
    const formValues = {
      name: 'Chemistry',
      subjectType: 'major' as SubjectType,
      programId: 'prog1',
      levelId: 'level1',
      courseId: 'course1',
      strandId: '',
    };

    const duplicate = checkDuplicateSubject(formValues, mockSubjects, false, false, 'college');
    
    expect(duplicate).toBeFalsy();
  });

  test('should not detect duplicate when program is different', () => {
    const formValues = {
      name: 'Mathematics',
      subjectType: 'major' as SubjectType,
      programId: 'prog2',
      levelId: 'level1',
      courseId: 'course1',
      strandId: '',
    };

    const duplicate = checkDuplicateSubject(formValues, mockSubjects, false, false, 'college');
    
    expect(duplicate).toBeFalsy();
  });

  test('should not detect duplicate when subject type is different', () => {
    const formValues = {
      name: 'Mathematics',
      subjectType: 'minor' as SubjectType,
      programId: 'prog1',
      levelId: 'level1',
      courseId: '',
      strandId: '',
    };

    const duplicate = checkDuplicateSubject(formValues, mockSubjects, false, true, 'college');
    
    expect(duplicate).toBeFalsy();
  });

  test('should not detect duplicate for edit mode', () => {
    const formValues = {
      name: 'Mathematics',
      subjectType: 'major' as SubjectType,
      programId: 'prog1',
      levelId: 'level1',
      courseId: 'course1',
      strandId: '',
    };

    const duplicate = checkDuplicateSubject(formValues, mockSubjects, true, false, 'college');
    
    expect(duplicate).toBeFalsy();
  });

  test('should be case insensitive when checking names', () => {
    const formValues = {
      name: 'mathematics',
      subjectType: 'major' as SubjectType,
      programId: 'prog1',
      levelId: 'level1',
      courseId: 'course1',
      strandId: '',
    };

    const duplicate = checkDuplicateSubject(formValues, mockSubjects, false, true, 'college');
    
    expect(duplicate).toBeTruthy();
    expect(duplicate?.title).toBe('Mathematics');
  });
});

describe('buildSubjectPayload name handling', () => {
  const baseValues = {
    name: 'CS Thesis / Capstone Project',
    programId: 'prog1',
    levelId: 'level1',
    courseId: 'course1',
    strandId: '',
    subjectType: 'major' as SubjectType,
    sessionsPerWeek: '1',
    sessionDurations: [] as number[],
  };
  const legacySubject = {
    ...mockSubjects[0],
    title: 'CS Thesis / Capstone Project',
  };

  test('omits an unchanged legacy name so the name rule cannot 400 the save', () => {
    const payload = buildSubjectPayload(baseValues, legacySubject);
    expect(payload).not.toHaveProperty('name');
    expect(payload.sessionsPerWeek).toBe(1);
    expect(payload.sessionMinutes).toBeNull();
    expect(payload.sessionDurations).toEqual([]);
  });

  test('sends an actual rename for validation', () => {
    const payload = buildSubjectPayload(
      { ...baseValues, name: 'CS Thesis 2' },
      legacySubject,
    );
    expect(payload).toHaveProperty('name', 'CS Thesis 2');
  });

  test('always sends the name on create', () => {
    const payload = buildSubjectPayload(baseValues, undefined);
    expect(payload).toHaveProperty('name', 'CS Thesis / Capstone Project');
  });

  test('sends one entry per session when the lengths differ', () => {
    const payload = buildSubjectPayload(
      { ...baseValues, sessionsPerWeek: '3', sessionDurations: [60, 90, 120] },
      legacySubject,
    );
    expect(payload.sessionDurations).toEqual([60, 90, 120]);
    expect(payload.sessionsPerWeek).toBe(3);
    // sessionMinutes stays the BASE for the existing consumers.
    expect(payload.sessionMinutes).toBe(60);
  });

  test('keeps a uniform list so every session keeps its length', () => {
    const payload = buildSubjectPayload(
      { ...baseValues, sessionsPerWeek: '3', sessionDurations: [90, 90, 90] },
      legacySubject,
    );
    expect(payload.sessionDurations).toEqual([90, 90, 90]);
    expect(payload.sessionMinutes).toBe(90);
  });
});

describe('weekly session draft round-trip', () => {
  const standard = { sessionsPerWeek: '', sessionDurations: [] as number[] };

  test('an untouched draft stays on the department standard', () => {
    // The bug this ticket fixes: opening a default subject and saving must NOT
    // silently freeze today's standard onto it.
    const draft = toWeeklySessionDraft(standard, [60, 60, 60, 60, 60], null);
    expect(draft.touched).toBe(false);
    const applied = applyWeeklySessionDraft(draft, 5, 60);
    expect(applied).toEqual({ sessionsPerWeek: '', sessionDurations: [] });
  });

  test('a draft matching the standard still resolves back to the default', () => {
    const draft = toWeeklySessionDraft(standard, [60, 60, 60], null);
    const applied = applyWeeklySessionDraft(draft, 3, 60);
    expect(applied.sessionsPerWeek).toBe('');
    expect(applied.sessionDurations).toEqual([]);
  });

  test('TOUCHING the control makes it explicit even at standard values', () => {
    // Picking "3 per week" where the standard is already 3 is a deliberate
    // choice. Values alone cannot express that, so `touched` carries it.
    const draft = toWeeklySessionDraft(standard, [60, 60, 60], null);
    const applied = applyWeeklySessionDraft(
      { ...draft, sessionsPerWeek: '3', touched: true },
      3,
      60,
    );
    expect(applied.sessionsPerWeek).toBe('3');
    expect(applied.sessionDurations).toEqual([60, 60, 60]);
  });

  test('a custom count becomes explicit', () => {
    // `touched: true` is what the section's own handler sets on a pick.
    const draft = toWeeklySessionDraft(standard, [60, 60, 60], null);
    const custom = { ...draft, sessionsPerWeek: '3', touched: true };
    const applied = applyWeeklySessionDraft(custom, 3, 60);
    expect(applied.sessionsPerWeek).toBe('3');
    expect(applied.sessionDurations).toEqual([60, 60, 60]);
  });

  test('a custom length becomes explicit', () => {
    const draft = toWeeklySessionDraft(standard, [60, 60, 60], null);
    const custom = { ...draft, sessionDurations: [60, 60, 90], touched: true };
    const applied = applyWeeklySessionDraft(custom, 3, 60);
    expect(applied.sessionsPerWeek).toBe('3');
    expect(applied.sessionDurations).toEqual([60, 60, 90]);
  });

  test('switching back to the standard clears the explicit values', () => {
    const draft = toWeeklySessionDraft(
      { sessionsPerWeek: '3', sessionDurations: [60, 60, 90] },
      [60, 60, 90],
      null,
    );
    const back = { ...draft, sessionsPerWeek: '', sessionDurations: [], touched: false };
    expect(applyWeeklySessionDraft(back, 5, 60)).toEqual({
      sessionsPerWeek: '',
      sessionDurations: [],
    });
  });

  test('stored per-session lengths are read back into the draft', () => {
    const draft = toWeeklySessionDraft(
      { sessionsPerWeek: '3', sessionDurations: [60, 90, 120] },
      [60, 90, 120],
      null,
    );
    expect(draft.sessionDurations).toEqual([60, 90, 120]);
    expect(draft.uniformMinutes).toBeNull(); // mixed, so not uniform
    expect(draft.touched).toBe(true); // already explicit on the subject
  });

  test('a uniform stored list reports a uniform draft', () => {
    const draft = toWeeklySessionDraft(
      { sessionsPerWeek: '2', sessionDurations: [60, 60] },
      [60, 60],
      null,
    );
    expect(draft.uniformMinutes).toBe(60);
  });
});
