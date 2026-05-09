/**
 * Standardized Query Key Factory for React Query
 * 
 * This provides a consistent pattern for creating query keys across all hooks,
 * enabling proper cache management and targeted invalidation.
 */

export const createQueryKeys = (entity: string) => ({
  all: [entity] as const,
  lists: () => [...createQueryKeys(entity).all, 'list'] as const,
  list: (filters: any = {}) => [...createQueryKeys(entity).lists(), filters] as const,
  details: () => [...createQueryKeys(entity).all, 'detail'] as const,
  detail: (id: string) => [...createQueryKeys(entity).details(), id] as const,
});

// Entity-specific query keys
export const studentKeys = createQueryKeys('students');
export const classKeys = createQueryKeys('classes');
export const assessmentKeys = createQueryKeys('assessments');
export const lessonKeys = createQueryKeys('lessons');
export const educatorKeys = createQueryKeys('educators');
export const courseKeys = createQueryKeys('courses');
export const subjectKeys = createQueryKeys('subjects');
export const gradeLockKeys = createQueryKeys('gradeLock');
export const submissionKeys = createQueryKeys('submissions');

// Specialized keys for complex entities
export const enrollmentKeys = {
  all: ['enrollments'] as const,
  byClass: (classId: string) => [...enrollmentKeys.all, 'class', classId] as const,
  byStudent: (studentId: string) => [...enrollmentKeys.all, 'student', studentId] as const,
};

export const gradeKeys = {
  all: ['grades'] as const,
  byClass: (classId: string) => [...gradeKeys.all, 'class', classId] as const,
  byStudent: (studentId: string) => [...gradeKeys.all, 'student', studentId] as const,
  byAssessment: (assessmentId: string) => [...gradeKeys.all, 'assessment', assessmentId] as const,
};

export const academicKeys = {
  all: ['academic'] as const,
  schoolYears: () => [...academicKeys.all, 'schoolYears'] as const,
  schoolYear: (id: string) => [...academicKeys.schoolYears(), id] as const,
  semesters: () => [...academicKeys.all, 'semesters'] as const,
  semester: (id: string) => [...academicKeys.semesters(), id] as const,
  programs: () => [...academicKeys.all, 'programs'] as const,
  program: (id: string) => [...academicKeys.programs(), id] as const,
};
