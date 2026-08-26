import type { QueryFilters } from './types';

const studentKeys = {
  all: ['student'] as const,
} as const;

export const studentQueryKeys = {
  ...studentKeys,

  assessments: {
    all: [...studentKeys.all, 'assessments'] as const,
    list: (classId: string, filters?: QueryFilters) =>
      [...studentKeys.all, 'assessments', 'list', classId, filters] as const,
    detail: (assessmentId: string) =>
      [...studentKeys.all, 'assessments', 'detail', assessmentId] as const,
    result: (assessmentId: string) =>
      [...studentKeys.all, 'assessments', 'detail', assessmentId, 'result'] as const,
  },

  attendance: {
    all: [...studentKeys.all, 'attendance'] as const,
    list: (classId: string, filters?: QueryFilters) =>
      [...studentKeys.all, 'attendance', 'list', classId, filters] as const,
  },

  classes: {
    all: [...studentKeys.all, 'classes'] as const,
    list: (filters?: QueryFilters) =>
      [...studentKeys.all, 'classes', 'list', filters] as const,
    detail: (classId: string) =>
      [...studentKeys.all, 'classes', 'detail', classId] as const,
  },

  gradeLock: {
    all: [...studentKeys.all, 'gradeLock'] as const,
    list: (classId: string) =>
      [...studentKeys.all, 'gradeLock', 'list', classId] as const,
  },

  grades: {
    all: [...studentKeys.all, 'grades'] as const,
    list: (classId: string, filters?: QueryFilters) =>
      [...studentKeys.all, 'grades', 'list', classId, filters] as const,
  },

  concerns: {
    all: [...studentKeys.all, 'concerns'] as const,
    categories: () =>
      [...studentKeys.all, 'concerns', 'categories'] as const,
    mine: (filters?: QueryFilters) =>
      [...studentKeys.all, 'concerns', 'mine', filters] as const,
    detail: (concernId: string) =>
      [...studentKeys.all, 'concerns', 'detail', concernId] as const,
  },

  lessons: {
    all: [...studentKeys.all, 'lessons'] as const,
    list: (classId: string, filters?: QueryFilters) =>
      [...studentKeys.all, 'lessons', 'list', classId, filters] as const,
    detail: (lessonId: string) =>
      [...studentKeys.all, 'lessons', 'detail', lessonId] as const,
  },

  meetings: {
    all: [...studentKeys.all, 'meetings'] as const,
    list: (filters?: QueryFilters) =>
      [...studentKeys.all, 'meetings', 'list', filters] as const,
    detail: (meetingId: string) =>
      [...studentKeys.all, 'meetings', 'detail', meetingId] as const,
  },

  notifications: {
    all: [...studentKeys.all, 'notifications'] as const,
    list: (filters?: QueryFilters) =>
      [...studentKeys.all, 'notifications', 'list', filters] as const,
  },

  semesters: {
    all: [...studentKeys.all, 'semesters'] as const,
    list: (filters?: QueryFilters) =>
      [...studentKeys.all, 'semesters', 'list', filters] as const,
  },

  submissions: {
    all: [...studentKeys.all, 'submissions'] as const,
    list: (assessmentId: string, filters?: QueryFilters) =>
      [...studentKeys.all, 'submissions', 'list', assessmentId, filters] as const,
    detail: (submissionId: string) =>
      [...studentKeys.all, 'submissions', 'detail', submissionId] as const,
  },

  transcript: {
    all: [...studentKeys.all, 'transcript'] as const,
    detail: () => [...studentKeys.all, 'transcript', 'detail'] as const,
  },

  academicHistory: {
    all: [...studentKeys.all, 'academicHistory'] as const,
    full: () => [...studentKeys.all, 'academicHistory', 'full'] as const,
    timeline: (params?: { schoolYearId?: string; sort?: 'asc' | 'desc' }) =>
      [...studentKeys.all, 'academicHistory', 'timeline', params ?? null] as const,
  },
} as const;
