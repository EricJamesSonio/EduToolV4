// Application constants
// Central place for all constant values used throughout the application

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },

  // Users
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
  },

  // Classes
  CLASSES: {
    BASE: '/classes',
    CREATE: '/classes',
    UPDATE: (id: string) => `/classes/${id}`,
    DELETE: (id: string) => `/classes/${id}`,
    GET: (id: string) => `/classes/${id}`,
    ENROLL: (id: string) => `/classes/${id}/enroll`,
    UNENROLL: (id: string) => `/classes/${id}/unenroll`,
  },

  // Students
  STUDENTS: {
    BASE: '/students',
    CREATE: '/students',
    UPDATE: (id: string) => `/students/${id}`,
    DELETE: (id: string) => `/students/${id}`,
    GET: (id: string) => `/students/${id}`,
  },

  // Assignments
  ASSIGNMENTS: {
    BASE: '/assignments',
    CREATE: '/assignments',
    UPDATE: (id: string) => `/assignments/${id}`,
    DELETE: (id: string) => `/assignments/${id}`,
    GET: (id: string) => `/assignments/${id}`,
    SUBMIT: (id: string) => `/assignments/${id}/submit`,
  },

  // Grades
  GRADES: {
    BASE: '/grades',
    CLASS_GRADES: (classId: string) => `/grades/class/${classId}`,
    STUDENT_GRADES: (studentId: string) => `/grades/student/${studentId}`,
    ASSIGNMENT_GRADES: (assignmentId: string) => `/grades/assignment/${assignmentId}`,
  },
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

// File upload limits
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  LAST_VISITED_PAGE: 'last_visited_page',
} as const;

// Query keys for React Query
export const QUERY_KEYS = {
  // Authentication
  AUTH: 'auth',
  USER: 'user',

  // Classes
  CLASSES: 'classes',
  CLASS: (id: string) => ['class', id],
  CLASS_STUDENTS: (id: string) => ['class', id, 'students'],

  // Students
  STUDENTS: 'students',
  STUDENT: (id: string) => ['student', id],
  STUDENT_GRADES: (id: string) => ['student', id, 'grades'],

  // Assignments
  ASSIGNMENTS: 'assignments',
  ASSIGNMENT: (id: string) => ['assignment', id],
  ASSIGNMENT_SUBMISSIONS: (id: string) => ['assignment', id, 'submissions'],

} as const;

// Socket.io events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Classroom events
  JOIN_CLASS: 'join_class',
  LEAVE_CLASS: 'leave_class',
  CLASS_UPDATE: 'class_update',

  // Real-time updates
  GRADE_UPDATE: 'grade_update',
  ASSIGNMENT_UPDATE: 'assignment_update',
  STUDENT_UPDATE: 'student_update',

  // Notifications
  NOTIFICATION: 'notification',
  BROADCAST: 'broadcast',
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  EDUCATOR: 'educator',
  STUDENT: 'student',
} as const;

// Grade levels
export const GRADE_LEVELS = {
  KINDERGARTEN: 'kindergarten',
  GRADE_1: 'grade_1',
  GRADE_2: 'grade_2',
  GRADE_3: 'grade_3',
  GRADE_4: 'grade_4',
  GRADE_5: 'grade_5',
  GRADE_6: 'grade_6',
  GRADE_7: 'grade_7',
  GRADE_8: 'grade_8',
  GRADE_9: 'grade_9',
  GRADE_10: 'grade_10',
  GRADE_11: 'grade_11',
  GRADE_12: 'grade_12',
} as const;

// Subject areas
export const SUBJECTS = {
  MATHEMATICS: 'mathematics',
  SCIENCE: 'science',
  ENGLISH: 'english',
  HISTORY: 'history',
  GEOGRAPHY: 'geography',
  ART: 'art',
  MUSIC: 'music',
  PHYSICAL_EDUCATION: 'physical_education',
  COMPUTER_SCIENCE: 'computer_science',
  FOREIGN_LANGUAGE: 'foreign_language',
} as const;

// Time formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  DATABASE: 'yyyy-MM-dd HH:mm:ss',
  TIME_ONLY: 'HH:mm',
  SHORT_DATE: 'MM/dd/yyyy',
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  URL: /^https?:\/\/.+/,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'You don\'t have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
  INVALID_FILE_TYPE: 'File type is not allowed.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Item created successfully.',
  UPDATED: 'Item updated successfully.',
  DELETED: 'Item deleted successfully.',
  SAVED: 'Changes saved successfully.',
  UPLOADED: 'File uploaded successfully.',
  EMAIL_SENT: 'Email sent successfully.',
  PASSWORD_CHANGED: 'Password changed successfully.',
} as const;

// Animation durations (in milliseconds)
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const;

// Breakpoints for responsive design
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;
