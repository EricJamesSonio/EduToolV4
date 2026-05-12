import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import type { Subject, SubjectType } from '@/types/admin/subject.types';

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
    strandId: null,
    educatorId: null,
    educatorName: null,
    lockStatus: 'unlocked',
    yearLevel: null,
    termLabel: null,
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
    strandId: null,
    educatorId: null,
    educatorName: null,
    lockStatus: 'unlocked',
    yearLevel: null,
    termLabel: null,
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

    const duplicate = checkDuplicateSubject(formValues, mockSubjects, false, false, 'college');
    
    expect(duplicate).toBeTruthy();
    expect(duplicate?.title).toBe('Mathematics');
  });
});
