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
            - Sortable columns
            - Empty state via EmptyState component
            - Loading state: LoadingSpinner overlay on table
            - Row selection support

  [ ] 8.2  src/components/shared/Pagination.tsx
            - Shows "Showing X–Y of Z results"
            - Page size selector (10 / 25 / 50)
            - Prev / Next + page number buttons

  [ ] 8.3  src/components/shared/SearchInput.tsx
            - Debounced (300ms) input
            - Clear button (×) when value present
            - Props: value, onChange, placeholder

  [ ] 8.4  src/components/shared/StatusBadge.tsx
            Maps status string → color + label
            Colors:
              Active / Present / Submitted / Passed   = green
              Pending / Draft / Upcoming               = yellow/amber
              Blocked / Dropped / Absent / Failed      = red
              Suspended / Late                         = orange
              Graduated / Ended / Archived             = gray
              Transferred                              = blue-gray
            Covers: AccountStatus, EnrollmentStatus, SubmissionStatus, SchoolYearStatus

  [ ] 8.5  src/components/shared/ConfirmDialog.tsx
            - Props: title, message, confirmLabel, cancelLabel, onConfirm, destructive?
            - Destructive=true: confirm button uses red/danger style
            - Always has Cancel button

  [ ] 8.6  src/components/shared/EmptyState.tsx
            - Icon + title + description + optional action button

  [ ] 8.7  src/components/shared/LoadingSpinner.tsx
            - Centered spinner. Sizes: sm, md, lg

  [ ] 8.8  src/components/shared/ErrorBoundary.tsx
            - React error boundary with fallback UI

  [ ] 8.9  src/components/shared/NotificationDropdown.tsx
            - Bell icon + unread count badge
            - Click: opens panel (dropdown or slide-in)
            - Panel: scrollable list, newest first
            - Each item: icon (type-based) | message text | relative timestamp
              (e.g. "2 hours ago")
            - No read/unread toggle — simple list per spec
            - "No notifications" empty state

  [ ] 8.10 src/components/shared/PageHeader.tsx
            - Title (h1) + optional breadcrumb (above title) + right-side actions slot
            - Actions slot: renders buttons passed as children/prop


================================================================================
  PHASE 9 — LAYOUT COMPONENTS
  Build after shared components. Every portal depends on these.
================================================================================

  [ ] 9.1  src/components/layout/TopBar.tsx
            LEFT:  EduTool logo / app name
            RIGHT: NotificationDropdown bell + user avatar menu
            User avatar menu (dropdown):
              - Shows user name
              - "My Profile" (view only)
              - "Logout" → clearAuth() + redirect /login
            Fixed top, full width

  [ ] 9.2  src/components/layout/PlatformSidebar.tsx
            Nav links:  Admins → /platform/admins
            Shows platform owner name at top
            Collapse button (toggles icon-only mode)
            Active link highlighted

  [ ] 9.3  src/components/layout/AdminSidebar.tsx
            Nav links (in order):
              Dashboard          /admin/dashboard
              Organization       /admin/organization
              School Years       /admin/school-years
              Programs           /admin/programs
              Sections           /admin/sections
              Subjects           /admin/subjects
              Semester Settings  /admin/semester-settings
              Grading Scales     /admin/grading-scales
              Rubric             /admin/rubric
              Classes            /admin/classes
              Educators          /admin/educators
              Students           /admin/students
              Grade Lock         /admin/grade-lock
              Audit Log          /admin/audit-log
            Collapse button, active link highlighted

  [ ] 9.4  src/components/layout/EducatorSidebar.tsx
            Top-level nav:
              My Classes         /educator/classes
              Rubric Library     /educator/rubric-library
              Activity Log       /educator/activity-log
            When inside a class (/educator/classes/[classId]/*):
              Show class-level sub-nav:
                Overview         /educator/classes/[classId]
                Lessons          /educator/classes/[classId]/lessons
                Assessments      /educator/classes/[classId]/assessments
                Attendance       /educator/classes/[classId]/attendance
                Grades           /educator/classes/[classId]/grades
                Rubric           /educator/classes/[classId]/rubric
                Meetings         /educator/classes/[classId]/meetings
            Collapse button, active link highlighted

  [ ] 9.5  src/components/layout/StudentSidebar.tsx
            Nav links:
              My Classes   /student/classes
              Meetings     /student/meetings
              Transcript   /student/transcript
            When inside a class (/student/classes/[classId]/*):
              Show class-level sub-nav:
                Overview     /student/classes/[classId]
                Lessons      /student/classes/[classId]/lessons
                Assessments  /student/classes/[classId]/assessments
                Attendance   /student/classes/[classId]/attendance
                Grades       /student/classes/[classId]/grades
            Collapse button, active link highlighted

  [ ] 9.6  Portal layout files (each checks role via useRole())
            src/app/(platform)/platform/layout.tsx
              - Renders: TopBar + PlatformSidebar + content
              - useRole(): redirects if role !== platform_owner

            src/app/(admin)/admin/layout.tsx
              - Renders: TopBar + AdminSidebar + content
              - useRole(): redirects if role !== admin

            src/app/(educator)/educator/layout.tsx
              - Renders: TopBar + EducatorSidebar + content
              - useRole(): redirects if role !== educator

            src/app/(student)/student/layout.tsx
              - Renders: TopBar + StudentSidebar + content
              - useRole(): redirects if role !== student


================================================================================
  PHASE 10 — AUTH PAGES
================================================================================

  [ ] 10.1 src/app/(auth)/login/page.tsx
            LAYOUT: Centered card, no sidebar, no topbar
            CONTENT:
              - EduTool logo at top
              - "Welcome back" heading
              - Email input (required)
              - Password input with show/hide toggle (required)
              - "Log in" button
                → Calls login() from AuthContext (POST /auth/login)
                → On success: reads role from JWT → getRoleHomePath() → redirect
                  platform_owner → /platform
                  admin          → /admin
                  educator       → /educator
                  student        → /student
                → On error: inline error below form "Invalid email or password."
              - No "Forgot password" link (Admin-managed only)
              - No "Sign up" link (no self-registration)

  [ ] 10.2 src/app/page.tsx
            - If authenticated → redirect to role home via getRoleHomePath()
            - If not authenticated → redirect to /login


================================================================================
  PHASE 11 — PLATFORM OWNER PAGES
================================================================================

  [ ] 11.1 src/app/(platform)/platform/admins/page.tsx
            LAYOUT: Topbar + PlatformSidebar ("Admins" active) + content
            PAGEHEADER: Title "Admin Accounts" | Action: "+ Create Admin" button
            CONTENT:
              SearchInput
                - Placeholder: "Search by name or email..."
                - Debounced filter on table
              AdminTable (DataTable)
                Columns: Full Name | Email | Status | Created Date | Actions
                Status: StatusBadge (Active=green, Blocked=red)
                Actions per row:
                  "View" → /platform/admins/[id]
                  "Reset Password"
                    → ConfirmDialog: "Reset password for [Name]?"
                    → On confirm: API call → success toast + AdminCredentialsCard modal
                  "Block" (if Active) / "Unblock" (if Blocked)
                    → ConfirmDialog with appropriate message
                    → On confirm: API call → row status updates
              Pagination (page, total, limit)
            "+ Create Admin" button:
              → Opens CreateAdminDialog modal
              → On success: AdminCredentialsCard modal shown

  [ ] 11.2 src/app/(platform)/platform/admins/[id]/page.tsx
            PAGEHEADER:
              Breadcrumb: Admins > [Name]
              Title: [Full Name]
              Actions:
                "Reset Password" → same ConfirmDialog + credentials flow
                "Block" / "Unblock" → same ConfirmDialog flow
            CONTENT:
              Info card: Full Name | Email | Educator ID | Status badge |
                         Created Date | Last Login
              Current Password section:
                "Show Password" button → reveals plain-text password inline
                "Copy" icon next to revealed password

  [ ] 11.3 src/components/platform/CreateAdminDialog.tsx
            Modal fields: Full Name (required), Email (required)
            "Create Account" button → POST /platform/admins
            On success: closes modal → AdminCredentialsCard shown
            Cancel button closes modal

  [ ] 11.4 src/components/platform/AdminTable.tsx
            Columns: Full Name, Email, StatusBadge, Created Date, Actions
            Actions: View link, Reset Password button, Block/Unblock button

  [ ] 11.5 src/components/platform/AdminCredentialsCard.tsx
            Shown after creation or password reset
            Displays: Full Name | Email | Generated Password (plain text)
            "Copy Credentials" button → copies formatted text to clipboard
            "Download CSV" button → downloadCsv() single-row
            "Done" button → closes modal, table refetches


================================================================================
  PHASE 12 — ADMIN PAGES
================================================================================

  [ ] 12.1 src/app/(admin)/admin/dashboard/page.tsx
            PAGEHEADER: Title "Dashboard"
            CONTENT:
              Row 1 — Summary stat cards (4 across):
                [Total Students] [Total Educators] [Active Classes] [Pending Students]
                Each card: icon, big number, label
                "Pending Students" card: if count > 0, warning color +
                  "Resolve →" link → /admin/students?status=Pending
              Row 2 — Enrollment Breakdown Table:
                Columns: Level Section | Program/Course | Year/Grade | Section |
                         Active | Pending | Total
              Row 3 — Grade Distribution (shown only after first grade lock):
                Per-term grade distribution summaries
              Row 4 — Pending Actions Panel:
                "Classes near auto-lock with unlocked grades"
                Rows: Class Title | Educator | Deadline | "View Class" link

  [ ] 12.2 src/app/(admin)/admin/organization/page.tsx
            PAGEHEADER: Title "Organization" | "Save Changes" button (shown when dirty)
            CONTENT:
              Form card:
                Organization Name (text input)
                Description (textarea)
              "Save Changes" → PATCH /admin/organization
              Success toast: "Organization updated."

  [ ] 12.3 src/app/(admin)/admin/school-years/page.tsx
            PAGEHEADER: Title "School Years" | "+ New School Year" button
            "+ New School Year":
              Modal/inline form: Title, Start Year, End Year
              On submit: creates as Pending → redirect to /admin/school-years/[id]
            CONTENT:
              List of SchoolYearCards
              Each card:
                Title | Status badge (Pending/Active/Ended) | Date range
                Actions:
                  "View" → /admin/school-years/[id]
                  SchoolYearStatusActions:
                    If Pending + no Active: "Set Active" button
                      → ConfirmDialog: "Activate this school year?"
                    If Active: "End School Year" button
                      → ConfirmDialog: "End this school year? It will become read-only."
                    If Ended: no action (read-only)

  [ ] 12.4 src/app/(admin)/admin/school-years/[id]/page.tsx
            PAGEHEADER:
              Breadcrumb: School Years > [Title]
              Title: [Year Title] + Status badge
            TABS: Overview | Levels | Calendar
            [Overview Tab]:
              Year title, status, dates
              Programs list with their semester template selections
              Each program row: Program Name | Semester Template | "Edit" link
            [Levels Tab → /school-years/[id]/levels]:
              Full level structure (inherited from Level Defaults)
              Expandable per level section → grade/year levels → sections + capacity
              "Edit Structure" button (if year not Ended) → inline editing
            [Calendar Tab → /school-years/[id]/calendar]:
              Table: Date | Event Type | Title | Notes
              "+ Add Event" button → modal:
                Date (date picker), Type (Holiday/No Class Day/Exam Week/Special Event),
                Title, Notes (optional)
                On save: retroactive warning if past date
              Each row: "Edit" icon | "Delete" icon (ConfirmDialog)

  [ ] 12.5 src/app/(admin)/admin/school-years/[id]/levels/page.tsx
            (Handled via tab in 12.4 above — or standalone page)
            Level structure editor for this specific year

  [ ] 12.6 src/app/(admin)/admin/school-years/[id]/calendar/page.tsx
            (Handled via tab in 12.4 above — or standalone page)
            Academic calendar event list + create/edit/delete

  [ ] 12.7 src/app/(admin)/admin/programs/page.tsx
            PAGEHEADER: Title "Programs" | "+ Add Program" (custom only)
            CONTENT:
              Cards or table:
                Built-in: Elementary, High School, Senior High, College
                Custom: Admin-added
              Each row: Name | Description | Type (built-in/custom)
                Actions: "View" → /admin/programs/[id]
                         "Delete" (custom only) → ConfirmDialog

  [ ] 12.8 src/app/(admin)/admin/programs/[id]/page.tsx
            Program title, description
            Courses/Strands table (if applicable):
              Columns: Name | Description | Max Year/Grade
              "+ Add Course/Strand" → inline form
              Each row: "Edit" (inline) | "Delete" (ConfirmDialog)
            Linked Subjects (read-only list with links)

  [ ] 12.9 src/app/(admin)/admin/sections/page.tsx
            PAGEHEADER: Title "Sections" | "+ New Section" button
            FILTER BAR: Level Section dropdown | Grade/Year Level | Course/Strand
            "+ New Section" → modal:
              Name, Level Section, Grade/Year Level, Course/Strand, Capacity
            DataTable:
              Columns: Name | Level Section | Grade/Year Level | Course/Strand |
                       Capacity | Students (current count) | Actions
              Actions: "View" | "Edit" (modal) | "Delete" (ConfirmDialog)

  [ ] 12.10 src/app/(admin)/admin/sections/[id]/page.tsx
            Section info card (Name, Level, Grade, Capacity)
            Capacity display: "X / Y students" progress bar
            "Edit" button → editable form inline
            Student list in this section (read-only, links to each student profile)

  [ ] 12.11 src/app/(admin)/admin/subjects/page.tsx
            PAGEHEADER: Title "Subjects" | "+ New Subject" button
            FILTER: Level Section | Year/Grade Level | Program
            "+ New Subject" → modal:
              Title, Year/Grade Level, Program/Course, Assigned Educator (dropdown),
              Grading System (dropdown)
            DataTable:
              Columns: Title | Level | Year/Grade | Educator | Grading System |
                       Lock Status | Actions
              Lock Status badge: Unlocked (green) / Locked (gray)
              Actions:
                "View" → /admin/subjects/[id]
                "Lock" / "Unlock" button (if applicable)
                  → Lock: ConfirmDialog "Lock this subject? It will become read-only."
                  → Unlock: only between years

  [ ] 12.12 src/app/(admin)/admin/subjects/[id]/page.tsx
            Subject info: title, year/grade, educator, grading system
            "Edit" button (if unlocked)
            Linked Classes table:
              Columns: Class Title | Section | Semester | Educator | Schedule
              "+ Add Class" link → class creation with subject pre-filled

  [ ] 12.13 src/app/(admin)/admin/semester-settings/page.tsx
            PAGEHEADER: Title "Semester Settings" | "+ New Template" button
            DataTable:
              Columns: Template Name | Semesters | Terms | Used By (programs count) | Actions
              Actions: "View" | "Edit" | "Delete" (ConfirmDialog, blocked if in use)

  [ ] 12.14 src/app/(admin)/admin/semester-settings/[id]/page.tsx
            Template name (editable)
            Semester list (up to 3):
              Each semester: Name, Start Date, End Date
              Under each: Terms list (Name, Order, drag-to-reorder, delete)
              "+ Add Term" button
              "+ Add Semester" button (max 3)
            Date overlap validation: inline error if overlap detected
            "Save" button

  [ ] 12.15 src/app/(admin)/admin/grading-scales/page.tsx
            PAGEHEADER: Title "Grading Scales" | "+ New Scale" button
            DataTable:
              Columns: Name | Level Section | Passing Threshold | Lock Status | Actions
              Actions: "View/Edit" | "Delete" (ConfirmDialog)

  [ ] 12.16 src/app/(admin)/admin/grading-scales/[id]/page.tsx
            Scale name input, Level Section assignment, Passing threshold input
            GradingScaleRangeEditor:
              Visual 0–100 range builder
              Rows: Score Range (min–max) | Grade Value | Remark | Passed/Failed toggle
              "+ Add Range" button
              Validation: full 0–100 coverage, no gaps/overlaps, inline errors
            Lock status banner: "Locked — first grade locked for this level this year"
              Inputs read-only when locked
            "Save" button (disabled if locked or invalid)

  [ ] 12.17 src/app/(admin)/admin/rubric/page.tsx
            PAGEHEADER: Title "Default Rubric"
            Subtitle: "This rubric is pre-applied to all new classes."
            RubricEditor:
              Category rows: Name | Weight (%) | Type (Assessment-linked/Manual)| Delete icon
              "+ Add Category" button
              Total weight display: "Total: XX% / 100%" (red if ≠ 100, green if = 100)
              "Save Rubric" button (disabled if total ≠ 100%)
            Lock guard banner (if any class has enrolled students):
              "This rubric is locked — remove all enrolled students first."
              Inputs become read-only

  [ ] 12.18 src/app/(admin)/admin/classes/page.tsx
            PAGEHEADER: Title "Classes" | "+ New Class" button
            FILTERS: Level | Semester | Educator | Status (Active/Archived)
            DataTable:
              Columns: Title | Level | Section | Semester | Term | Educator |
                       Schedule | Enrolled | Actions
              Schedule: e.g. "Mon / Wed — 9:00 AM"
              Enrolled: current student count
              Actions: "View" → /admin/classes/[id] | "Archive" (ConfirmDialog)

  [ ] 12.19 src/app/(admin)/admin/classes/[id]/page.tsx
            Class info card (all properties)
            "Edit" button (if not archived) → inline form with conflict validation:
              Inline error on weekday/time if:
                Same section has another class at same time/day
                Assigned educator is already in another class at that time
            Enrolled Students section:
              Table: Student Name | Student ID | Status
              "+ Enroll Student" button → search dialog:
                Search by name/ID → select student → confirm
                System validates: capacity, duplicate, active status
              Each row: "Remove" button
                → ConfirmDialog with warning if grades/submissions exist
            Capacity display: "X / Y enrolled" progress bar

  [ ] 12.20 src/app/(admin)/admin/educators/page.tsx
            PAGEHEADER: Title "Educators" | "+ New Educator" button
            SEARCH: by name or Educator ID
            "+ New Educator" → modal:
              Full Name (required), Email (required)
              On submit: POST → AdminCredentialsCard shown
            EducatorTable:
              Columns: Full Name | Educator ID | Email | Classes Assigned | Actions
              Actions: "View" → /admin/educators/[id] | "Reset Password"

  [ ] 12.21 src/app/(admin)/admin/educators/[id]/page.tsx
            PAGEHEADER:
              Breadcrumb: Educators > [Name]
              Title: [Full Name]
              Actions: "Reset Password" → ConfirmDialog → new credentials shown
            Profile card: Full Name | Educator ID | Email
            ClassAssignmentManager:
              Table: Class Title | Level | Schedule | Semester | School Year
              "+ Assign to Class" → search/select available classes
                On save: educator notified
              Each row: "Remove Assignment"
                → Blocked if class is active (error: "Reassign class first.")
            "Remove Educator" button (bottom):
              Blocked if active classes exist (inline error shown)
              ConfirmDialog if no active classes

  [ ] 12.22 src/app/(admin)/admin/students/page.tsx
            PAGEHEADER: Title "Students"
            FILTER BAR: Status | Level Section | Year/Grade Level | Section | Course/Strand
            SEARCH: by name or Student ID
            ACTION BUTTONS:
              "+ New Student" → StudentProfileForm modal
              "Import CSV" → /admin/students/import
              "Download Credentials CSV" → downloadCsv() all students
            StudentTable:
              Columns: Full Name | Student ID | Level | Year/Grade | Section | Status | Actions
              StatusBadge per row
              Actions: "View" → /admin/students/[id] | "Reset Password" (quick)

  [ ] 12.23 src/app/(admin)/admin/students/[id]/page.tsx
            PAGEHEADER:
              Breadcrumb: Students > [Name]
              Title: [Full Name] + Status badge
              Actions:
                "Edit Profile" (disabled if mid-semester, tooltip explains)
                "Reset Password" → ConfirmDialog → AdminCredentialsCard
                "Change Status" → StudentStatusDialog
            Pending warning banner (if status=Pending):
              "This student has no section assigned. Assign a section to activate."
            TABS: Profile | Enrollments | Transcript
            [Profile Tab]:
              Full Name, Email, Student ID
              Level Section, Grade/Year Level, Section, Course/Strand (dynamic by level)
            [Enrollments Tab]:
              Table: Subject | Class Title | Educator | Semester | Term | Status
              "+ Add Subject Enrollment" → enrollment search dialog:
                Search by title/subject/educator/semester
                On select: validate (no duplicate, capacity check)
                On confirm: enroll, educator notified
              Each row: "Remove Enrollment"
                → ConfirmDialog with warning if grades/submissions exist
            [Transcript Tab]:
              TranscriptViewer inline or link to /admin/students/[id]/transcript

  [ ] 12.24 src/app/(admin)/admin/students/[id]/transcript/page.tsx
            PAGEHEADER: Breadcrumb: Students > [Name] > Transcript
            TranscriptViewer:
              Grouped: School Year → Semester → Term → Subject
              Each entry: Subject Name | Term Grade | Final Grade | Remarks
              Read-only
            Print button (browser print / PDF)

  [ ] 12.25 src/app/(admin)/admin/students/import/page.tsx
            PAGEHEADER: "Bulk Student Import" | Back link to /admin/students
            BulkImportWizard — step indicator at top:

            Step 1 — Download Template
              "Download CSV Template" button (columns listed below)
              Template columns: Full Name, Student ID, Email, Level Section,
                Grade/Year Level, Section, Strand (SHS), Course (College/Custom)

            Step 2 — Upload CSV
              File drop zone (click to browse, .csv only)

            Step 3 — Validating (auto-advances)
              Spinner: "Validating rows..."

            Step 4 — Validation Report
              Summary: "X rows valid, Y rows have errors"
              Valid rows preview table (paginated)
              Error rows table: Row # | Data Preview | Error Reason
              Buttons:
                "Fix and Re-upload" → back to Step 2
                "Proceed with valid rows only" → Step 5

            Step 5 — Confirm Import
              "X students will be created. Proceed?"
              "Confirm Import" → Step 6

            Step 6 — Importing (progress bar / spinner)

            Step 7 — Results
              "X accounts created successfully."
              Capacity conflict warnings (students set to Pending)
              "Download Credentials CSV" button

            Step 8 — Done
              Link: "Back to Students list"
              Link: "Resolve Pending Students"

  [ ] 12.26 src/app/(admin)/admin/grade-lock/page.tsx
            PAGEHEADER: Title "Grade Lock"
            CONTENT:
              Active school year shown
              Class lock status table:
                Columns: Class Title | Educator | Semester | Term | Lock Status | Deadline
                Lock Status: Unlocked / Locked / Auto-Locked
              "Open Lock Window" button (per class or bulk):
                → GradeLockSettingForm modal:
                    Deadline date/time picker
                    "Open Window" → educators notified
              "Override Lock" button (per locked class):
                → GradeLockOverrideDialog:
                    "Unlock grades for [Class]?"
                    Reason input (required)
                    "Confirm Override" → logged in Audit Log

  [ ] 12.27 src/app/(admin)/admin/audit-log/page.tsx
            PAGEHEADER: Title "Audit Log"
            FILTER BAR: Date range picker | Action Type dropdown |
              Search by Student ID / Educator ID / Entity
            DataTable:
              Columns: Timestamp | Actor | Action Type | Target | Details
              Details: expandable row or tooltip
            Pagination
            "Export Audit Log CSV" button (filtered export)

  Components needed:
  [ ] 12.28 src/components/admin/school-year/SchoolYearCard.tsx
  [ ] 12.29 src/components/admin/school-year/SchoolYearStatusActions.tsx
  [ ] 12.30 src/components/admin/students/StudentTable.tsx
  [ ] 12.31 src/components/admin/students/StudentProfileForm.tsx
            Dynamic form — selecting Level Section reveals correct fields:
              Elementary/HS: Grade Level + Section
              Senior High:   Grade Level + Strand + Section
              College:       Year Level + Course + Section
              Custom:        Year Level + Program + Section
            Section/Strand/Course dropdowns: only shows org's existing records
  [ ] 12.32 src/components/admin/students/StudentStatusDialog.tsx
            Current status shown | New status dropdown
            Reverting Dropped/Transferred/Graduated → Active:
              Extra confirmation checkbox required
            Optional note field | "Update Status" button
  [ ] 12.33 src/components/admin/students/EnrollmentManager.tsx
  [ ] 12.34 src/components/admin/students/BulkImportWizard.tsx
  [ ] 12.35 src/components/admin/educators/EducatorTable.tsx
  [ ] 12.36 src/components/admin/educators/EducatorForm.tsx
  [ ] 12.37 src/components/admin/educators/ClassAssignmentManager.tsx
  [ ] 12.38 src/components/admin/classes/ClassTable.tsx
  [ ] 12.39 src/components/admin/classes/ClassForm.tsx
            Schedule + conflict validation inline
  [ ] 12.40 src/components/admin/grading-scale/GradingScaleRangeEditor.tsx
            Visual 0–100 range builder with gap/overlap validation
  [ ] 12.41 src/components/admin/rubric/RubricEditor.tsx
            Category weights + lock guard
  [ ] 12.42 src/components/admin/grade-lock/GradeLockSettingForm.tsx
  [ ] 12.43 src/components/admin/grade-lock/GradeLockOverrideDialog.tsx


================================================================================
  PHASE 13 — EDUCATOR PAGES
================================================================================

  [ ] 13.1 src/app/(educator)/educator/classes/page.tsx
            PAGEHEADER: Title "My Classes" | Filter: Semester, School Year
            CONTENT:
              Grid of class cards (or table):
                Each card: Class Title | Level/Section | Schedule |
                           Semester/Term | Student count | "Open" button
                "Open" → /educator/classes/[classId]

  [ ] 13.2 src/app/(educator)/educator/classes/[classId]/page.tsx
            SUB-NAV TABS: Overview | Lessons | Assessments | Attendance | Grades | Rubric | Meetings
            [Overview — default]:
              Class info card (all properties, read-only)
              Enrolled Students table: Name | Student ID | Status
              Quick stats: total students | pending essay grades | unread submissions

  [ ] 13.3 src/app/(educator)/educator/classes/[classId]/lessons/page.tsx
            PAGEHEADER: Title "Lessons" | "+ New Lesson" → /lessons/new
            WeekCalendar:
              Organized by week (Week 1, Week 2, ...)
              Each week row expandable → LessonCards
              LessonCard: Title | Week | Concept Build status badge
                (None / Extracted / Outdated)
                "View/Edit" → /lessons/[lessonId]

  [ ] 13.4 src/app/(educator)/educator/classes/[classId]/lessons/new/page.tsx
            LessonForm:
              Title (required)
              Description (optional)
              Week Assignment (dropdown of available weeks)
              Lesson Detail (textarea, min 10 words, word counter shown)
            "Save" button:
              On save: auto-triggers concept extraction (background)
              Toast: "Lesson saved. Concept extraction running..."
              In-app notification on completion

  [ ] 13.5 src/app/(educator)/educator/classes/[classId]/lessons/[lessonId]/page.tsx
            PAGEHEADER:
              Breadcrumb: Lessons > [Title]
              "Edit Lesson" button → enables inline editing
                On save with changed Lesson Detail + existing concept build:
                  Banner: "Content updated. Re-extract concepts?"
                  "Re-extract" button → triggers extraction, replaces old build
                  Warning: "Re-extraction does not affect already-generated assessments."
              "Delete Lesson" → ConfirmDialog
            ConceptBuildViewer section:
              States:
                No build: "No concept build yet. Save lesson content (10+ words) to trigger extraction."
                Building: spinner + "Extracting concepts..."
                Ready: sections with keyword counts (e.g. Stack: 5 | Queue: 6 | ...)
              "Use in Assessment" button → /assessments/new?lessonId=[id]

  [ ] 13.6 src/app/(educator)/educator/classes/[classId]/assessments/page.tsx
            PAGEHEADER: Title "Assessments" | "+ New Assessment" button
            FILTER: Type (Quiz/Activity/Exam/Custom) | Term
            DataTable:
              Columns: Title | Type | Term | Release Date | End Date |
                       Submitted (X/total) | Pending Essays | Actions
              Actions:
                "View" → /assessments/[id]
                "Submissions" → /assessments/[id]/submissions
                "Delete" → ConfirmDialog with strong warning:
                  "This will permanently delete all submitted scores.
                   Final grades will recompute."

  [ ] 13.7 src/app/(educator)/educator/classes/[classId]/assessments/new/page.tsx
            AssessmentBuilderStepper — 7-step, progress indicator at top

            Step 1 — Select Lesson
              List of class lessons with concept build status
              Grayed out if no concept build (tooltip: "No concept build")
              "Next" button

            Step 2 — View Concept Build
              ConceptBuildViewer (read-only)
              Sections + item counts available
              "Next" button

            Step 3 — Basic Configuration
              Title | Type (Quiz/Activity/Exam/Custom) | Term
              Total Items (number input)
                Validates: cannot exceed concept build total
                Inline error: "Cannot exceed [X] available items."
              "Next" button

            Step 4 — Configure Item Ranges
              ItemRangeConfigurator:
                Each range row:
                  Start # (auto-filled) | End # | Question Type | Concept Sections (multi-select)
                  Shows available count per section
                  Validates: selected sections total ≥ range item count
                "+ Add Range" button
                Validation: all items 1→Total must be covered
              "Next" button

            Step 5 — Generate
              Summary of config shown
              "Generate Questions" button → background job
              Spinner: "Generating assessment questions..."
              Auto-advances to Step 6 on completion
              (In-app notification also sent)

            Step 6 — Review & Edit Generated Questions
              QuestionEditor:
                Questions grouped by range
                Each question:
                  Question text (editable input)
                  MCQ: choice A/B/C/D + correct answer radio
                  True/False: T/F toggle
                  Identification/Enumeration/Essay: answer input
                Banner: "Edit questions before publishing. After release date, questions lock."
              "Next" button

            Step 7 — Set Dates & Assign
              Release Date (date-time picker)
              End Date (date-time picker, must be > Release Date)
              Assign To: "All enrolled students" (default) or "Selected students" (checklist)
              "Publish Assessment" button:
                On save: assessment created
                Students notified on release date (scheduled)
                Redirects to /assessments/[id]

  [ ] 13.8 src/app/(educator)/educator/classes/[classId]/assessments/[assessmentId]/page.tsx
            PAGEHEADER:
              Breadcrumb: Assessments > [Title]
              Badges: Type | Term | Status (Upcoming/Open/Closed)
              Actions:
                "Edit Questions" (before release date only) → back to Step 6 view
                "View Submissions" → /submissions
                "Delete" → ConfirmDialog with warning
            CONTENT:
              Release Date / End Date
              Total Items
              Assigned students count / submitted count
              Question list (read-only after release)

  [ ] 13.9 src/app/(educator)/educator/classes/[classId]/assessments/[assessmentId]/submissions/page.tsx
            PAGEHEADER: Title "Submissions — [Assessment Title]"
            Publish controls: "Publish All" button | "Unpublish All" button
            SubmissionTable:
              Columns: Student Name | Status | Score | Published | Essay Graded | Actions
              Status: NULL/Draft/Submitted/Exempted/Custom Score
              Actions:
                "Grade Essay" (if essay + not graded)
                  → EssayGrader panel (sidebar or modal):
                      Student name | Question text | Student response (read-only) |
                      Score input (0 to max) | Feedback textarea | "Save Score" button
                "Set Status" (override: Exempted/Custom Score/NULL)
                  → Small modal: status dropdown + score input (if Custom)
                "Publish" / "Unpublish" toggle per student

  [ ] 13.10 src/app/(educator)/educator/classes/[classId]/attendance/page.tsx
            PAGEHEADER: Title "Attendance"
            Week navigator: "< Week 3 >" prev/next buttons
            WeeklySessionList:
              Current week sessions listed (e.g. Session 3.1, Session 3.2)
              Each row: Date | Weekday label | "View / Edit" → /attendance/[sessionId]

  [ ] 13.11 src/app/(educator)/educator/classes/[classId]/attendance/[sessionId]/page.tsx
            PAGEHEADER: Title "Attendance — [Date] Session [X.X]" | "Save All" button
            AttendanceBulkEntry:
              Table: Student Name | Status (radio/dropdown: Present/Absent/Late/Excused)
              "Mark All Present" quick-action at top
              Auto-filled rows if student submitted assessment that day (Present set)
              Educator can override any auto-set status
              "Save All" → saves entire table at once

  [ ] 13.12 src/app/(educator)/educator/classes/[classId]/grades/page.tsx
            PAGEHEADER: Title "Grades"
            Term selector: tab row (Prelim | Midterm | Pre-Finals | Finals)
            View toggle: "Default View" / "Clean View"
            Action: "Lock Grades" button (only within lock window)
              → GradeLockButton → ConfirmDialog:
                  If ungraded essays: "X essays are ungraded. Lock anyway?"
                  Final confirm → grades locked → students notified

            Default View (GradeTable):
              Columns: Student Name | [each assessment] | [manual categories] | Term Grade
              Scores: "earned/total" (e.g. 19/20)
              Manual entry cells (Attendance, Behavior, etc.): editable inline (click to type)
              Term Grade: computed, read-only

            Clean View (GradeTable):
              Assessments collapsed to category totals
              Columns: Student Name | Activities | Quizzes | Exam |
                       [manual categories] | Term Grade

            ManualScoreInput:
              Click manual category cell → input activates
              Tab to move to next student
              Save on blur

  [ ] 13.13 src/app/(educator)/educator/classes/[classId]/grades/[termId]/page.tsx
            Same as 13.12 but filtered to specific term (for deep link)

  [ ] 13.14 src/app/(educator)/educator/classes/[classId]/rubric/page.tsx
            PAGEHEADER: Title "Rubric — [Class Title]"
            Options at top:
              "Use Admin Default" → ConfirmDialog → resets to Admin default
              "Import from Library" → opens rubric library picker modal
              "Save as New Template" → saves to library (name input modal)
            RubricEditor (same as Admin version, class-scoped)
            Lock guard: "Rubric locked — first student enrolled." (read-only)

  [ ] 13.15 src/app/(educator)/educator/classes/[classId]/meetings/page.tsx
            PAGEHEADER: Title "Meetings" | "+ New Meeting" button
            List of MeetingCards:
              Each: Title | Start Date/Time | Invited count | Status badge
                    (Upcoming/Live/Ended)
              Actions:
                "View" → /meetings/[meetingId]
                "Enter Room" (if Live) → /meetings/[meetingId]/room

  [ ] 13.16 src/app/(educator)/educator/classes/[classId]/meetings/new/page.tsx
            MeetingForm:
              Title (required)
              Description (optional)
              Start Date/Time (date-time picker)
              Invite: "All students" toggle or student checklist
            "Save Meeting" → invited students notified

  [ ] 13.17 src/app/(educator)/educator/classes/[classId]/meetings/[meetingId]/page.tsx
            Meeting info: title, time, description, class
            InviteManager: invited students list, add/remove invite
            JoinRequestPanel:
              Non-invited students who requested
              Each row: Student Name | "Accept" | "Decline" buttons
            "Enter Room" button (enabled when start time reached)
              → /meetings/[meetingId]/room
            "Edit" button (before meeting starts)

  [ ] 13.18 src/app/(educator)/educator/classes/[classId]/meetings/[meetingId]/room/page.tsx
            LAYOUT: Full-screen, no sidebar, minimal topbar (End Meeting button only)
            MeetingRoom (educator):
              Main area: VideoGrid (Agora video tiles, grid layout)
              Right panel (toggleable): ChatPanel
                socket.io messages, newest at bottom, text input + send
              Bottom toolbar:
                Mic toggle (mute/unmute self)
                Camera toggle (on/off)
                Screen Share → ScreenShareOverlay activates
                Reactions → ReactionBar (emoji reactions broadcast)
                Participants → ParticipantList panel:
                  Online users | Hand-raised indicators | Mute controls (educator)
                Lesson Presentation → LessonPresentationView:
                  Lesson content full-screen to all participants
                  Educator controls forward/back nav — all follow in real time
              "End Meeting" button (top right, educator only):
                → ConfirmDialog → ends session for all

  [ ] 13.19 src/app/(educator)/educator/rubric-library/page.tsx
            PAGEHEADER: Title "Rubric Library" | "+ New Template" button
            List of saved rubric templates:
              Each: Template Name | Categories summary | Actions
              Actions:
                "Apply to Class" → class picker modal
                "Edit" → RubricEditor modal with name field
                "Delete" → ConfirmDialog

  [ ] 13.20 src/app/(educator)/educator/activity-log/page.tsx
            PAGEHEADER: Title "Activity Log"
            FILTER: Class | Event Type | Date range
            DataTable:
              Columns: Timestamp | Event Type | Class | Details
            Pagination

  Components needed:
  [ ] 13.21 src/components/educator/lessons/LessonCard.tsx
  [ ] 13.22 src/components/educator/lessons/LessonForm.tsx
  [ ] 13.23 src/components/educator/lessons/ConceptBuildViewer.tsx
            Sections + keyword counts display, states: empty/loading/ready
  [ ] 13.24 src/components/educator/lessons/WeekCalendar.tsx
            Expandable week rows with lesson cards
  [ ] 13.25 src/components/educator/assessments/AssessmentBuilderStepper.tsx
            7-step stepper with progress indicator
  [ ] 13.26 src/components/educator/assessments/ItemRangeConfigurator.tsx
            Range rows with concept section multi-select + validation
  [ ] 13.27 src/components/educator/assessments/QuestionEditor.tsx
            Per-type editing (MCQ/TF/Identification/Essay)
  [ ] 13.28 src/components/educator/assessments/SubmissionTable.tsx
  [ ] 13.29 src/components/educator/assessments/EssayGrader.tsx
            Question + student response (read-only) + score + feedback
  [ ] 13.30 src/components/educator/attendance/WeeklySessionList.tsx
  [ ] 13.31 src/components/educator/attendance/AttendanceBulkEntry.tsx
            Table with radio/dropdown per student, Mark All Present, Save All
  [ ] 13.32 src/components/educator/grades/GradeTable.tsx
            Default + Clean view toggle, editable manual score cells
  [ ] 13.33 src/components/educator/grades/ManualScoreInput.tsx
            Inline cell editor with tab-to-next-student
  [ ] 13.34 src/components/educator/grades/GradeLockButton.tsx
            Lock button with essay warning + confirmation flow
  [ ] 13.35 src/components/educator/meetings/MeetingCard.tsx
  [ ] 13.36 src/components/educator/meetings/MeetingForm.tsx
  [ ] 13.37 src/components/educator/meetings/InviteManager.tsx
  [ ] 13.38 src/components/educator/meetings/JoinRequestPanel.tsx
  [ ] 13.39 src/components/educator/meetings/room/MeetingRoom.tsx
            Root room component (educator version)
  [ ] 13.40 src/components/educator/meetings/room/VideoGrid.tsx
            Agora video tiles in grid
  [ ] 13.41 src/components/educator/meetings/room/ChatPanel.tsx
            socket.io chat history + input
  [ ] 13.42 src/components/educator/meetings/room/ParticipantList.tsx
            Online users + hand-raised + educator mute controls
  [ ] 13.43 src/components/educator/meetings/room/ReactionBar.tsx
            Emoji picker + broadcast
  [ ] 13.44 src/components/educator/meetings/room/ScreenShareOverlay.tsx
            Awareness banner when someone shares
  [ ] 13.45 src/components/educator/meetings/room/LessonPresentationView.tsx
            Slide sync — educator pushes, all participants follow


================================================================================
  PHASE 14 — STUDENT PAGES
================================================================================

  [ ] 14.1 src/app/(student)/student/classes/page.tsx
            PAGEHEADER: Title "My Classes" | Filter: Semester
            Grid of class cards:
              Each: Subject/Class Title | Educator name | Schedule |
                    Semester/Term | "Open" → /student/classes/[classId]

  [ ] 14.2 src/app/(student)/student/classes/[classId]/page.tsx
            SUB-NAV TABS: Overview | Lessons | Assessments | Attendance | Grades
            [Overview]:
              Class info (subject, educator, schedule)
              Upcoming assessments (next 2–3 with release/end dates)
              Latest grade summary (if published)

  [ ] 14.3 src/app/(student)/student/classes/[classId]/lessons/page.tsx
            PAGEHEADER: Title "Lessons"
            Lesson list organized by week (read-only calendar view)
            Each lesson: Title | Week | "View" button

  [ ] 14.4 src/app/(student)/student/classes/[classId]/lessons/[lessonId]/page.tsx
            Lesson title
            Lesson Detail content (full, read-only)
            No concept build visible to students
            Navigation: "← Previous Lesson" / "Next Lesson →"

  [ ] 14.5 src/app/(student)/student/classes/[classId]/assessments/page.tsx
            PAGEHEADER: Title "Assessments"
            DataTable or card list:
              Fields: Title | Type | Term | Release Date | End Date | Status | Score
              Status badge:
                Not Yet Open / Open / Submitted / Missed / Draft / Exempted
              Score: shown only if published by educator
              Actions:
                Open → "Take Assessment" → /assessments/[id]
                Submitted + score published → "View Result" → /assessments/[id]/result
                Draft → "Resume" → /assessments/[id]

  [ ] 14.6 src/app/(student)/student/classes/[classId]/assessments/[assessmentId]/page.tsx
            LAYOUT: Clean focus mode (sidebar collapsed during active attempt)
            PAGEHEADER: [Assessment Title] | Countdown timer to End Date
            AssessmentTaker:
              Question navigator (numbered sidebar or top strip):
                Each #: answered (filled) / unanswered / flagged
              Question area:
                Question text
                Answer input by type:
                  MCQ: radio A/B/C/D
                  True/False: True / False radio
                  Identification: text input
                  Enumeration: numbered text inputs
                  Essay: large textarea
              Navigation: "Previous" / "Next" buttons
              "Flag for Review" toggle per question
              Auto-save indicator: "All answers saved" / "Saving..."
                → Debounced auto-save on answer change
                → Auto-saves on disconnect, restores on reconnect
              "Submit Assessment" button:
                → ConfirmDialog: "Submit now? Unanswered: X questions."
                → On confirm: attempt marked Submitted
                → Redirects to result page (if published) or confirmation page
            Attempt guard:
              On load: check for existing Active attempt
              If existing: resume from last saved state (no new attempt)
              If submitted: read-only — no re-entry

  [ ] 14.7 src/app/(student)/student/classes/[classId]/assessments/[assessmentId]/result/page.tsx
            ResultView:
              Score: [earned] / [total] (only if published)
              Per-question breakdown (if enabled by educator)
              Essay questions: "Pending grading" or graded score + feedback
              "Back to Assessments" link

  [ ] 14.8 src/app/(student)/student/classes/[classId]/attendance/page.tsx
            PAGEHEADER: Title "My Attendance"
            Read-only weekly view:
              Table: Week | Session | Date | Status (Present/Absent/Late/Excused)
              Summary row: totals per status type

  [ ] 14.9 src/app/(student)/student/classes/[classId]/grades/page.tsx
            PAGEHEADER: Title "My Grades"
            GradeCard per term (Prelim, Midterm, etc.):
              Each card:
                Term name
                Per-assessment scores (published only)
                Manual category scores (if published)
                Computed term grade (shown only after grade lock)
            Final Subject Grade (shown only after grade lock):
              Grade value | Remark (Passed/Failed) | Grading scale label

  [ ] 14.10 src/app/(student)/student/meetings/page.tsx
            PAGEHEADER: Title "Meetings"
            Table: Title | Class | Start Time | Status | Action
            Status: Upcoming / Live / Ended
            Actions:
              Invited + Live: "Join" → /meetings/[meetingId]/room
              Not invited: "Request to Join" → sends request → "Request Sent" (pending)
              Ended: "View Details" (no room access)

  [ ] 14.11 src/app/(student)/student/meetings/[meetingId]/page.tsx
            Meeting title, description, start time, class
            If invited: "Join Room" button (enabled when live)
            If not invited: "Request to Join" / pending state display

  [ ] 14.12 src/app/(student)/student/meetings/[meetingId]/room/page.tsx
            LAYOUT: Full-screen room, no sidebar
            MeetingRoom (student version):
              Same layout as educator room
              Student controls:
                Mic toggle | Camera toggle | Screen Share | Reactions
                Participants list (view-only, no mute controls)
              No "End Meeting" button (educator-only)
              Lesson nav follows educator — student cannot control slides
              No JoinRequestPanel (student is inside)

  [ ] 14.13 src/app/(student)/student/transcript/page.tsx
            PAGEHEADER: Title "Transcript"
            TranscriptViewer:
              Grouped: School Year → Semester → Term → Subject
              Each entry: Subject Name | Term Grade | Final Subject Grade |
                          Grading Scale Remark | Status
              Collapse/expand per school year
            Print button (browser print / PDF export)

  Components needed:
  [ ] 14.14 src/components/student/assessments/AssessmentCard.tsx
  [ ] 14.15 src/components/student/assessments/AssessmentTaker.tsx
            One active attempt, resume on reconnect, auto-save, timer, flag for review
  [ ] 14.16 src/components/student/assessments/ResultView.tsx
  [ ] 14.17 src/components/student/grades/GradeCard.tsx
            Per-term card with published scores + locked grade
  [ ] 14.18 src/components/student/transcript/TranscriptViewer.tsx
            Collapsible year/semester/term grouping
  [ ] 14.19 src/components/student/meetings/room/MeetingRoom.tsx
            Student room (shares video/chat logic, no educator controls)
  [ ] 14.20 src/components/student/meetings/room/JoinRequestButton.tsx
            Send join request + pending state


================================================================================
  PHASE 15 — MEETING ROOM (REAL-TIME)
  Build last — most complex. Depends on all hooks and components above.
================================================================================

  [ ] 15.1  src/hooks/meeting/useMeetingSocket.ts    (Phase 7.34)
  [ ] 15.2  src/hooks/meeting/useAgoraRTC.ts         (Phase 7.35)
  [ ] 15.3  src/store/meetingStore.ts                (Phase 4.3)
  [ ] 15.4  GET /meetings/:id/token endpoint call on room entry (Agora token)
  [ ] 15.5  Socket connect on room mount with meetingId + JWT
  [ ] 15.6  VideoGrid (remote + local Agora tiles)
  [ ] 15.7  ChatPanel (socket chat history + send)
  [ ] 15.8  ParticipantList (online users + hand raised indicators)
  [ ] 15.9  ReactionBar (emoji picker + broadcast)
  [ ] 15.10 ScreenShareOverlay (awareness banner when someone shares)
  [ ] 15.11 LessonPresentationView (slide sync: educator pushes, students follow)
  [ ] 15.12 Educator room controls: mute others, end meeting, slide nav, kick
  [ ] 15.13 Student room controls: raise hand, react, chat only
            No end meeting, no slide control (follow educator)


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