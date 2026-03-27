export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:5000";

export const AGORA_APP_ID =
  process.env.NEXT_PUBLIC_AGORA_APP_ID ?? "";

// API route prefixes — keeps path strings in one place
export const API_ROUTES = {
  auth: {
    login:   "/auth/login",
    logout:  "/auth/logout",
    refresh: "/auth/refresh",
    me:      "/auth/me",
  },
  platform: {
    admins: "/platform/admins",
  },
  admin: {
    organization:    "/admin/organization",
    schoolYears:     "/admin/school-years",
    levels:          "/admin/levels",
    programs:        "/admin/programs",
    sections:        "/admin/sections",
    subjects:        "/admin/subjects",
    semesters:       "/admin/semester-settings",
    calendar:        "/admin/academic-calendar",
    gradingScales:   "/admin/grading-scales",
    rubric:          "/admin/rubric",
    classes:         "/admin/classes",
    educators:       "/admin/educators",
    students:        "/admin/students",
    gradeLock:       "/admin/grade-lock",
    analytics:       "/admin/analytics",
    auditLog:        "/admin/audit-log",
  },
  educator: {
    lessons:      "/educator/lessons",
    assessments:  "/educator/assessments",
    submissions:  "/educator/submissions",
    attendance:   "/educator/attendance",
    grades:       "/educator/grades",
    rubric:       "/educator/rubric",
    meetings:     "/educator/meetings",
    activityLog:  "/educator/activity-log",
  },
  student: {
    classes:       "/student/classes",
    lessons:       "/student/lessons",
    assessments:   "/student/assessments",
    submissions:   "/student/submissions",
    attendance:    "/student/attendance",
    grades:        "/student/grades",
    meetings:      "/student/meetings",
    notifications: "/student/notifications",
    transcript:    "/student/transcript",
  },
} as const;
