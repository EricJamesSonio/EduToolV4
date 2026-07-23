
# Graphify Report: EduToolV3

Generated: 2026-07-15 21:40:28

## Overview

- Total files: 1018
- Total symbols: 8277
- Total imports: 3213
- Graph nodes: 1018
- Graph edges: 618
- Features: 56
- Concepts: 10
- Build: AI generated

## Feature Map

### frontend-components
- **Description**: Frontend React components: shared UI, admin, educator, student, meeting, and landing
- **Files**: 345 files
  - frontend/src/components/admin/academic-calendar/BreakEditor.tsx
  - frontend/src/components/admin/academic-calendar/HolidayBaseTab.tsx
  - frontend/src/components/admin/academic-calendar/HolidayCalendarGrid.tsx
  - frontend/src/components/admin/academic-calendar/ProgramCalendarCard.tsx
  - frontend/src/components/admin/academic-calendar/HolidayListPanel.tsx
  - frontend/src/components/admin/academic-calendar/ProgramCalendarsTab.tsx
  - frontend/src/components/admin/class/ClassesFilterBar.tsx
  - frontend/src/components/admin/class/CreateClassDialog.types.ts
  - frontend/src/components/admin/class/detail/ClassDetailHeader.tsx
  - frontend/src/components/admin/class/ClassesTable.tsx
  - *... and 335 more*

### frontend-pages
- **Description**: Frontend Next.js App Router pages for admin, educator, student, and platform portals
- **Files**: 117 files
  - frontend/src/app/admin/academic-calendar/page.tsx
  - frontend/src/app/admin/audit-log/page.tsx
  - frontend/src/app/admin/audit-log/_components/ActorCell.tsx
  - frontend/src/app/admin/audit-log/_components/ActivityLogTab.tsx
  - frontend/src/app/admin/audit-log/_components/index.ts
  - frontend/src/app/admin/audit-log/_components/constants.ts
  - frontend/src/app/admin/audit-log/_components/ExpandableMetadata.tsx
  - frontend/src/app/admin/audit-log/_components/AuditLogTab.tsx
  - frontend/src/app/admin/classes/page.tsx
  - frontend/src/app/admin/classes/[id]/page.tsx
  - *... and 107 more*

### frontend-hooks
- **Description**: Frontend React hooks for data fetching, state management, and real-time features
- **Files**: 69 files
  - frontend/src/hooks/admin/useAuditLog.ts
  - frontend/src/hooks/admin/useAnalytics.ts
  - frontend/src/hooks/admin/useAcademicCalendar.ts
  - frontend/src/hooks/admin/useClassFilters.ts
  - frontend/src/hooks/admin/useClasses.ts
  - frontend/src/hooks/admin/useEnrollWorkspace.ts
  - frontend/src/hooks/admin/useCourses.ts
  - frontend/src/hooks/admin/useEducators.ts
  - frontend/src/hooks/admin/useEnrichedLevels.ts
  - frontend/src/hooks/admin/useGradingSchemes.ts
  - *... and 59 more*

### frontend-api
- **Description**: Frontend API layer: HTTP client and API function modules for all portals
- **Files**: 52 files
  - frontend/src/api/admin/analytics.api.ts
  - frontend/src/api/admin/activity-log.api.ts
  - frontend/src/api/admin/academic-calendar.api.ts
  - frontend/src/api/admin/audit-log.api.ts
  - frontend/src/api/admin/course.api.ts
  - frontend/src/api/admin/class.api.ts
  - frontend/src/api/admin/grading-scheme-template.api.ts
  - frontend/src/api/admin/educator.api.ts
  - frontend/src/api/admin/grade-lock.api.ts
  - frontend/src/api/admin/grading-scale.api.ts
  - *... and 42 more*

### frontend-types
- **Description**: Frontend TypeScript type definitions
- **Files**: 41 files
  - frontend/src/types/admin/analytics.types.ts
  - frontend/src/types/admin/audit-log.types.ts
  - frontend/src/types/admin/course.types.ts
  - frontend/src/types/admin/educator.types.ts
  - frontend/src/types/admin/calendar.types.ts
  - frontend/src/types/admin/class.types.ts
  - frontend/src/types/admin/grading-scale.types.ts
  - frontend/src/types/admin/grade-lock.types.ts
  - frontend/src/types/admin/grading-scheme.types.ts
  - frontend/src/types/admin/grading-scheme-template.types.ts
  - *... and 31 more*

### core-infrastructure
- **Description**: Core application infrastructure: bootstrap, configuration, middleware, interceptors, pipes, and global exception filters
- **Files**: 38 files
  - backend/src/main.ts
  - backend/src/app.module.ts
  - backend/src/app.controller.ts
  - backend/src/app.service.ts
  - backend/src/commons/interceptors/response.interceptor.ts
  - backend/src/commons/interceptors/logging.interceptor.ts
  - backend/src/commons/utils/password.util.ts
  - backend/src/commons/utils/token.util.ts
  - backend/src/commons/utils/hash.util.ts
  - backend/src/core/core.module.ts
  - *... and 28 more*

### org-seeder
- **Description**: org-seeder module
- **Files**: 31 files
  - backend/src/modules/org-seeder/data/grading-schemes.data.ts
  - backend/src/modules/org-seeder/data/courses.data.ts
  - backend/src/modules/org-seeder/data/grading-scale.data.ts
  - backend/src/modules/org-seeder/data/levels.data.ts
  - backend/src/modules/org-seeder/data/programs.data.ts
  - backend/src/modules/org-seeder/data/org-settings.data.ts
  - backend/src/modules/org-seeder/data/strands.data.ts
  - backend/src/modules/org-seeder/data/semester-templates.data.ts
  - backend/src/modules/org-seeder/data/subjects/daycare.subjects.ts
  - backend/src/modules/org-seeder/data/subjects/college.subjects.ts
  - *... and 21 more*

### assessment
- **Description**: Assessment system: create, manage, and grade assessments with AI question generation, hybrid grading, and score publishing
- **Files**: 18 files
  - backend/src/modules/assessment/assessment.module.ts
  - backend/src/modules/assessment/core/assessment-core.module.ts
  - backend/src/modules/assessment/core/assessment-core.service.ts
  - backend/src/modules/assessment/dto/assessment.dto.ts
  - backend/src/modules/assessment/educator/assessment-educator.module.ts
  - backend/src/modules/assessment/core/assessment-core.repository.ts
  - backend/src/modules/assessment/educator/assessment-educator.controller.ts
  - backend/src/modules/assessment/educator/helpers/assessment-submission.helper.ts
  - backend/src/modules/assessment/educator/assessment-generation.helper.ts
  - backend/src/modules/assessment/educator/assessment-educator.service.ts
  - *... and 8 more*

### frontend-utilities
- **Description**: Frontend utility libraries and helpers
- **Files**: 16 files
  - frontend/src/lib/palette.ts
  - frontend/src/lib/presentation-templates.ts
  - frontend/src/lib/email/buildFullEmail.ts
  - frontend/src/lib/query-client.config.ts
  - frontend/src/lib/query-client.ts
  - frontend/src/lib/utils.ts
  - frontend/src/lib/error-handling.ts
  - frontend/src/utils/classes.utils.ts
  - frontend/src/utils/profile.util.ts
  - frontend/src/utils/date.util.ts
  - *... and 6 more*

### grade
- **Description**: Grade computation: weighted scoring, category breakdowns, manual scores, grading scale resolution, and grade publishing
- **Files**: 15 files
  - backend/src/modules/grade/core/grade-core.module.ts
  - backend/src/modules/grade/educator/dto/grade-educator.dto.ts
  - backend/src/modules/grade/dto/grade.dto.ts
  - backend/src/modules/grade/core/grade-core.service.ts
  - backend/src/modules/grade/educator/grade-educator.controller.ts
  - backend/src/modules/grade/educator/grade-educator.module.ts
  - backend/src/modules/grade/educator/grade-educator.service.ts
  - backend/src/modules/grade/grade.controller.ts
  - backend/src/modules/grade/grade.module.ts
  - backend/src/modules/grade/entity/grade.entity.ts
  - *... and 5 more*

### platform
- **Description**: Platform administration: super admin management, platform-level configuration, and school oversight
- **Files**: 13 files
  - backend/src/modules/platform/dto/create-admin.dto.ts
  - backend/src/modules/platform/dto/login-platform.dto.ts
  - backend/src/modules/platform/dto/get-admins.dto.ts
  - backend/src/modules/platform/dto/reset-password.dto.ts
  - backend/src/modules/platform/platform.module.ts
  - backend/src/modules/platform/platform.controller.ts
  - backend/src/modules/platform/guards/platform-owner.guard.ts
  - backend/src/modules/platform-registration/dto/approve-request.dto.ts
  - backend/src/modules/platform/platform.service.ts
  - backend/src/modules/platform-registration/platform-registration.module.ts
  - *... and 3 more*

### academic-calendar
- **Description**: Academic calendar management: holidays, breaks, program calendars, and term date assignment
- **Files**: 13 files
  - backend/src/modules/academic-calendar/academic-calendar.controller.ts
  - backend/src/modules/academic-calendar/academic-calendar.module.ts
  - backend/src/modules/academic-calendar/academic-calendar.service.ts
  - backend/src/modules/academic-calendar/academic-calendar.repository.ts
  - backend/src/modules/academic-calendar/dto/academic-calendar.dto.ts
  - backend/src/modules/academic-calendar/data/holidays.data.ts
  - backend/src/modules/academic-calendar/entity/academic-calendar.entity.ts
  - backend/src/modules/academic-calendar/dto/program-calendar.dto.ts
  - backend/src/modules/academic-calendar/program-calendar/program-calendar.controller.ts
  - backend/src/modules/academic-calendar/program-calendar/program-calendar.repository.ts
  - *... and 3 more*

### grading-scheme
- **Description**: Grading scheme management: component weight configuration, template application, and class assignment
- **Files**: 12 files
  - backend/src/modules/grading-scheme/dto/grading-scheme.dto.ts
  - backend/src/modules/grading-scheme/entity/grading-scheme.entity.ts
  - backend/src/modules/grading-scheme/grading-scheme.module.ts
  - backend/src/modules/grading-scheme/grading-scheme.controller.ts
  - backend/src/modules/grading-scheme/grading-scheme.service.ts
  - backend/src/modules/grading-scheme/grading-scheme.repository.ts
  - backend/src/modules/grading-scheme-template/dto/grading-scheme-template.dto.ts
  - backend/src/modules/grading-scheme-template/entity/grading-scheme-template.entity.ts
  - backend/src/modules/grading-scheme-template/grading-scheme-template.module.ts
  - backend/src/modules/grading-scheme-template/grading-scheme-template.repository.ts
  - *... and 2 more*

### enrollment
- **Description**: Student enrollment: class enrollment, prerequisite checking, capacity management, and eligibility validation
- **Files**: 12 files
  - backend/src/modules/enrollment/enrollment.module.ts
  - backend/src/modules/enrollment/enrollment.controller.ts
  - backend/src/modules/enrollment/dto/enrollment.dto.ts
  - backend/src/modules/enrollment/entity/enrollment.entity.ts
  - backend/src/modules/enrollment/enrollment.service.ts
  - backend/src/modules/enrollment/enrollment.repository.ts
  - backend/src/modules/student-enrollment/dto/student-enrollment.dto.ts
  - backend/src/modules/student-enrollment/entity/student-enrollment.entity.ts
  - backend/src/modules/student-enrollment/student-enrollment.controller.ts
  - backend/src/modules/student-enrollment/student-enrollment.module.ts
  - *... and 2 more*

### grade-lock
- **Description**: Grade locking system: settings, auto-lock, unlock requests, override, and deadline management
- **Files**: 11 files
  - backend/src/modules/grade-lock/dto/grade-lock.dto.ts
  - backend/src/modules/grade-lock/grade-lock-auto.service.ts
  - backend/src/modules/grade-lock/grade-lock-requests.service.ts
  - backend/src/modules/grade-lock/grade-lock-settings.service.ts
  - backend/src/modules/grade-lock/grade-lock-operations.service.ts
  - backend/src/modules/grade-lock/grade-lock.module.ts
  - backend/src/modules/grade-lock/grade-lock.service.ts
  - backend/src/modules/grade-lock/grade-lock.repository.ts
  - backend/src/modules/grade-lock/grade-lock.controller.ts
  - backend/src/modules/grade-lock/grade-lock.utils.ts
  - *... and 1 more*

### authentication
- **Description**: Authentication system: JWT-based auth with Passport, login, register, OTP, token refresh, and guards
- **Files**: 10 files
  - backend/src/commons/decorators/current-user.decorator.ts
  - backend/src/commons/guards/auth.guard.ts
  - backend/src/modules/auth/auth.module.ts
  - backend/src/modules/auth/auth.controller.ts
  - backend/src/modules/auth/auth.repository.ts
  - backend/src/modules/auth/dto/register.dto.ts
  - backend/src/modules/auth/entity/auth.entity.ts
  - backend/src/modules/auth/dto/auth.dto.ts
  - backend/src/modules/auth/auth.service.ts
  - backend/src/modules/auth/strategies/jwt.strategy.ts

### attendance
- **Description**: Attendance tracking: session generation from class schedules, bulk recording, and student/educator views
- **Files**: 10 files
  - backend/src/modules/attendance/attendance.module.ts
  - backend/src/modules/attendance/attendance.controller.ts
  - backend/src/modules/attendance/attendance.repository.ts
  - backend/src/modules/attendance/attendance.service.ts
  - backend/src/modules/attendance/dto/attendance.dto.ts
  - backend/src/modules/attendance/entity/attendance.entity.ts
  - backend/src/modules/attendance/student/attendance-student.controller.ts
  - backend/src/modules/attendance/student/attendance-student.module.ts
  - backend/src/modules/attendance/student/attendance-student.service.ts
  - backend/src/modules/attendance/__TEST__/attendance.service.spec.ts

### lesson
- **Description**: Lesson management: CRUD, AI concept extraction/building, week structure generation, and student lesson viewing
- **Files**: 9 files
  - backend/src/modules/lesson/dto/lesson.dto.ts
  - backend/src/modules/lesson/entity/lesson.entity.ts
  - backend/src/modules/lesson/lesson-concept.service.ts
  - backend/src/modules/lesson/lesson.module.ts
  - backend/src/modules/lesson/lesson-student.service.ts
  - backend/src/modules/lesson/lesson-week-structure.service.ts
  - backend/src/modules/lesson/lesson.controller.ts
  - backend/src/modules/lesson/lesson.service.ts
  - backend/src/modules/lesson/lesson.repository.ts

### frontend-styles
- **Description**: Frontend CSS stylesheets and theme definitions
- **Files**: 8 files
  - frontend/src/styles/portal.css
  - frontend/src/styles/error-login.css
  - frontend/src/styles/base.css
  - frontend/src/styles/globals.css
  - frontend/src/styles/responsive-meeting.css
  - frontend/src/styles/responsive.css
  - frontend/src/styles/utilities.css
  - frontend/src/styles/theme.css

### ai
- **Description**: AI-powered content generation: concept extraction, concept building, and question generation via OpenRouter API
- **Files**: 8 files
  - backend/src/core/ai/ai.module.ts
  - backend/src/core/ai/ai-client.service.ts
  - backend/src/core/ai/ai.service.ts
  - backend/src/core/ai/constants.ts
  - backend/src/core/ai/concept-validator.util.ts
  - backend/src/core/ai/json-parser.util.ts
  - backend/src/core/ai/prompt-builder.util.ts
  - backend/src/core/ai/types.ts

### meeting
- **Description**: Video conferencing: Agora RTC integration, WebSocket gateway for real-time features, meeting CRUD, and join requests
- **Files**: 8 files
  - backend/src/modules/meeting/dto/meeting.dto.ts
  - backend/src/modules/meeting/agora-token.service.ts
  - backend/src/modules/meeting/meeting-token.controller.ts
  - backend/src/modules/meeting/meeting.module.ts
  - backend/src/modules/meeting/meeting.controller.ts
  - backend/src/modules/meeting/meeting.gateway.ts
  - backend/src/modules/meeting/meeting.service.ts
  - backend/src/modules/meeting/meeting.repository.ts

### student
- **Description**: Student management: CRUD, profile management, enrollment history, and status management
- **Files**: 7 files
  - backend/src/modules/student/student.module.ts
  - backend/src/modules/student/entity/student.entity.ts
  - backend/src/modules/student/dto/student.dto.ts
  - backend/src/modules/student/student.controller.ts
  - backend/src/modules/student/student.service.ts
  - backend/src/modules/student/student.repository.ts
  - backend/src/modules/student/student.utils.ts

### grading-scale
- **Description**: Grading scale management: letter grade ranges, program assignment, and percentage-to-grade resolution
- **Files**: 7 files
  - backend/src/modules/grading-scale/dto/grading-scale.dto.ts
  - backend/src/modules/grading-scale/entity/grading-scale.entity.ts
  - backend/src/modules/grading-scale/grading-scale-assignment.repository.ts
  - backend/src/modules/grading-scale/grading-scale.controller.ts
  - backend/src/modules/grading-scale/grading-scale.module.ts
  - backend/src/modules/grading-scale/grading-scale.service.ts
  - backend/src/modules/grading-scale/grading-scale.repository.ts

### section
- **Description**: section module
- **Files**: 6 files
  - backend/src/modules/section/dto/section.dto.ts
  - backend/src/modules/section/entity/section.entity.ts
  - backend/src/modules/section/section.module.ts
  - backend/src/modules/section/section.controller.ts
  - backend/src/modules/section/section.service.ts
  - backend/src/modules/section/section.repository.ts

### subject-prerequisite
- **Description**: subject-prerequisite module
- **Files**: 6 files
  - backend/src/modules/subject-prerequisite/dto/subject-prerequisite.dto.ts
  - backend/src/modules/subject-prerequisite/entity/subject-prerequisite.entity.ts
  - backend/src/modules/subject-prerequisite/subject-prerequisite.module.ts
  - backend/src/modules/subject-prerequisite/subject-prerequisite.controller.ts
  - backend/src/modules/subject-prerequisite/subject-prerequisite.repository.ts
  - backend/src/modules/subject-prerequisite/subject-prerequisite.service.ts

### semester
- **Description**: semester module
- **Files**: 6 files
  - backend/src/modules/semester/dto/semester.dto.ts
  - backend/src/modules/semester/entity/semester.entity.ts
  - backend/src/modules/semester/semester.module.ts
  - backend/src/modules/semester/semester.controller.ts
  - backend/src/modules/semester/semester.repository.ts
  - backend/src/modules/semester/semester.service.ts

### school-year
- **Description**: school-year module
- **Files**: 6 files
  - backend/src/modules/school-year/entity/school-year.entity.ts
  - backend/src/modules/school-year/school-year.module.ts
  - backend/src/modules/school-year/dto/school-year.dto.ts
  - backend/src/modules/school-year/school-year.controller.ts
  - backend/src/modules/school-year/school-year.service.ts
  - backend/src/modules/school-year/school-year.repository.ts

### level
- **Description**: level module
- **Files**: 6 files
  - backend/src/modules/level/dto/level.dto.ts
  - backend/src/modules/level/entity/level.entity.ts
  - backend/src/modules/level/level.module.ts
  - backend/src/modules/level/level.controller.ts
  - backend/src/modules/level/level.service.ts
  - backend/src/modules/level/level.repository.ts

### semester-template
- **Description**: semester-template module
- **Files**: 6 files
  - backend/src/modules/semester-template/dto/semester-template.dto.ts
  - backend/src/modules/semester-template/entity/semester-template.entity.ts
  - backend/src/modules/semester-template/semester-template.module.ts
  - backend/src/modules/semester-template/semester-template.controller.ts
  - backend/src/modules/semester-template/semester-template.service.ts
  - backend/src/modules/semester-template/semester-template.repository.ts

### course
- **Description**: Course management: CRUD with program and school year associations
- **Files**: 6 files
  - backend/src/modules/course/course.module.ts
  - backend/src/modules/course/course.controller.ts
  - backend/src/modules/course/course.repository.ts
  - backend/src/modules/course/dto/course.dto.ts
  - backend/src/modules/course/course.service.ts
  - backend/src/modules/course/entity/course.entity.ts

### submission
- **Description**: submission module
- **Files**: 6 files
  - backend/src/modules/submission/entity/submission.entity.ts
  - backend/src/modules/submission/dto/submission.dto.ts
  - backend/src/modules/submission/submission.controller.ts
  - backend/src/modules/submission/submission.module.ts
  - backend/src/modules/submission/submission.repository.ts
  - backend/src/modules/submission/submission.service.ts

### strand
- **Description**: strand module
- **Files**: 6 files
  - backend/src/modules/strand/dto/strand.dto.ts
  - backend/src/modules/strand/strand.controller.ts
  - backend/src/modules/strand/entity/strand.entity.ts
  - backend/src/modules/strand/strand.module.ts
  - backend/src/modules/strand/strand.repository.ts
  - backend/src/modules/strand/strand.service.ts

### analytics
- **Description**: analytics module
- **Files**: 6 files
  - backend/src/modules/analytics/analytics.module.ts
  - backend/src/modules/analytics/analytics.controller.ts
  - backend/src/modules/analytics/analytics.repository.ts
  - backend/src/modules/analytics/dto/analytics.dto.ts
  - backend/src/modules/analytics/analytics.service.ts
  - backend/src/modules/analytics/__TEST__/analytics.service.spec.ts

### organization
- **Description**: Organization management: CRUD, settings, and multi-tenant configuration
- **Files**: 6 files
  - backend/src/modules/organization/entity/organization.entity.ts
  - backend/src/modules/organization/dto/organization.dto.ts
  - backend/src/modules/organization/organization.controller.ts
  - backend/src/modules/organization/organization.module.ts
  - backend/src/modules/organization/organization.repository.ts
  - backend/src/modules/organization/organization.service.ts

### org-enrollment-setting
- **Description**: org-enrollment-setting module
- **Files**: 6 files
  - backend/src/modules/org-enrollment-setting/dto/org-enrollment-setting.dto.ts
  - backend/src/modules/org-enrollment-setting/entity/org-enrollment-setting.entity.ts
  - backend/src/modules/org-enrollment-setting/org-enrollment-setting.service.ts
  - backend/src/modules/org-enrollment-setting/org-enrollment-setting.module.ts
  - backend/src/modules/org-enrollment-setting/org-enrollment-setting.repository.ts
  - backend/src/modules/org-enrollment-setting/org-enrollment-setting.controller.ts

### audit-log
- **Description**: Audit logging for admin actions and educator activity events with searchable history
- **Files**: 6 files
  - backend/src/modules/audit-log/audit-log.module.ts
  - backend/src/modules/audit-log/audit-log.controller.ts
  - backend/src/modules/audit-log/audit-log.repository.ts
  - backend/src/modules/audit-log/audit-log.service.ts
  - backend/src/modules/audit-log/dto/audit-log.dto.ts
  - backend/src/modules/audit-log/entity/audit-log.entity.ts

### program
- **Description**: program module
- **Files**: 6 files
  - backend/src/modules/program/dto/program.dto.ts
  - backend/src/modules/program/entity/program.entity.ts
  - backend/src/modules/program/program.controller.ts
  - backend/src/modules/program/program.module.ts
  - backend/src/modules/program/program.repository.ts
  - backend/src/modules/program/program.service.ts

### subject
- **Description**: subject module
- **Files**: 6 files
  - backend/src/modules/subject/dto/subject.dto.ts
  - backend/src/modules/subject/entity/subject.entity.ts
  - backend/src/modules/subject/subject.module.ts
  - backend/src/modules/subject/subject.controller.ts
  - backend/src/modules/subject/subject.service.ts
  - backend/src/modules/subject/subject.repository.ts

### class
- **Description**: Class management: CRUD, scheduling, enrollment, educator assignment, and ownership tracking
- **Files**: 6 files
  - backend/src/modules/class/class.module.ts
  - backend/src/modules/class/class.controller.ts
  - backend/src/modules/class/dto/class.dto.ts
  - backend/src/modules/class/class.service.ts
  - backend/src/modules/class/class.repository.ts
  - backend/src/modules/class/entity/class.entity.ts

### notification
- **Description**: Notification system: create, list, mark read, and archive notifications for users
- **Files**: 6 files
  - backend/src/modules/notification/entity/notification.entity.ts
  - backend/src/modules/notification/dto/notification.dto.ts
  - backend/src/modules/notification/notification.module.ts
  - backend/src/modules/notification/notification.controller.ts
  - backend/src/modules/notification/notification.service.ts
  - backend/src/modules/notification/notification.repository.ts

### presentation
- **Description**: presentation module
- **Files**: 5 files
  - backend/src/modules/presentation/dto/presentation.dto.ts
  - backend/src/modules/presentation/presentation.module.ts
  - backend/src/modules/presentation/presentation.controller.ts
  - backend/src/modules/presentation/presentation.repository.ts
  - backend/src/modules/presentation/presentation.service.ts

### transcript
- **Description**: transcript module
- **Files**: 4 files
  - backend/src/modules/transcript/student/transcript-student.controller.ts
  - backend/src/modules/transcript/student/transcript-student.module.ts
  - backend/src/modules/transcript/student/transcript-student.service.ts
  - backend/src/modules/transcript/transcript.module.ts

### frontend-config
- **Description**: Frontend configuration files
- **Files**: 4 files
  - frontend/global.d.ts
  - frontend/next-env.d.ts
  - frontend/next.config.ts
  - frontend/src/config/api.config.ts

### configuration
- **Description**: Application configuration loaded from environment variables with Joi validation
- **Files**: 4 files
  - backend/src/configs/app.config.ts
  - backend/src/configs/env.validation.ts
  - backend/src/configs/db.config.ts
  - backend/src/configs/jwt.config.ts

### upload
- **Description**: upload module
- **Files**: 3 files
  - backend/src/modules/upload/upload.module.ts
  - backend/src/modules/upload/upload.controller.ts
  - backend/src/modules/upload/upload.service.ts

### frontend-store
- **Description**: Frontend Zustand state stores for auth, meeting, and notifications
- **Files**: 3 files
  - frontend/src/store/auth.store.ts
  - frontend/src/store/meeting.store.ts
  - frontend/src/store/notification.store.ts

### export
- **Description**: export module
- **Files**: 3 files
  - backend/src/modules/export/export.controller.ts
  - backend/src/modules/export/export.module.ts
  - backend/src/modules/export/export.service.ts

### logging
- **Description**: Structured logging with Winston, request logging interceptor, and request ID tracing
- **Files**: 2 files
  - backend/src/core/logger/logger.module.ts
  - backend/src/core/logger/logger.ts

### mail
- **Description**: mail module
- **Files**: 2 files
  - backend/src/modules/mail/mail.module.ts
  - backend/src/modules/mail/mail.service.ts

### frontend-context
- **Description**: Frontend React context providers for auth, sidebar, and meeting state
- **Files**: 2 files
  - frontend/src/context/AuthContext.tsx
  - frontend/src/context/SidebarContext.tsx

### validation
- **Description**: Request validation using class-validator pipes and custom validators
- **Files**: 2 files
  - backend/src/commons/pipes/parse-int.pipe.ts
  - backend/src/commons/pipes/validation.pipe.ts

### error-handling
- **Description**: Global exception filters for structured error responses
- **Files**: 2 files
  - backend/src/commons/filters/all-exception.filter.ts
  - backend/src/commons/filters/http-exception.filter.ts

### authorization
- **Description**: Role-based access control with @Roles() decorator and RolesGuard
- **Files**: 2 files
  - backend/src/commons/decorators/roles.decorator.ts
  - backend/src/commons/guards/role.guard.ts

### database
- **Description**: SQLite/PostgreSQL database access via Prisma ORM with global DatabaseService provider
- **Files**: 2 files
  - backend/src/core/database/database.module.ts
  - backend/src/core/database/database.provider.ts

### scheduler
- **Description**: Scheduled background tasks: auto grade-lock, draft cleanup, notification archiving, and auto-unenrollment
- **Files**: 2 files
  - backend/src/core/scheduler/scheduler.module.ts
  - backend/src/core/scheduler/scheduler.tasks.ts

### health
- **Description**: health module
- **Files**: 2 files
  - backend/src/modules/health/health.controller.ts
  - backend/src/modules/health/health.module.ts

## Top Files by Symbol Count

| File | Symbols | Exported | Functions | Classes | Centrality |
|------|---------|----------|-----------|---------|------------|
| backend/src/modules/student/student.service.ts | 92 | 0 | 0 | 2 | 0.0069 |
| backend/src/modules/class/class.service.ts | 74 | 0 | 2 | 4 | 0.0059 |
| backend/src/modules/grade/grade.service.ts | 70 | 0 |  |  | 0.0039 |
| frontend/src/app/admin/enrollment/enroll/page.tsx | 65 | 0 | 2 | 0 | 0 |
| backend/src/modules/academic-calendar/program-calendar/program-calendar.service.ts | 60 | 0 | 0 |  | 0.0039 |
| backend/src/modules/assessment/educator/assessment-educator.service.ts | 59 | 0 | 0 |  | 0.0079 |
| backend/src/modules/attendance/attendance.service.ts | 56 | 0 | 0 |  | 0.0079 |
| backend/src/modules/grade/educator/grade-educator.service.ts | 55 | 0 |  |  | 0.0039 |
| backend/src/modules/semester-template/semester-template.service.ts | 54 | 0 | 0 |  | 0.0029 |
| backend/src/modules/meeting/meeting.gateway.ts | 51 | 0 | 0 | 2 | 0.002 |
| frontend/src/components/educator/assessment-builder/Step3.tsx | 50 | 0 | 7 | 0 | 0.001 |
| backend/src/modules/educator/educator.service.ts | 50 | 0 | 0 |  | 0.0049 |
| backend/src/core/ai/ai.service.ts | 47 | 0 | 0 |  | 0.0049 |
| backend/src/modules/subject/subject.repository.ts | 46 | 0 | 0 |  | 0.002 |
| frontend/src/components/admin/semester-settings/assign-row/use-assign-row.ts | 46 | 0 |  | 0 | 0.002 |

## Top Files by Centrality

| File | Centrality | Fan-In | Fan-Out | Degree |
|------|------------|--------|---------|--------|
| backend/src/modules/org-seeder/org-seeder.service.ts | 0.0138 | 2 | 12 | 14 |
| backend/src/modules/lesson/lesson.module.ts | 0.0128 | 2 | 11 | 13 |
| backend/src/modules/audit-log/audit-log.service.ts | 0.0118 | 11 | 1 | 12 |
| backend/src/modules/org-seeder/org-seeder.module.ts | 0.0118 | 1 | 11 | 12 |
| frontend/src/components/admin/data-seeder/SeederCard.tsx | 0.0118 | 0 | 12 | 12 |
| backend/src/modules/org-seeder/seed-context.ts | 0.0108 | 11 | 0 | 11 |
| backend/src/modules/grade-lock/grade-lock.module.ts | 0.0108 | 0 | 11 | 11 |
| backend/src/app.module.ts | 0.0108 | 1 | 10 | 11 |
| backend/src/modules/class/class.module.ts | 0.0098 | 5 | 5 | 10 |
| backend/src/modules/lesson/lesson.service.ts | 0.0098 | 3 | 7 | 10 |
| backend/src/modules/org-seeder/seed-id.ts | 0.0098 | 10 | 0 | 10 |
| backend/src/modules/audit-log/audit-log.module.ts | 0.0088 | 6 | 3 | 9 |
| backend/src/modules/meeting/meeting.module.ts | 0.0088 | 0 | 9 | 9 |
| backend/src/modules/attendance/attendance.module.ts | 0.0088 | 3 | 6 | 9 |
| backend/src/modules/grade/grade.repository.ts | 0.0079 | 8 | 0 | 8 |

## Architecture Flow

### Backend (NestJS)
The application follows a modular NestJS architecture with layered domain modules:

1. **Entry Point** (main.ts) bootstraps the NestJS app with global pipes (ValidationPipe), filters (HttpExceptionFilter, AllExceptionFilter), interceptors (LoggingInterceptor, ResponseInterceptor), and security middleware (Helmet, CORS).

2. **Root Module** (AppModule) imports all domain modules:
   - **Core Infrastructure**: ConfigModule (env validation, app/db/jwt config), DatabaseModule (Prisma), LoggerModule (Winston), AiModule (OpenRouter), MailModule (nodemailer)
   - **Domain Modules**: AssessmentModule, ClassModule, GradeModule, LessonModule, MeetingModule, etc.
   - **Utility Modules**: HealthModule, UploadModule, ServeStaticModule
   - **SchedulerModule**: Cron jobs for auto-maintenance tasks

3. **Each Domain Module** follows the NestJS layered pattern:
   - **Module** -> wires dependencies and controllers
   - **Controller** -> handles HTTP routes with AuthGuard + RolesGuard
   - **Service** -> contains business logic, orchestrates operations
   - **Repository** -> data access via Prisma, scoped by org_id for multi-tenancy

4. **Auth Pipeline**: JWT tokens issued on login -> Passport JwtStrategy validates -> AuthGuard protects routes -> RolesGuard checks roles -> @CurrentUser() extracts user

5. **AI Pipeline**: Lesson detail -> AiService.extractConcepts/buildConcepts -> AiClientService calls OpenRouter -> JsonParser.parseJson -> ConceptValidator.validate -> stored for assessment generation

6. **Grade Computation**:
   - Assessments create submissions -> submissions graded (system/manual/hybrid)
   - GradeCoreService.computeWeightedScore aggregates by scheme categories
   - GradingScaleService.resolveGrade maps percentage to letter grade
   - GradeEducatorService manages publish/unlock/lock workflows

### Frontend (Next.js)
1. **API Layer** (frontend/src/api/): Axios client with auth interceptor, organized by portal (admin, educator, student, platform)
2. **Data Fetching** (frontend/src/hooks/): TanStack Query hooks wrapping API calls with caching and mutation
3. **State** (frontend/src/store/): Zustand stores for auth, meeting, notifications
4. **UI** (frontend/src/app/): Next.js App Router pages, each portal has its own layout with sidebar navigation
5. **Components** (frontend/src/components/): Portal-specific components and shared shadcn/ui primitives

### Real-Time Meeting Flow
1. Meeting creation -> Agora RTC channel created -> MeetingGateway (WebSocket) manages room state
2. WebSocket: presence, chat, WebRTC signaling relay, hand raise, reactions, presentation sync
3. Agora: video/audio streams, screen sharing
4. Educator controls: join request approval, participant management, presentation mode

## Concepts Glossary

| Concept | Description | Keywords | Files |
|---------|-------------|----------|-------|
| AI-Question-Generation | AI-powered assessment question generation with concept extraction, chunking, progress tracking, and preview workflows | AiService, AiClientService, concept, question, blueprint, generation, preview, OpenRouter | backend/src/core/ai/ai.service.ts, backend/src/core/ai/ai-client.service.ts, backend/src/core/ai/prompt-builder.util.ts, backend/src/core/ai/json-parser.util.ts, backend/src/core/ai/concept-validator.util.ts, backend/src/core/ai/constants.ts, backend/src/core/ai/types.ts, backend/src/modules/assessment/educator/assessment-generation.helper.ts |
| Assessment-Hybrid-Grading | Hybrid assessment grading mode combining auto-graded system questions with manually graded sections | hybrid, grading_mode, system, manual, AssessmentCoreService, mergeHybridScores, section_score | backend/src/modules/assessment/core/assessment-core.service.ts, backend/src/modules/grade/core/grade-core.service.ts, backend/src/modules/assessment/dto/assessment.dto.ts |
| Grade-Computation-Engine | Weighted grade computation with category breakdowns, hybrid score merging, grading scale resolution, and lock management | GradeCoreService, computeWeightedScore, buildCategoryBreakdown, resolveGrade, grade-lock, manual-score | backend/src/modules/grade/core/grade-core.service.ts, backend/src/modules/grade/grade.service.ts, backend/src/modules/grade/grade.repository.ts, backend/src/modules/grade-lock/grade-lock.service.ts, backend/src/modules/grading-scale/grading-scale.service.ts, backend/src/modules/grading-scheme/grading-scheme.service.ts |
| Multi-Tenant-Organization | Multi-tenant architecture where each organization has isolated data scoped by org_id throughout all queries | orgId, organization, school, tenant, platform | backend/src/modules/organization/organization.service.ts, backend/src/modules/platform/platform.service.ts, backend/src/modules/platform-registration/platform-registration.service.ts |
| Prisma-Data-Access | Database access layer using Prisma ORM with DatabaseService singleton and repository pattern across all modules | DatabaseService, PrismaClient, prisma, repository, PrismaPg, DATABASE_URL | backend/src/core/database/database.provider.ts, backend/src/core/database/database.module.ts |
| Real-Time-Meeting | Real-time video conferencing with WebRTC (Agora), WebSocket signaling, chat, reactions, screen sharing, and presentation sync | MeetingGateway, Agora, WebSocket, WebRTC, RTC, socket.io, chat, reaction, screen-share, presentation | backend/src/modules/meeting/meeting.gateway.ts, backend/src/modules/meeting/agora-token.service.ts, backend/src/modules/meeting/meeting.service.ts |
| JWT-Authentication | JWT-based authentication with access/refresh token rotation, Passport strategy, and guards | JwtService, JwtStrategy, AuthGuard, access_token, refresh_token, TokenPayload | backend/src/modules/auth/auth.service.ts, backend/src/modules/auth/auth.controller.ts, backend/src/modules/auth/strategies/jwt.strategy.ts, backend/src/commons/guards/auth.guard.ts, backend/src/commons/utils/token.util.ts, backend/src/configs/jwt.config.ts |
| Scheduled-Background-Jobs | Cron-based background jobs for auto grade-lock, submission cleanup, notification archiving, and enrollment management | SchedulerTasks, cron, @Cron, handleAutoGradeLock, handleCloseExpiredDrafts, handleNotificationArchiving, handleAutoUnenrollOnYearEnd | backend/src/core/scheduler/scheduler.tasks.ts, backend/src/core/scheduler/scheduler.module.ts |
| Role-Based-Access-Control | RBAC system with role guards, decorators, and multi-portal authorization (admin, educator, student, platform) | RolesGuard, Roles, ROLES_KEY, AuthGuard, role, admin, educator, student, platform_owner | backend/src/commons/guards/role.guard.ts, backend/src/commons/decorators/roles.decorator.ts, backend/src/commons/guards/auth.guard.ts |
| IPC-Communication | Inter-Process Communication between main and renderer processes via Electron ipcMain/ipcRenderer | ipcMain, ipcRenderer, contextBridge, handle, invoke |  |

## Edge Type Summary

| Type | Count | Description |
|------|-------|-------------|
| IMPORTS | 617 | Direct file import dependency |
| ORCHESTRATES | 1 | File coordinates or manages other files |

## Edge Type Distribution

- **IMPORTS**: 617 (99.8%)
- **ORCHESTRATES**: 1 (0.2%)

## Surprising Connections

- The **AI module** (backend/src/core/ai/) is used by both the **Lesson module** (concept extraction) and **Assessment module** (question generation), making it a cross-cutting intelligence layer.
- **Attendance** auto-triggers from **Submission** completion via AssessmentEducatorService.onSubmissionFinished -> AttendanceService.markPresentFromSubmission.
- **Grade Lock** interacts with **Grades**, **Grading Scales**, **Scheduler** (auto-lock), and **Notifications** (unlock request workflow).
- The **Meeting Gateway** (WebSocket) handles real-time events across multiple concerns: chat, WebRTC signaling, presentations, reactions, and screen sharing.
- **Orgunit Seeder** spans across **Courses**, **Grading Schemes**, **Grading Scales**, **Levels**, **Sections**, **Programs**, **Strands**, and **Subjects** - touching nearly every domain module.

## Notes

- The codebase is a **multi-tenant educational management platform** with three portals: Admin, Educator, and Student, plus a Platform super-admin layer.
- Architecture follows **Domain-Driven Design** with NestJS modules organizing business capabilities.
- **Prisma ORM** provides database access with SQLite/PostgreSQL support.
- **AI integration** (OpenRouter) powers automated lesson concept extraction and assessment question generation.
- **Real-time features** (video meetings, chat, presentations) use WebSocket (Socket.IO) and WebRTC (Agora).
- The frontend is a **Next.js** application with App Router, TanStack Query for data fetching, Zustand for state management, and shadcn/ui component library.
- Grade computation supports **three grading modes**: system (auto-graded), manual (educator-graded), and hybrid (mixed).
- The graph was **AI-generated** by reading source code and analyzing symbol/import relationships.
