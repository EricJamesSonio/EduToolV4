import type { QueryFilters } from './types';

const educatorKeys = {
  all: ['educator'] as const,
} as const;

export const educatorQueryKeys = {
  ...educatorKeys,

  activityLog: {
    all: [...educatorKeys.all, 'activityLog'] as const,
    list: (filters?: QueryFilters) =>
      [...educatorKeys.all, 'activityLog', 'list', filters] as const,
  },

  assessments: {
    all: [...educatorKeys.all, 'assessments'] as const,
    list: (classId: string, filters?: QueryFilters) =>
      [...educatorKeys.all, 'assessments', 'list', classId, filters] as const,
    detail: (assessmentId: string) =>
      [...educatorKeys.all, 'assessments', 'detail', assessmentId] as const,
    submissions: (assessmentId: string, filters?: QueryFilters) =>
      [
        ...educatorKeys.all,
        'assessments',
        'detail',
        assessmentId,
        'submissions',
        filters,
      ] as const,
  },

  attendance: {
    all: [...educatorKeys.all, 'attendance'] as const,
    list: (classId: string, filters?: QueryFilters) =>
      [...educatorKeys.all, 'attendance', 'list', classId, filters] as const,
    session: (sessionId: string) =>
      [...educatorKeys.all, 'attendance', 'session', sessionId] as const,
  },

  classes: {
    all: [...educatorKeys.all, 'classes'] as const,
    list: (filters?: QueryFilters) =>
      [...educatorKeys.all, 'classes', 'list', filters] as const,
    detail: (classId: string) =>
      [...educatorKeys.all, 'classes', 'detail', classId] as const,
    students: (classId: string) =>
      [...educatorKeys.all, 'classes', 'detail', classId, 'students'] as const,
  },

  gradeLock: {
    all: [...educatorKeys.all, 'gradeLock'] as const,
    list: (classId: string) =>
      [...educatorKeys.all, 'gradeLock', 'list', classId] as const,
  },

  gradeTermOptions: {
    all: [...educatorKeys.all, 'gradeTermOptions'] as const,
    detail: (classId: string) =>
      [...educatorKeys.all, 'gradeTermOptions', 'detail', classId] as const,
  },

  grades: {
    all: [...educatorKeys.all, 'grades'] as const,
    list: (classId: string, termId: string, filters?: QueryFilters) =>
      [...educatorKeys.all, 'grades', 'list', classId, termId, filters] as const,
    detail: (gradeId: string) =>
      [...educatorKeys.all, 'grades', 'detail', gradeId] as const,
  },

  gradingScale: {
    all: [...educatorKeys.all, 'gradingScale'] as const,
    detail: (classId: string) =>
      [...educatorKeys.all, 'gradingScale', 'detail', classId] as const,
  },

  gradingSchemes: {
    all: [...educatorKeys.all, 'gradingSchemes'] as const,
    detail: (classId: string) =>
      [...educatorKeys.all, 'gradingSchemes', 'detail', classId] as const,
  },

  gradingSchemeTemplates: {
    all: [...educatorKeys.all, 'gradingSchemeTemplates'] as const,
    list: (programType?: string) =>
      [...educatorKeys.all, 'gradingSchemeTemplates', 'list', programType] as const,
    detail: (templateId: string) =>
      [...educatorKeys.all, 'gradingSchemeTemplates', 'detail', templateId] as const,
  },

  lessons: {
    all: [...educatorKeys.all, 'lessons'] as const,
    list: (classId: string, filters?: QueryFilters) =>
      [...educatorKeys.all, 'lessons', 'list', classId, filters] as const,
    detail: (lessonId: string) =>
      [...educatorKeys.all, 'lessons', 'detail', lessonId] as const,
    weekStructure: (classId: string) =>
      [...educatorKeys.all, 'lessons', 'weekStructure', classId] as const,
  },

  meetings: {
    all: [...educatorKeys.all, 'meetings'] as const,
    list: (classId: string, filters?: QueryFilters) =>
      [...educatorKeys.all, 'meetings', 'list', classId, filters] as const,
    detail: (meetingId: string) =>
      [...educatorKeys.all, 'meetings', 'detail', meetingId] as const,
    token: (meetingId: string) =>
      [...educatorKeys.all, 'meetings', 'token', meetingId] as const,
  },

  presentations: {
    all: [...educatorKeys.all, 'presentations'] as const,
    list: (classId: string) =>
      [...educatorKeys.all, 'presentations', 'list', classId] as const,
  },

  submissions: {
    all: [...educatorKeys.all, 'submissions'] as const,
    list: (assessmentId: string, filters?: QueryFilters) =>
      [...educatorKeys.all, 'submissions', 'list', assessmentId, filters] as const,
    detail: (submissionId: string) =>
      [...educatorKeys.all, 'submissions', 'detail', submissionId] as const,
  },
} as const;
