================================================================================
  EDUTOOL FRONTEND — BUILD TODO
  Next.js 14 + Tailwind + shadcn/ui + Zustand + React Query
  Legend: [ ] not started  [~] in progress  [x] done
================================================================================


================================================================================
  PHASE 1 — PROJECT BOOTSTRAP
  Build this first. Nothing else works without it.
================================================================================

  [ ] 1.1  Init Next.js project
            npx create-next-app@latest next-frontend --typescript --tailwind --app

  [ ] 1.2  Install all dependencies
            @tanstack/react-query @tanstack/react-table
            zustand react-hook-form @hookform/resolvers zod
            axios socket.io-client agora-rtc-sdk-ng date-fns
            clsx tailwind-merge lucide-react

  [ ] 1.3  Init shadcn/ui
            npx shadcn@latest init
            Choose: Default style, CSS variables, yes to tailwind

  [ ] 1.4  Install shadcn components
            button input label card badge dialog sheet
            table tabs select separator toast dropdown-menu
            avatar skeleton tooltip popover command

  [ ] 1.5  Set up .env.local
            NEXT_PUBLIC_API_URL=http://localhost:5000
            NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
            NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id

  [ ] 1.6  Configure tailwind.config.ts
            - Font family (Inter or Geist)
            - Custom colors (brand, sidebar, surface)
            - Custom border radius to match shadcn theme
            - Dark mode: class strategy

  [ ] 1.7  Set up src/styles/globals.css
            - Tailwind base/components/utilities
            - shadcn CSS variable overrides
            - Scrollbar styling
            - Base font and background


================================================================================
  PHASE 2 — CORE CONFIG & CLIENT
  These are the foundation every API call and page depends on.
================================================================================

  [ ] 2.1  src/config/api.config.ts
            - NEXT_PUBLIC_API_URL export
            - NEXT_PUBLIC_SOCKET_URL export
            - NEXT_PUBLIC_AGORA_APP_ID export

  [ ] 2.2  src/api/client.ts
            - Axios instance with baseURL from api.config
            - Request interceptor: attach Bearer token from authStore
            - Response interceptor: on 401 → call refresh → retry original
            - On refresh fail → clear store → redirect /login

  [ ] 2.3  src/utils/token.util.ts
            - decodeJwt(token): TokenPayload
            - isTokenExpired(token): boolean
            - getTokenRole(token): Role

  [ ] 2.4  src/utils/date.util.ts
            - formatDate(date): string         e.g. "Mar 26, 2026"
            - formatDateTime(date): string     e.g. "Mar 26, 2026 2:00 PM"
            - relativeTime(date): string       e.g. "2 hours ago"
            - formatTime(date): string         e.g. "2:00 PM"

  [ ] 2.5  src/utils/role.util.ts
            - getRoleHomePath(role): string    returns portal home per role
            - isAdmin(role): boolean
            - isEducator(role): boolean
            - isStudent(role): boolean
            - isPlatformOwner(role): boolean

  [ ] 2.6  src/utils/validation.util.ts
            - Shared Zod schemas used across forms
            - emailSchema, passwordSchema, nameSchema
            - uuidSchema, dateSchema, percentageSchema

  [ ] 2.7  src/utils/csv.util.ts
            - downloadCsv(data, filename): void
            - parseCsvFile(file): Promise<Record<string, string>[]>


================================================================================
  PHASE 3 — TYPES
  All TypeScript interfaces. Build these before any hooks or components.
================================================================================

  [ ] 3.1  src/types/api.types.ts
            - ApiResponse<T>          { data: T, message: string }
            - PaginatedResponse<T>    { data: T[], total, page, limit }
            - ApiError                { message: string, statusCode: number }

  [ ] 3.2  src/types/auth.types.ts
            - Role enum               platform_owner | admin | educator | student
            - AuthUser                { id, email, role, orgId, name }
            - TokenPayload            JWT decoded shape

  [ ] 3.3  src/types/platform.types.ts
            - AdminAccount            { id, email, status, createdAt, password? }

  [ ] 3.4  src/types/admin/
            - organization.types.ts   Organization
            - school-year.types.ts    SchoolYear, SchoolYearStatus
            - level.types.ts          Level, LevelDefault
            - program.types.ts        Program
            - section.types.ts        Section
            - subject.types.ts        Subject
            - semester.types.ts       Semester, Term
            - calendar.types.ts       AcademicCalendar, CalendarEventType
            - grading-scale.types.ts  GradingScale, GradeRange
            - rubric.types.ts         Rubric, RubricCategory
            - class.types.ts          Class, ClassSchedule, Enrollment
            - educator.types.ts       Educator
            - student.types.ts        Student, StudentStatus
            - grade-lock.types.ts     GradeLock, GradeLockSetting
            - analytics.types.ts      AnalyticsOverview, EnrollmentBreakdown

  [ ] 3.5  src/types/educator/
            - lesson.types.ts         Lesson, LessonConcept, ConceptSection
            - assessment.types.ts     Assessment, Question, QuestionType
            - submission.types.ts     Submission, SubmissionAnswer, SubmissionStatus
            - attendance.types.ts     AttendanceSession, AttendanceRecord
            - grade.types.ts          Grade, ManualScore, GradeView
            - meeting.types.ts        Meeting, MeetingInvite, JoinRequest

  [ ] 3.6  src/types/student/
            - class.types.ts
            - assessment.types.ts
            - submission.types.ts
            - grade.types.ts
            - meeting.types.ts
            - transcript.types.ts     Transcript, TranscriptYear, TranscriptTerm


================================================================================
  PHASE 4 — ZUSTAND STORES
  Global client state. Build before AuthContext and hooks.
================================================================================

  [ ] 4.1  src/store/authStore.ts
            - state:   user: AuthUser | null, token: string | null, isLoading
            - actions: setUser(), setToken(), clearAuth()
            - persist: token in localStorage (or memory only — pick one)

  [ ] 4.2  src/store/notificationStore.ts
            - state:   notifications: Notification[], unreadCount: number
            - actions: setNotifications(), addNotification(), markAllRead()

  [ ] 4.3  src/store/meetingStore.ts
            - state:   participants, chatMessages, currentSlide, isPresenting
                       isConnected, localStream, remoteStreams
            - actions: addParticipant(), removeParticipant(), addMessage()
                       setSlide(), setPresenting(), reset()


================================================================================
  PHASE 5 — AUTH CONTEXT & PROVIDERS
================================================================================

  [ ] 5.1  src/context/AuthContext.tsx
            - On mount: read token from store → call GET /auth/me
            - Set user in authStore on success
            - Expose: user, isLoading, isAuthenticated, login(), logout()
            - login():  POST /auth/login → store token → set user
            - logout(): POST /auth/logout → clearAuth() → push /login

  [ ] 5.2  src/app/layout.tsx  (root layout)
            - Wrap with: QueryClientProvider, AuthContext, Toaster
            - Import globals.css
            - Set font

  [ ] 5.3  src/hooks/useAuth.ts
            - Reads from AuthContext
            - Returns: user, isLoading, isAuthenticated, login, logout

  [ ] 5.4  src/hooks/useRole.ts
            - Reads role from authStore
            - redirectIfUnauthorized(allowedRoles[]): void
            - Used in every portal layout


================================================================================
  PHASE 6 — API LAYER
  Build all API files before hooks. Hooks wrap these.
================================================================================

  [ ] 6.1  src/api/auth.api.ts
            login, logout, refresh, getMe

  [ ] 6.2  src/api/platform.api.ts
            getAdmins, getAdmin, createAdmin, blockAdmin,
            unblockAdmin, resetAdminPassword

  [ ] 6.3  src/api/admin/organization.api.ts       getOrg, updateOrg
  [ ] 6.4  src/api/admin/school-year.api.ts        getAll, create, update, activate, end
  [ ] 6.5  src/api/admin/level.api.ts              getDefaults, updateDefaults, getByYear, update
  [ ] 6.6  src/api/admin/program.api.ts            getAll, create, update, delete
  [ ] 6.7  src/api/admin/section.api.ts            getAll, create, update, delete
  [ ] 6.8  src/api/admin/subject.api.ts            getAll, create, update, lock, unlock
  [ ] 6.9  src/api/admin/semester.api.ts           getAll, create, update, delete (+ terms)
  [ ] 6.10 src/api/admin/academic-calendar.api.ts  getAll, create, update, delete
  [ ] 6.11 src/api/admin/grading-scale.api.ts      getAll, create, update
  [ ] 6.12 src/api/admin/rubric.api.ts             getDefault, updateDefault
  [ ] 6.13 src/api/admin/class.api.ts              getAll, create, update, archive, enroll, removeEnrollment
  [ ] 6.14 src/api/admin/educator.api.ts           getAll, getOne, create, update, delete, resetPassword
  [ ] 6.15 src/api/admin/student.api.ts            getAll, getOne, create, update, updateStatus,
                                                   resetPassword, bulkImport, downloadTemplate,
                                                   downloadCredentials, addEnrollment, removeEnrollment
  [ ] 6.16 src/api/admin/grade-lock.api.ts         getSetting, createSetting, updateSetting,
                                                   getLock, unlockOverride
  [ ] 6.17 src/api/admin/analytics.api.ts          getOverview, getEnrollmentBreakdown, getGradeAnalytics
  [ ] 6.18 src/api/admin/audit-log.api.ts          getAll (filtered)

  [ ] 6.19 src/api/educator/lesson.api.ts          getAll, getOne, create, update, delete, retriggerExtraction
  [ ] 6.20 src/api/educator/assessment.api.ts      getAll, getOne, create, update, delete,
                                                   updateQuestion, publish, unpublish
  [ ] 6.21 src/api/educator/submission.api.ts      getSubmissions, updateStatus, gradeEssay
  [ ] 6.22 src/api/educator/attendance.api.ts      getSessions, getSession, bulkSet, updateRecord
  [ ] 6.23 src/api/educator/grade.api.ts           getByClass, getByTerm, setManualScore
  [ ] 6.24 src/api/educator/rubric.api.ts          getLibrary, create, update, getClassRubric, assignToClass
  [ ] 6.25 src/api/educator/meeting.api.ts         getAll, getOne, create, update, delete, end,
                                                   respondToJoinRequest, getToken
  [ ] 6.26 src/api/educator/activity-log.api.ts    getAll (by classId)

  [ ] 6.27 src/api/student/class.api.ts            getAll, getOne
  [ ] 6.28 src/api/student/lesson.api.ts           getAll, getOne
  [ ] 6.29 src/api/student/assessment.api.ts       getAll, getOne, getResult
  [ ] 6.30 src/api/student/submission.api.ts       start, saveDraft, finish, getOwn
  [ ] 6.31 src/api/student/attendance.api.ts       getOwn
  [ ] 6.32 src/api/student/grade.api.ts            getOwn
  [ ] 6.33 src/api/student/meeting.api.ts          getAll, getOne, requestJoin, getToken
  [ ] 6.34 src/api/student/notification.api.ts     getAll, dismiss
  [ ] 6.35 src/api/student/transcript.api.ts       getOwn


================================================================================
  PHASE 7 — REACT QUERY HOOKS
  Build after API files. One hook file per domain.
================================================================================

  [ ] 7.1  src/hooks/platform/useAdmins.ts
  [ ] 7.2  src/hooks/admin/useOrganization.ts
  [ ] 7.3  src/hooks/admin/useSchoolYears.ts
  [ ] 7.4  src/hooks/admin/useLevels.ts
  [ ] 7.5  src/hooks/admin/usePrograms.ts
  [ ] 7.6  src/hooks/admin/useSections.ts
  [ ] 7.7  src/hooks/admin/useSubjects.ts
  [ ] 7.8  src/hooks/admin/useSemesters.ts
  [ ] 7.9  src/hooks/admin/useAcademicCalendar.ts
  [ ] 7.10 src/hooks/admin/useGradingScales.ts
  [ ] 7.11 src/hooks/admin/useRubric.ts
  [ ] 7.12 src/hooks/admin/useClasses.ts
  [ ] 7.13 src/hooks/admin/useEducators.ts
  [ ] 7.14 src/hooks/admin/useStudents.ts
  [ ] 7.15 src/hooks/admin/useGradeLock.ts
  [ ] 7.16 src/hooks/admin/useAnalytics.ts
  [ ] 7.17 src/hooks/admin/useAuditLog.ts

  [ ] 7.18 src/hooks/educator/useLessons.ts
  [ ] 7.19 src/hooks/educator/useAssessments.ts
  [ ] 7.20 src/hooks/educator/useSubmissions.ts
  [ ] 7.21 src/hooks/educator/useAttendance.ts
  [ ] 7.22 src/hooks/educator/useGrades.ts
  [ ] 7.23 src/hooks/educator/useRubricLibrary.ts
  [ ] 7.24 src/hooks/educator/useMeetings.ts
  [ ] 7.25 src/hooks/educator/useActivityLog.ts

  [ ] 7.26 src/hooks/student/useStudentClasses.ts
  [ ] 7.27 src/hooks/student/useStudentLessons.ts
  [ ] 7.28 src/hooks/student/useStudentAssessments.ts
  [ ] 7.29 src/hooks/student/useSubmission.ts
  [ ] 7.30 src/hooks/student/useStudentAttendance.ts
  [ ] 7.31 src/hooks/student/useStudentGrades.ts
  [ ] 7.32 src/hooks/student/useStudentMeetings.ts
  [ ] 7.33 src/hooks/student/useTranscript.ts

  [ ] 7.34 src/hooks/meeting/useMeetingSocket.ts
            - connect(meetingId, token)
            - disconnect()
            - sendChat(message)
            - raiseHand() / lowerHand()
            - sendReaction(emoji)
            - sendOffer / sendAnswer / sendIce (WebRTC relay)
            - changeSlide(slide) [educator only]
            - startPresentation / stopPresentation

  [ ] 7.35 src/hooks/meeting/useAgoraRTC.ts
            - joinChannel(channel, uid, token)
            - leave()
            - toggleMic() / toggleCamera()
            - startScreenShare() / stopScreenShare()
            - remoteUsers state


================================================================================
  PHASE 8 — SHARED COMPONENTS
  Build before any page or portal-specific component.
================================================================================

  [ ] 8.1  src/components/shared/DataTable.tsx
            TanStack Table wrapper. Props: columns, data, isLoading, pagination

  [ ] 8.2  src/components/shared/Pagination.tsx
            Page controls. Props: page, total, limit, onChange

  [ ] 8.3  src/components/shared/SearchInput.tsx
            Debounced search input. Props: value, onChange, placeholder

  [ ] 8.4  src/components/shared/StatusBadge.tsx
            Maps status string → color + label
            Covers: AccountStatus, EnrollmentStatus, SubmissionStatus, SchoolYearStatus

  [ ] 8.5  src/components/shared/ConfirmDialog.tsx
            Reusable shadcn Dialog with title, description, confirm/cancel

  [ ] 8.6  src/components/shared/EmptyState.tsx
            Icon + title + description + optional action button

  [ ] 8.7  src/components/shared/LoadingSpinner.tsx
            Centered spinner. Sizes: sm, md, lg

  [ ] 8.8  src/components/shared/ErrorBoundary.tsx
            React error boundary with fallback UI

  [ ] 8.9  src/components/shared/NotificationDropdown.tsx
            Bell icon + unread badge + dropdown list + dismiss button

  [ ] 8.10 src/components/shared/PageHeader.tsx
            Title + optional breadcrumb + right-side actions slot


================================================================================
  PHASE 9 — LAYOUT COMPONENTS
  Build after shared components. Every portal depends on these.
================================================================================

  [ ] 9.1  src/components/layout/TopBar.tsx
            Logo + page title + NotificationDropdown + user avatar menu
            (logout, profile display)

  [ ] 9.2  src/components/layout/PlatformSidebar.tsx
            Nav: Admins
            Shows: platform owner name

  [ ] 9.3  src/components/layout/AdminSidebar.tsx
            Nav: Dashboard, School Years, Programs, Sections, Subjects,
                 Semester Settings, Grading Scales, Rubric, Classes,
                 Educators, Students, Grade Lock, Audit Log

  [ ] 9.4  src/components/layout/EducatorSidebar.tsx
            Nav: My Classes (then inside class: Lessons, Assessments,
                 Attendance, Grades, Rubric, Meetings)
            Also: Rubric Library, Activity Log

  [ ] 9.5  src/components/layout/StudentSidebar.tsx
            Nav: My Classes, Meetings, Transcript

  [ ] 9.6  Portal layout files (each checks role via useRole())
            src/app/(platform)/platform/layout.tsx
            src/app/(admin)/admin/layout.tsx
            src/app/(educator)/educator/layout.tsx
            src/app/(student)/student/layout.tsx


================================================================================
  PHASE 10 — AUTH PAGES
================================================================================

  [ ] 10.1 src/app/(auth)/login/page.tsx
            - Single form: email + password
            - Calls login() from AuthContext
            - On success: redirects based on role via getRoleHomePath()
            - Shows error on bad credentials

  [ ] 10.2 src/app/page.tsx
            - If authenticated → redirect to role home
            - If not → redirect to /login


================================================================================
  PHASE 11 — PLATFORM OWNER PAGES
================================================================================

  [ ] 11.1 Admins list page
            - Searchable + paginated table (useAdmins hook)
            - Columns: Name, Email, Status, Created At, Actions
            - Actions: View, Block/Unblock, Reset Password
            - Create Admin button → CreateAdminDialog

  [ ] 11.2 Single Admin page
            - Profile card (name, email, status)
            - Show password (plain text from API)
            - Copy credentials button
            - Block / Unblock toggle
            - Reset Password button

  [ ] 11.3 src/components/platform/CreateAdminDialog.tsx
  [ ] 11.4 src/components/platform/AdminTable.tsx
  [ ] 11.5 src/components/platform/AdminCredentialsCard.tsx


================================================================================
  PHASE 12 — ADMIN PAGES
================================================================================

  [ ] 12.1  Dashboard         analytics cards (enrollment, classes, alerts)
  [ ] 12.2  Organization      name + description edit form
  [ ] 12.3  School Years      list + create + activate/end actions
  [ ] 12.4  School Year Detail  levels view + calendar tab
  [ ] 12.5  Academic Calendar  event list + create/edit/delete
  [ ] 12.6  Programs          list + create + update + delete
  [ ] 12.7  Sections          list + create + update + delete + capacity display
  [ ] 12.8  Subjects          list + create + update + lock/unlock toggle
  [ ] 12.9  Semester Settings  template list + term builder
  [ ] 12.10 Grading Scales    list + range editor (0–100 visual builder)
  [ ] 12.11 Rubric            default rubric editor (category + weight + type)
  [ ] 12.12 Classes           list + create + enrollment management
  [ ] 12.13 Educators         list + create + class assignment manager
  [ ] 12.14 Students list     search + filter + status filter + table
  [ ] 12.15 Student detail    profile + enrollments + status change + reset pw
  [ ] 12.16 Student transcript  read-only grouped view
  [ ] 12.17 Bulk Import       CSV wizard (download template → upload → validate → import)
  [ ] 12.18 Grade Lock        lock setting form + class lock status table + override
  [ ] 12.19 Audit Log         filterable log table (date, action, target)

  Components needed:
  [ ] 12.20 SchoolYearCard + StatusActions
  [ ] 12.21 StudentTable
  [ ] 12.22 StudentProfileForm    (dynamic — level-aware fields)
  [ ] 12.23 StudentStatusDialog
  [ ] 12.24 EnrollmentManager
  [ ] 12.25 BulkImportWizard      (step 1–5)
  [ ] 12.26 EducatorTable + Form
  [ ] 12.27 ClassAssignmentManager
  [ ] 12.28 ClassTable + ClassForm
  [ ] 12.29 GradingScaleRangeEditor
  [ ] 12.30 RubricEditor
  [ ] 12.31 GradeLockSettingForm + OverrideDialog


================================================================================
  PHASE 13 — EDUCATOR PAGES
================================================================================

  [ ] 13.1  Classes list       cards of assigned classes
  [ ] 13.2  Class overview     summary (subject, section, semester, students)
  [ ] 13.3  Lessons list       weekly calendar layout
  [ ] 13.4  Lesson detail      content + concept build viewer + re-extract button
  [ ] 13.5  Create/edit lesson form
  [ ] 13.6  Assessments list   table with status + release/end dates
  [ ] 13.7  Assessment builder stepper (7 steps from spec 14.3)
  [ ] 13.8  Assessment detail  question list + edit questions
  [ ] 13.9  Submissions view   per-student status + essay grading
  [ ] 13.10 Attendance weekly view   sessions grouped by week
  [ ] 13.11 Attendance session detail   bulk entry table
  [ ] 13.12 Grades view        default + clean toggle, per term
  [ ] 13.13 Rubric editor      class rubric (locked after first enrollment)
  [ ] 13.14 Rubric library     personal rubric list + create
  [ ] 13.15 Meetings list
  [ ] 13.16 Create/edit meeting form
  [ ] 13.17 Meeting detail     invite manager + join request panel
  [ ] 13.18 Meeting room       video + chat + controls
  [ ] 13.19 Activity log       event list per class

  Components needed:
  [ ] 13.20 LessonCard + LessonForm
  [ ] 13.21 WeekCalendar
  [ ] 13.22 ConceptBuildViewer
  [ ] 13.23 AssessmentBuilderStepper
  [ ] 13.24 ItemRangeConfigurator
  [ ] 13.25 QuestionEditor
  [ ] 13.26 SubmissionTable
  [ ] 13.27 EssayGrader
  [ ] 13.28 WeeklySessionList
  [ ] 13.29 AttendanceBulkEntry
  [ ] 13.30 GradeTable            (default + clean view toggle)
  [ ] 13.31 ManualScoreInput
  [ ] 13.32 GradeLockButton
  [ ] 13.33 MeetingCard + MeetingForm
  [ ] 13.34 InviteManager
  [ ] 13.35 JoinRequestPanel
  [ ] 13.36 MeetingRoom           (educator version)
  [ ] 13.37 VideoGrid             (Agora tiles)
  [ ] 13.38 ChatPanel             (socket.io)
  [ ] 13.39 ParticipantList
  [ ] 13.40 ReactionBar
  [ ] 13.41 ScreenShareOverlay
  [ ] 13.42 LessonPresentationView


================================================================================
  PHASE 14 — STUDENT PAGES
================================================================================

  [ ] 14.1  Classes list       enrolled class cards
  [ ] 14.2  Class overview
  [ ] 14.3  Lessons list
  [ ] 14.4  Lesson viewer      read-only content (no concept data)
  [ ] 14.5  Assessments list   status: not started / draft / submitted / result
  [ ] 14.6  Assessment taker   MCQ / TF / Identification / Essay + auto-save
  [ ] 14.7  Assessment result  score + published status
  [ ] 14.8  Attendance view    own session records
  [ ] 14.9  Grades view        published scores + locked final grade
  [ ] 14.10 Meetings list      invited + join request status
  [ ] 14.11 Meeting detail
  [ ] 14.12 Meeting room       student version (no educator controls)
  [ ] 14.13 Transcript         full history grouped by year → semester → term

  Components needed:
  [ ] 14.14 AssessmentCard
  [ ] 14.15 AssessmentTaker   (one active attempt, resume, auto-save, timer)
  [ ] 14.16 ResultView
  [ ] 14.17 GradeCard
  [ ] 14.18 TranscriptViewer
  [ ] 14.19 MeetingRoom       (student)
  [ ] 14.20 JoinRequestButton


================================================================================
  PHASE 15 — MEETING ROOM (REAL-TIME)
  Build last — most complex. Depends on all hooks and components above.
================================================================================

  [ ] 15.1  useMeetingSocket.ts    (Phase 7.34 — move here if not done)
  [ ] 15.2  useAgoraRTC.ts         (Phase 7.35 — move here if not done)
  [ ] 15.3  meetingStore.ts        (Phase 4.3 — move here if not done)
  [ ] 15.4  GET /meetings/:id/token   called on room entry for Agora token
  [ ] 15.5  Socket connect on room mount with meetingId + JWT
  [ ] 15.6  VideoGrid              remote + local Agora video tiles
  [ ] 15.7  ChatPanel              socket chat history + send
  [ ] 15.8  ParticipantList        online users + hand raised indicators
  [ ] 15.9  ReactionBar            emoji picker + broadcast
  [ ] 15.10 ScreenShareOverlay     awareness banner when someone shares
  [ ] 15.11 LessonPresentationView  slide sync (educator pushes, students follow)
  [ ] 15.12 Educator room controls  mute, end meeting, slide nav, kick
  [ ] 15.13 Student room controls   raise hand, react, chat only


================================================================================
  BUILD ORDER SUMMARY
================================================================================

  Phase  1   Project bootstrap + installs + env
  Phase  2   Core config, Axios client, utils
  Phase  3   All TypeScript types
  Phase  4   Zustand stores
  Phase  5   AuthContext + root layout + useAuth + useRole
  Phase  6   All API files
  Phase  7   All React Query hooks
  Phase  8   Shared components (table, pagination, badges, dialogs)
  Phase  9   Layout + sidebars + portal layouts
  Phase  10  Auth pages (login)
  Phase  11  Platform owner portal
  Phase  12  Admin portal
  Phase  13  Educator portal
  Phase  14  Student portal
  Phase  15  Meeting room (real-time video + chat)

  DO NOT skip phases. Each phase depends on the previous.
  Pages should ONLY be built using hooks and components from earlier phases.
  No inline fetching in page files — all data through hooks.
  No inline styles — all Tailwind classes, no arbitrary values where avoidable.


================================================================================
  CURRENT STATUS
================================================================================

  Backend                 COMPLETE (24/24 spec sections)
  Frontend Phase 1        [ ] not started
  Frontend Phase 2        [ ] not started
  Frontend Phase 3        [ ] not started
  Frontend Phase 4        [ ] not started
  Frontend Phase 5        [ ] not started
  Frontend Phase 6        [ ] not started
  Frontend Phase 7        [ ] not started
  Frontend Phase 8        [ ] not started
  Frontend Phase 9        [ ] not started
  Frontend Phase 10       [ ] not started
  Frontend Phase 11       [ ] not started
  Frontend Phase 12       [ ] not started
  Frontend Phase 13       [ ] not started
  Frontend Phase 14       [ ] not started
  Frontend Phase 15       [ ] not started


================================================================================
  EduTool Frontend TODO
================================================================================