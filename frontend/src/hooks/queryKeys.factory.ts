/**
 * Query Key Factory
 * Provides type-safe, nested query keys following TanStack Query best practices
 * Ensures consistency and prevents typos/duplicates across hooks
 */

const adminKeys = {
  all: ['admin'] as const,
} as const;

const educatorKeys = {
  all: ['educator'] as const,
} as const;

const studentKeys = {
  all: ['student'] as const,
} as const;

const authKeys = {
  all: ['auth'] as const,
} as const;

const platformKeys = {
  all: ['platform'] as const,
} as const;

export const queryKeys = {
  admin: {
    ...adminKeys,
    academicCalendar: {
      all: [...adminKeys.all, 'academicCalendar'] as const,
      list: () => [...adminKeys.all, 'academicCalendar', 'list'] as const,
      detail: (id: string) => [...adminKeys.all, 'academicCalendar', 'detail', id] as const,
    },
    activityLog: {
      all: [...adminKeys.all, 'activityLog'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'activityLog', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'activityLog', 'detail', id] as const,
    },
    analytics: {
      all: [...adminKeys.all, 'analytics'] as const,
      dashboard: () => [...adminKeys.all, 'analytics', 'dashboard'] as const,
      detail: (id: string) => [...adminKeys.all, 'analytics', 'detail', id] as const,
    },
    auditLog: {
      all: [...adminKeys.all, 'auditLog'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'auditLog', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'auditLog', 'detail', id] as const,
    },
    classes: {
      all: [...adminKeys.all, 'classes'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'classes', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'classes', 'detail', id] as const,
      enrolled: (classId: string) => [...adminKeys.all, 'classes', 'detail', classId, 'enrolled'] as const,
    },
    courses: {
      all: [...adminKeys.all, 'courses'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'courses', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'courses', 'detail', id] as const,
    },
    educators: {
      all: [...adminKeys.all, 'educators'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'educators', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'educators', 'detail', id] as const,
      assignments: (educatorId: string) => [...adminKeys.all, 'educators', 'detail', educatorId, 'assignments'] as const,
    },
    gradeLock: {
      all: [...adminKeys.all, 'gradeLock'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'gradeLock', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'gradeLock', 'detail', id] as const,
      overrides: () => [...adminKeys.all, 'gradeLock', 'overrides'] as const,
    },
    gradingScales: {
      all: [...adminKeys.all, 'gradingScales'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'gradingScales', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'gradingScales', 'detail', id] as const,
    },
    gradingSchemes: {
      all: [...adminKeys.all, 'gradingSchemes'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'gradingSchemes', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'gradingSchemes', 'detail', id] as const,
      template: (templateId: string) => [...adminKeys.all, 'gradingSchemes', 'template', templateId] as const,
    },
    gradingSchemeTemplates: {
      all: [...adminKeys.all, 'gradingSchemeTemplates'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'gradingSchemeTemplates', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'gradingSchemeTemplates', 'detail', id] as const,
    },
    levels: {
      all: [...adminKeys.all, 'levels'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'levels', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'levels', 'detail', id] as const,
      enriched: (filters?: Record<string, any>) => [...adminKeys.all, 'levels', 'enriched', filters] as const,
    },
organization: {
  all: [...adminKeys.all, "organization"] as const,

  detail: [...adminKeys.all, "organization", "detail"] as const,

  settings: [...adminKeys.all, "organization", "settings"] as const,

  accountsCheck: [...adminKeys.all, "organization", "accounts-check"] as const,
},
    orgEnrollmentSetting: {
      all: [...adminKeys.all, 'orgEnrollmentSetting'] as const,
      detail: () => [...adminKeys.all, 'orgEnrollmentSetting', 'detail'] as const,
    },
    programs: {
      all: [...adminKeys.all, 'programs'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'programs', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'programs', 'detail', id] as const,
      courses: (programId: string) => [...adminKeys.all, 'programs', 'detail', programId, 'courses'] as const,
      strands: (programId: string) => [...adminKeys.all, 'programs', 'detail', programId, 'strands'] as const,
    },
    schoolYears: {
      all: [...adminKeys.all, 'schoolYears'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'schoolYears', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'schoolYears', 'detail', id] as const,
      levels: (schoolYearId: string) => [...adminKeys.all, 'schoolYears', 'detail', schoolYearId, 'levels'] as const,
    },
    sections: {
      all: [...adminKeys.all, 'sections'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'sections', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'sections', 'detail', id] as const,
    },
    semesters: {
      all: [...adminKeys.all, 'semesters'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'semesters', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'semesters', 'detail', id] as const,
      terms: (semesterId: string) => [...adminKeys.all, 'semesters', 'detail', semesterId, 'terms'] as const,
    },
    semesterTemplates: {
      all: [...adminKeys.all, 'semesterTemplates'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'semesterTemplates', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'semesterTemplates', 'detail', id] as const,
    },
    strands: {
      all: [...adminKeys.all, 'strands'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'strands', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'strands', 'detail', id] as const,
    },
    students: {
      all: [...adminKeys.all, 'students'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'students', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'students', 'detail', id] as const,
      enrollments: (studentId: string) => [...adminKeys.all, 'students', 'detail', studentId, 'enrollments'] as const,
    },
    studentEnrollment: {
      all: [...adminKeys.all, 'studentEnrollment'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'studentEnrollment', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'studentEnrollment', 'detail', id] as const,
    },
    subjects: {
      all: [...adminKeys.all, 'subjects'] as const,
      list: (filters?: Record<string, any>) => [...adminKeys.all, 'subjects', 'list', filters] as const,
      detail: (id: string) => [...adminKeys.all, 'subjects', 'detail', id] as const,
    },
  },

  educator: {
    ...educatorKeys,
    activityLog: {
      all: [...educatorKeys.all, 'activityLog'] as const,
      list: (filters?: Record<string, any>) => [...educatorKeys.all, 'activityLog', 'list', filters] as const,
    },
    assessments: {
      all: [...educatorKeys.all, 'assessments'] as const,
      list: (classId: string, filters?: Record<string, any>) => [...educatorKeys.all, 'assessments', 'list', classId, filters] as const,
      detail: (assessmentId: string) => [...educatorKeys.all, 'assessments', 'detail', assessmentId] as const,
      submissions: (assessmentId: string, filters?: Record<string, any>) => [...educatorKeys.all, 'assessments', 'detail', assessmentId, 'submissions', filters] as const,
    },
    attendance: {
      all: [...educatorKeys.all, 'attendance'] as const,
      list: (classId: string, filters?: Record<string, any>) => [...educatorKeys.all, 'attendance', 'list', classId, filters] as const,
      session: (sessionId: string) => [...educatorKeys.all, 'attendance', 'session', sessionId] as const,
    },
    classes: {
      all: [...educatorKeys.all, 'classes'] as const,
      list: (filters?: Record<string, any>) => [...educatorKeys.all, 'classes', 'list', filters] as const,
      detail: (classId: string) => [...educatorKeys.all, 'classes', 'detail', classId] as const,
    },
    grades: {
      all: [...educatorKeys.all, 'grades'] as const,
      list: (classId: string, termId: string, filters?: Record<string, any>) => [...educatorKeys.all, 'grades', 'list', classId, termId, filters] as const,
      detail: (gradeId: string) => [...educatorKeys.all, 'grades', 'detail', gradeId] as const,
    },
    gradingSchemes: {
      all: [...educatorKeys.all, 'gradingSchemes'] as const,
      detail: (classId: string) => [...educatorKeys.all, 'gradingSchemes', 'detail', classId] as const,
    },
    lessons: {
      all: [...educatorKeys.all, 'lessons'] as const,
      list: (classId: string, filters?: Record<string, any>) => [...educatorKeys.all, 'lessons', 'list', classId, filters] as const,
      detail: (lessonId: string) => [...educatorKeys.all, 'lessons', 'detail', lessonId] as const,
    },
    meetings: {
      all: [...educatorKeys.all, 'meetings'] as const,
      list: (classId: string, filters?: Record<string, any>) => [...educatorKeys.all, 'meetings', 'list', classId, filters] as const,
      detail: (meetingId: string) => [...educatorKeys.all, 'meetings', 'detail', meetingId] as const,
    },
    submissions: {
      all: [...educatorKeys.all, 'submissions'] as const,
      list: (assessmentId: string, filters?: Record<string, any>) => [...educatorKeys.all, 'submissions', 'list', assessmentId, filters] as const,
      detail: (submissionId: string) => [...educatorKeys.all, 'submissions', 'detail', submissionId] as const,
    },
  },

  student: {
    ...studentKeys,
    assessments: {
      all: [...studentKeys.all, 'assessments'] as const,
      list: (classId: string, filters?: Record<string, any>) => [...studentKeys.all, 'assessments', 'list', classId, filters] as const,
      detail: (assessmentId: string) => [...studentKeys.all, 'assessments', 'detail', assessmentId] as const,
      result: (assessmentId: string) => [...studentKeys.all, 'assessments', 'detail', assessmentId, 'result'] as const,
    },
    attendance: {
      all: [...studentKeys.all, 'attendance'] as const,
      list: (classId: string, filters?: Record<string, any>) => [...studentKeys.all, 'attendance', 'list', classId, filters] as const,
    },
    classes: {
      all: [...studentKeys.all, 'classes'] as const,
      list: (filters?: Record<string, any>) => [...studentKeys.all, 'classes', 'list', filters] as const,
      detail: (classId: string) => [...studentKeys.all, 'classes', 'detail', classId] as const,
    },
    grades: {
      all: [...studentKeys.all, 'grades'] as const,
      list: (classId: string, filters?: Record<string, any>) => [...studentKeys.all, 'grades', 'list', classId, filters] as const,
    },
    lessons: {
      all: [...studentKeys.all, 'lessons'] as const,
      list: (classId: string, filters?: Record<string, any>) => [...studentKeys.all, 'lessons', 'list', classId, filters] as const,
      detail: (lessonId: string) => [...studentKeys.all, 'lessons', 'detail', lessonId] as const,
    },
    meetings: {
      all: [...studentKeys.all, 'meetings'] as const,
      list: (filters?: Record<string, any>) => [...studentKeys.all, 'meetings', 'list', filters] as const,
      detail: (meetingId: string) => [...studentKeys.all, 'meetings', 'detail', meetingId] as const,
    },
    notifications: {
      all: [...studentKeys.all, 'notifications'] as const,
      list: (filters?: Record<string, any>) => [...studentKeys.all, 'notifications', 'list', filters] as const,
    },
    semesters: {
      all: [...studentKeys.all, 'semesters'] as const,
      list: (filters?: Record<string, any>) => [...studentKeys.all, 'semesters', 'list', filters] as const,
    },
    submissions: {
      all: [...studentKeys.all, 'submissions'] as const,
      list: (assessmentId: string, filters?: Record<string, any>) => [...studentKeys.all, 'submissions', 'list', assessmentId, filters] as const,
      detail: (submissionId: string) => [...studentKeys.all, 'submissions', 'detail', submissionId] as const,
    },
    transcript: {
      all: [...studentKeys.all, 'transcript'] as const,
      detail: () => [...studentKeys.all, 'transcript', 'detail'] as const,
    },
  },

  auth: {
    ...authKeys,
    profile: () => [...authKeys.all, 'profile'] as const,
    me: () => [...authKeys.all, 'me'] as const,
  },

  platform: {
    ...platformKeys,
    admins: {
      all: [...platformKeys.all, 'admins'] as const,
      list: (filters?: Record<string, any>) => [...platformKeys.all, 'admins', 'list', filters] as const,
      detail: (id: string) => [...platformKeys.all, 'admins', 'detail', id] as const,
    },
  },
};

export default queryKeys;