import type { QueryFilters } from './types';

const adminKeys = {
  all: ['admin'] as const,
} as const;

export const adminQueryKeys = {
  ...adminKeys,

  academicCalendar: {
    all: [...adminKeys.all, 'academicCalendar'] as const,
    list: () => [...adminKeys.all, 'academicCalendar', 'list'] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'academicCalendar', 'detail', id] as const,
  },

  activityLog: {
    all: [...adminKeys.all, 'activityLog'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'activityLog', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'activityLog', 'detail', id] as const,
  },

  analytics: {
    all: [...adminKeys.all, 'analytics'] as const,
    dashboard: () => [...adminKeys.all, 'analytics', 'dashboard'] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'analytics', 'detail', id] as const,
  },

  auditLog: {
    all: [...adminKeys.all, 'auditLog'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'auditLog', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'auditLog', 'detail', id] as const,
  },

  classes: {
    all: [...adminKeys.all, 'classes'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'classes', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'classes', 'detail', id] as const,
    enrolled: (classId: string) =>
      [...adminKeys.all, 'classes', 'detail', classId, 'enrolled'] as const,
    eligibleStudents: (classId: string) =>
      [
        ...adminKeys.all,
        'classes',
        'detail',
        classId,
        'eligible-students',
      ] as const,
    eligibleForStudent: (studentId: string, search?: string) =>
      [
        ...adminKeys.all,
        'classes',
        'eligible-for-student',
        studentId,
        search ?? '',
      ] as const,
    distinctEducators: (filters: {
      schoolYearId?: string | null;
      programId?: string;
      semesterId?: string;
    }) =>
      [...adminKeys.all, 'classes', 'distinct-educators', filters] as const,
  },

  courses: {
    all: [...adminKeys.all, 'courses'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'courses', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'courses', 'detail', id] as const,
  },

  educators: {
    all: [...adminKeys.all, 'educators'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'educators', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'educators', 'detail', id] as const,
    assignments: (educatorId: string) =>
      [
        ...adminKeys.all,
        'educators',
        'detail',
        educatorId,
        'assignments',
      ] as const,
  },

  enrichedLevels: {
    all: [...adminKeys.all, 'enrichedLevels'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'enrichedLevels', 'list', filters] as const,
  },

  gradeLock: {
    all: [...adminKeys.all, 'gradeLock'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'gradeLock', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'gradeLock', 'detail', id] as const,
    overrides: () => [...adminKeys.all, 'gradeLock', 'overrides'] as const,
    unlockRequests: () =>
      [...adminKeys.all, 'gradeLock', 'unlockRequests'] as const,
  },

  gradingScales: {
    all: [...adminKeys.all, 'gradingScales'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'gradingScales', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'gradingScales', 'detail', id] as const,
    assignments: (schoolYearId: string) =>
      [...adminKeys.all, 'gradingScales', 'assignments', schoolYearId] as const,
  },

  gradingSchemes: {
    all: [...adminKeys.all, 'gradingSchemes'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'gradingSchemes', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'gradingSchemes', 'detail', id] as const,
    template: (templateId: string) =>
      [...adminKeys.all, 'gradingSchemes', 'template', templateId] as const,
  },

  gradingSchemeTemplates: {
    all: [...adminKeys.all, 'gradingSchemeTemplates'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'gradingSchemeTemplates', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'gradingSchemeTemplates', 'detail', id] as const,
    programAssignments: (schoolYearId?: string | null) =>
      [
        ...adminKeys.all,
        'gradingSchemeTemplates',
        'programAssignments',
        schoolYearId ?? null,
      ] as const,
    classAssignments: (schoolYearId?: string | null) =>
      [
        ...adminKeys.all,
        'gradingSchemeTemplates',
        'classAssignments',
        schoolYearId ?? null,
      ] as const,
  },

  holidayConfig: {
    all: [...adminKeys.all, 'holidayConfig'] as const,
    list: () => [...adminKeys.all, 'holidayConfig', 'list'] as const,
  },

  levels: {
    all: [...adminKeys.all, 'levels'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'levels', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'levels', 'detail', id] as const,
    enriched: (filters?: QueryFilters) =>
      [...adminKeys.all, 'levels', 'enriched', filters] as const,
  },

  organization: {
    all: [...adminKeys.all, 'organization'] as const,
    detail: () => [...adminKeys.all, 'organization', 'detail'] as const,
    settings: () => [...adminKeys.all, 'organization', 'settings'] as const,
    accountsCheck: () =>
      [...adminKeys.all, 'organization', 'accountsCheck'] as const,
  },

  orgEnrollmentSetting: {
    all: [...adminKeys.all, 'orgEnrollmentSetting'] as const,
    detail: () =>
      [...adminKeys.all, 'orgEnrollmentSetting', 'detail'] as const,
  },

  programCalendar: {
    all: [...adminKeys.all, 'programCalendar'] as const,
    detail: (programId: string, schoolYearId: string) =>
      [
        ...adminKeys.all,
        'programCalendar',
        'detail',
        programId,
        schoolYearId,
      ] as const,
  },

  programs: {
    all: [...adminKeys.all, 'programs'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'programs', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'programs', 'detail', id] as const,
    courses: (programId: string) =>
      [...adminKeys.all, 'programs', 'detail', programId, 'courses'] as const,
    strands: (programId: string) =>
      [...adminKeys.all, 'programs', 'detail', programId, 'strands'] as const,
    semesters: (programId: string, schoolYearId: string | null) =>
      [
        ...adminKeys.all,
        'programs',
        'detail',
        programId,
        'semesters',
        schoolYearId,
      ] as const,
    semestersGrouped: (schoolYearId: string | null) =>
      [
        ...adminKeys.all,
        'programs',
        'semesters-grouped',
        schoolYearId,
      ] as const,
  },

  registrars: {
    all: [...adminKeys.all, 'registrars'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'registrars', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'registrars', 'detail', id] as const,
  },

  schoolYears: {
    all: [...adminKeys.all, 'schoolYears'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'schoolYears', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'schoolYears', 'detail', id] as const,
    levels: (schoolYearId: string) =>
      [...adminKeys.all, 'schoolYears', 'detail', schoolYearId, 'levels'] as const,
    readiness: () =>
      [...adminKeys.all, 'schoolYears', 'readiness'] as const,
    readinessDetail: (id: string) =>
      [...adminKeys.all, 'schoolYears', 'readiness', id] as const,
  },

  enrollmentPortal: {
    all: [...adminKeys.all, 'enrollmentPortal'] as const,
    dashboard: (periodId?: string) =>
      [
        ...adminKeys.all,
        'enrollmentPortal',
        'dashboard',
        periodId ?? 'all',
      ] as const,

    periods: {
      all: [...adminKeys.all, 'enrollmentPortal', 'periods'] as const,
      list: (filters?: QueryFilters) =>
        [
          ...adminKeys.all,
          'enrollmentPortal',
          'periods',
          'list',
          filters,
        ] as const,
      detail: (id: string) =>
        [
          ...adminKeys.all,
          'enrollmentPortal',
          'periods',
          'detail',
          id,
        ] as const,
    },

    applications: {
      all: [...adminKeys.all, 'enrollmentPortal', 'applications'] as const,
      list: (filters?: QueryFilters) =>
        [
          ...adminKeys.all,
          'enrollmentPortal',
          'applications',
          'list',
          filters,
        ] as const,
      detail: (id: string) =>
        [
          ...adminKeys.all,
          'enrollmentPortal',
          'applications',
          'detail',
          id,
        ] as const,
    },
  },

  sections: {
    all: [...adminKeys.all, 'sections'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'sections', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'sections', 'detail', id] as const,
  },

  semesters: {
    all: [...adminKeys.all, 'semesters'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'semesters', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'semesters', 'detail', id] as const,
    terms: (semesterId: string) =>
      [...adminKeys.all, 'semesters', 'detail', semesterId, 'terms'] as const,
  },

  semesterTemplates: {
    all: [...adminKeys.all, 'semesterTemplates'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'semesterTemplates', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'semesterTemplates', 'detail', id] as const,
  },

  semesterTemplateAssignments: {
    all: [...adminKeys.all, 'semesterTemplateAssignments'] as const,
    list: (schoolYearId: string) =>
      [
        ...adminKeys.all,
        'semesterTemplateAssignments',
        'list',
        schoolYearId,
      ] as const,
  },

  strands: {
    all: [...adminKeys.all, 'strands'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'strands', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'strands', 'detail', id] as const,
  },

  students: {
    all: [...adminKeys.all, 'students'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'students', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'students', 'detail', id] as const,
    enrollments: (studentId: string) =>
      [
        ...adminKeys.all,
        'students',
        'detail',
        studentId,
        'enrollments',
      ] as const,
  },

  studentEnrollment: {
    all: [...adminKeys.all, 'studentEnrollment'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'studentEnrollment', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'studentEnrollment', 'detail', id] as const,
  },

  subjects: {
    all: [...adminKeys.all, 'subjects'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'subjects', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'subjects', 'detail', id] as const,
  },

  concerns: {
    all: [...adminKeys.all, 'concerns'] as const,
    list: (filters?: QueryFilters) =>
      [...adminKeys.all, 'concerns', 'list', filters] as const,
    detail: (id: string) =>
      [...adminKeys.all, 'concerns', 'detail', id] as const,
    categories: (filters?: QueryFilters) =>
      [...adminKeys.all, 'concerns', 'categories', filters] as const,
  },

  schoolProfile: {
    all: [...adminKeys.all, 'schoolProfile'] as const,
    list: () => [...adminKeys.all, 'schoolProfile', 'list'] as const,
  },
} as const;