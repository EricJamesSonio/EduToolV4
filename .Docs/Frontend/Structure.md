next-frontend/
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── components.json                        # shadcn config
│
├── public/
│   ├── images/
│   ├── icons/
│   └── favicon.ico
│
└── src/
    ├── app/                               # Next.js App Router
    │   ├── layout.tsx                     # root layout (fonts, providers)
    │   ├── page.tsx                       # redirects to /login
    │   │
    │   ├── (auth)/                        # unauthenticated group
    │   │   └── login/
    │   │       └── page.tsx
    │   │
    │   ├── (platform)/                    # platform owner portal
    │   │   └── platform/
    │   │       ├── layout.tsx             # platform sidebar layout
    │   │       ├── page.tsx               # redirect → /platform/admins
    │   │       └── admins/
    │   │           ├── page.tsx           # list all admins (paginated + search)
    │   │           └── [id]/
    │   │               └── page.tsx       # single admin detail + actions
    │   │
    │   ├── (admin)/                       # admin portal
    │   │   └── admin/
    │   │       ├── layout.tsx             # admin sidebar layout
    │   │       ├── page.tsx               # redirect → /admin/dashboard
    │   │       │
    │   │       ├── dashboard/
    │   │       │   └── page.tsx           # analytics overview
    │   │       │
    │   │       ├── organization/
    │   │       │   └── page.tsx           # org name/description settings
    │   │       │
    │   │       ├── school-years/
    │   │       │   ├── page.tsx           # list school years
    │   │       │   └── [id]/
    │   │       │       ├── page.tsx       # school year detail
    │   │       │       ├── levels/
    │   │       │       │   └── page.tsx   # level structure for this year
    │   │       │       └── calendar/
    │   │       │           └── page.tsx   # academic calendar events
    │   │       │
    │   │       ├── programs/
    │   │       │   ├── page.tsx           # list programs
    │   │       │   └── [id]/
    │   │       │       └── page.tsx       # program detail
    │   │       │
    │   │       ├── sections/
    │   │       │   ├── page.tsx           # list sections (filterable)
    │   │       │   └── [id]/
    │   │       │       └── page.tsx       # section detail + capacity
    │   │       │
    │   │       ├── subjects/
    │   │       │   ├── page.tsx           # list subjects
    │   │       │   └── [id]/
    │   │       │       └── page.tsx       # subject detail
    │   │       │
    │   │       ├── semester-settings/
    │   │       │   ├── page.tsx           # list semester templates
    │   │       │   └── [id]/
    │   │       │       └── page.tsx       # template detail + terms
    │   │       │
    │   │       ├── grading-scales/
    │   │       │   ├── page.tsx           # list grading scales
    │   │       │   └── [id]/
    │   │       │       └── page.tsx       # scale detail + range editor
    │   │       │
    │   │       ├── rubric/
    │   │       │   └── page.tsx           # admin default rubric editor
    │   │       │
    │   │       ├── classes/
    │   │       │   ├── page.tsx           # list classes (filterable)
    │   │       │   └── [id]/
    │   │       │       └── page.tsx       # class detail + enrollment
    │   │       │
    │   │       ├── educators/
    │   │       │   ├── page.tsx           # list educators
    │   │       │   └── [id]/
    │   │       │       └── page.tsx       # educator detail + class assignments
    │   │       │
    │   │       ├── students/
    │   │       │   ├── page.tsx           # list students (filterable + search)
    │   │       │   ├── import/
    │   │       │   │   └── page.tsx       # bulk CSV import flow
    │   │       │   └── [id]/
    │   │       │       ├── page.tsx       # student profile + enrollments
    │   │       │       └── transcript/
    │   │       │           └── page.tsx   # student full transcript
    │   │       │
    │   │       ├── grade-lock/
    │   │       │   └── page.tsx           # lock settings + override controls
    │   │       │
    │   │       └── audit-log/
    │   │           └── page.tsx           # audit log viewer
    │   │
    │   ├── (educator)/                    # educator portal
    │   │   └── educator/
    │   │       ├── layout.tsx             # educator sidebar layout
    │   │       ├── page.tsx               # redirect → /educator/classes
    │   │       │
    │   │       ├── classes/
    │   │       │   ├── page.tsx           # list educator's classes
    │   │       │   └── [classId]/
    │   │       │       ├── page.tsx       # class overview
    │   │       │       │
    │   │       │       ├── lessons/
    │   │       │       │   ├── page.tsx   # lesson list (calendar by week)
    │   │       │       │   ├── new/
    │   │       │       │   │   └── page.tsx
    │   │       │       │   └── [lessonId]/
    │   │       │       │       └── page.tsx  # lesson detail + concept build
    │   │       │       │
    │   │       │       ├── assessments/
    │   │       │       │   ├── page.tsx   # assessment list
    │   │       │       │   ├── new/
    │   │       │       │   │   └── page.tsx  # assessment builder (step 1-7)
    │   │       │       │   └── [assessmentId]/
    │   │       │       │       ├── page.tsx       # assessment detail + questions
    │   │       │       │       └── submissions/
    │   │       │       │           └── page.tsx   # submissions + grading
    │   │       │       │
    │   │       │       ├── attendance/
    │   │       │       │   ├── page.tsx            # weekly attendance view
    │   │       │       │   └── [sessionId]/
    │   │       │       │       └── page.tsx        # session detail + bulk entry
    │   │       │       │
    │   │       │       ├── grades/
    │   │       │       │   ├── page.tsx            # grades by term (default/clean view toggle)
    │   │       │       │   └── [termId]/
    │   │       │       │       └── page.tsx
    │   │       │       │
    │   │       │       ├── rubric/
    │   │       │       │   └── page.tsx            # rubric editor for this class
    │   │       │       │
    │   │       │       └── meetings/
    │   │       │           ├── page.tsx            # meeting list
    │   │       │           ├── new/
    │   │       │           │   └── page.tsx
    │   │       │           └── [meetingId]/
    │   │       │               ├── page.tsx        # meeting detail + invite management
    │   │       │               └── room/
    │   │       │                   └── page.tsx    # live meeting room (video+chat)
    │   │       │
    │   │       ├── rubric-library/
    │   │       │   └── page.tsx           # educator's personal rubric library
    │   │       │
    │   │       └── activity-log/
    │   │           └── page.tsx           # educator activity log
    │   │
    │   └── (student)/                     # student portal
    │       └── student/
    │           ├── layout.tsx             # student sidebar layout
    │           ├── page.tsx               # redirect → /student/classes
    │           │
    │           ├── classes/
    │           │   ├── page.tsx           # enrolled classes list
    │           │   └── [classId]/
    │           │       ├── page.tsx       # class overview
    │           │       │
    │           │       ├── lessons/
    │           │       │   ├── page.tsx   # lesson list
    │           │       │   └── [lessonId]/
    │           │       │       └── page.tsx  # lesson content viewer
    │           │       │
    │           │       ├── assessments/
    │           │       │   ├── page.tsx   # assessment list (with status)
    │           │       │   └── [assessmentId]/
    │           │       │       ├── page.tsx       # assessment taker
    │           │       │       └── result/
    │           │       │           └── page.tsx   # score + feedback
    │           │       │
    │           │       ├── attendance/
    │           │       │   └── page.tsx   # own attendance view
    │           │       │
    │           │       └── grades/
    │           │           └── page.tsx   # published grades view
    │           │
    │           ├── meetings/
    │           │   ├── page.tsx           # meeting list (invited + join requests)
    │           │   └── [meetingId]/
    │           │       ├── page.tsx       # meeting detail
    │           │       └── room/
    │           │           └── page.tsx   # live meeting room
    │           │
    │           └── transcript/
    │               └── page.tsx           # full transcript (all years/semesters)
    │
    ├── components/
    │   ├── ui/                            # shadcn/ui auto-generated components
    │   │   ├── button.tsx
    │   │   ├── input.tsx
    │   │   ├── dialog.tsx
    │   │   ├── table.tsx
    │   │   ├── badge.tsx
    │   │   ├── card.tsx
    │   │   ├── select.tsx
    │   │   ├── toast.tsx
    │   │   └── ...
    │   │
    │   ├── layout/
    │   │   ├── PlatformSidebar.tsx
    │   │   ├── AdminSidebar.tsx
    │   │   ├── EducatorSidebar.tsx
    │   │   ├── StudentSidebar.tsx
    │   │   ├── TopBar.tsx                 # notifications bell + user menu
    │   │   └── PageHeader.tsx             # title + breadcrumb + actions slot
    │   │
    │   ├── auth/
    │   │   └── LoginForm.tsx
    │   │
    │   ├── shared/
    │   │   ├── DataTable.tsx              # TanStack Table wrapper
    │   │   ├── Pagination.tsx
    │   │   ├── SearchInput.tsx
    │   │   ├── StatusBadge.tsx            # account/enrollment/submission status
    │   │   ├── ConfirmDialog.tsx          # reusable confirm modal
    │   │   ├── EmptyState.tsx
    │   │   ├── LoadingSpinner.tsx
    │   │   ├── ErrorBoundary.tsx
    │   │   └── NotificationDropdown.tsx
    │   │
    │   ├── platform/
    │   │   ├── AdminTable.tsx
    │   │   ├── CreateAdminDialog.tsx
    │   │   └── AdminCredentialsCard.tsx
    │   │
    │   ├── admin/
    │   │   ├── school-year/
    │   │   │   ├── SchoolYearCard.tsx
    │   │   │   └── SchoolYearStatusActions.tsx
    │   │   ├── students/
    │   │   │   ├── StudentTable.tsx
    │   │   │   ├── StudentProfileForm.tsx     # dynamic form (level-aware)
    │   │   │   ├── StudentStatusDialog.tsx
    │   │   │   ├── EnrollmentManager.tsx
    │   │   │   └── BulkImportWizard.tsx       # step 1-8 import flow
    │   │   ├── educators/
    │   │   │   ├── EducatorTable.tsx
    │   │   │   ├── EducatorForm.tsx
    │   │   │   └── ClassAssignmentManager.tsx
    │   │   ├── classes/
    │   │   │   ├── ClassTable.tsx
    │   │   │   └── ClassForm.tsx              # schedule + conflict validation
    │   │   ├── grading-scale/
    │   │   │   └── GradingScaleRangeEditor.tsx  # visual 0-100 range builder
    │   │   ├── rubric/
    │   │   │   └── RubricEditor.tsx           # category weights + lock guard
    │   │   └── grade-lock/
    │   │       ├── GradeLockSettingForm.tsx
    │   │       └── GradeLockOverrideDialog.tsx
    │   │
    │   ├── educator/
    │   │   ├── lessons/
    │   │   │   ├── LessonCard.tsx
    │   │   │   ├── LessonForm.tsx
    │   │   │   ├── ConceptBuildViewer.tsx     # sections + keyword display
    │   │   │   └── WeekCalendar.tsx           # lesson calendar layout
    │   │   ├── assessments/
    │   │   │   ├── AssessmentBuilderStepper.tsx  # steps 1-7 from spec 14.3
    │   │   │   ├── ItemRangeConfigurator.tsx
    │   │   │   ├── QuestionEditor.tsx
    │   │   │   ├── SubmissionTable.tsx
    │   │   │   └── EssayGrader.tsx
    │   │   ├── attendance/
    │   │   │   ├── WeeklySessionList.tsx
    │   │   │   └── AttendanceBulkEntry.tsx
    │   │   ├── grades/
    │   │   │   ├── GradeTable.tsx             # default + clean view toggle
    │   │   │   ├── ManualScoreInput.tsx
    │   │   │   └── GradeLockButton.tsx
    │   │   └── meetings/
    │   │       ├── MeetingCard.tsx
    │   │       ├── MeetingForm.tsx
    │   │       ├── InviteManager.tsx
    │   │       ├── JoinRequestPanel.tsx
    │   │       └── room/
    │   │           ├── MeetingRoom.tsx        # root room component
    │   │           ├── VideoGrid.tsx          # Agora video tiles
    │   │           ├── ChatPanel.tsx          # socket.io chat
    │   │           ├── ParticipantList.tsx    # online users + hand raised
    │   │           ├── ReactionBar.tsx
    │   │           ├── ScreenShareOverlay.tsx
    │   │           └── LessonPresentationView.tsx
    │   │
    │   └── student/
    │       ├── assessments/
    │       │   ├── AssessmentCard.tsx
    │       │   ├── AssessmentTaker.tsx        # MCQ/TF/Identification/Essay
    │       │   └── ResultView.tsx
    │       ├── grades/
    │       │   └── GradeCard.tsx
    │       ├── transcript/
    │       │   └── TranscriptViewer.tsx       # grouped by year → sem → term
    │       └── meetings/
    │           └── room/
    │               ├── MeetingRoom.tsx        # student room (shared logic)
    │               └── JoinRequestButton.tsx
    │
    ├── hooks/
    │   ├── useAuth.ts                         # reads AuthContext
    │   ├── useRole.ts                         # role-based redirect guard
    │   │
    │   ├── platform/
    │   │   └── useAdmins.ts                   # React Query hooks for admin mgmt
    │   │
    │   ├── admin/
    │   │   ├── useOrganization.ts
    │   │   ├── useSchoolYears.ts
    │   │   ├── useLevels.ts
    │   │   ├── usePrograms.ts
    │   │   ├── useSections.ts
    │   │   ├── useSubjects.ts
    │   │   ├── useSemesters.ts
    │   │   ├── useAcademicCalendar.ts
    │   │   ├── useGradingScales.ts
    │   │   ├── useRubric.ts
    │   │   ├── useClasses.ts
    │   │   ├── useEducators.ts
    │   │   ├── useStudents.ts
    │   │   ├── useGradeLock.ts
    │   │   ├── useAnalytics.ts
    │   │   └── useAuditLog.ts
    │   │
    │   ├── educator/
    │   │   ├── useLessons.ts
    │   │   ├── useAssessments.ts
    │   │   ├── useSubmissions.ts
    │   │   ├── useAttendance.ts
    │   │   ├── useGrades.ts
    │   │   ├── useRubricLibrary.ts
    │   │   ├── useMeetings.ts
    │   │   └── useActivityLog.ts
    │   │
    │   ├── student/
    │   │   ├── useStudentClasses.ts
    │   │   ├── useStudentLessons.ts
    │   │   ├── useStudentAssessments.ts
    │   │   ├── useSubmission.ts              # start/resume/save/finish flow
    │   │   ├── useStudentAttendance.ts
    │   │   ├── useStudentGrades.ts
    │   │   ├── useStudentMeetings.ts
    │   │   └── useTranscript.ts
    │   │
    │   └── meeting/
    │       ├── useMeetingSocket.ts           # socket.io connection + events
    │       └── useAgoraRTC.ts               # Agora video/audio management
    │
    ├── store/                               # Zustand stores
    │   ├── authStore.ts                     # user, token, role
    │   ├── notificationStore.ts             # unread count + list
    │   └── meetingStore.ts                  # room state (participants, chat, slides)
    │
    ├── context/
    │   └── AuthContext.tsx                  # session bootstrap + token refresh
    │
    ├── api/
    │   ├── client.ts                        # Axios instance + interceptors
    │   │
    │   ├── auth.api.ts                      # login, refresh, logout, me
    │   ├── platform.api.ts                  # admin CRUD (platform owner)
    │   │
    │   ├── admin/
    │   │   ├── organization.api.ts
    │   │   ├── school-year.api.ts
    │   │   ├── level.api.ts
    │   │   ├── program.api.ts
    │   │   ├── section.api.ts
    │   │   ├── subject.api.ts
    │   │   ├── semester.api.ts
    │   │   ├── academic-calendar.api.ts
    │   │   ├── grading-scale.api.ts
    │   │   ├── rubric.api.ts                # default rubric only
    │   │   ├── class.api.ts
    │   │   ├── educator.api.ts
    │   │   ├── student.api.ts               # includes bulk import + CSV
    │   │   ├── grade-lock.api.ts
    │   │   ├── analytics.api.ts
    │   │   └── audit-log.api.ts
    │   │
    │   ├── educator/
    │   │   ├── lesson.api.ts
    │   │   ├── assessment.api.ts
    │   │   ├── submission.api.ts            # educator side (view + grade)
    │   │   ├── attendance.api.ts
    │   │   ├── grade.api.ts
    │   │   ├── rubric.api.ts                # library + class rubric
    │   │   ├── meeting.api.ts
    │   │   └── activity-log.api.ts
    │   │
    │   └── student/
    │       ├── class.api.ts
    │       ├── lesson.api.ts
    │       ├── assessment.api.ts
    │       ├── submission.api.ts            # start/draft/finish flow
    │       ├── attendance.api.ts
    │       ├── grade.api.ts
    │       ├── meeting.api.ts
    │       ├── notification.api.ts
    │       └── transcript.api.ts
    │
    ├── types/
    │   ├── auth.types.ts                   # AuthUser, TokenPayload, Role
    │   ├── api.types.ts                    # ApiResponse<T>, PaginatedResponse<T>
    │   │
    │   ├── platform.types.ts               # Admin (platform view)
    │   │
    │   ├── admin/
    │   │   ├── organization.types.ts
    │   │   ├── school-year.types.ts
    │   │   ├── level.types.ts
    │   │   ├── program.types.ts
    │   │   ├── section.types.ts
    │   │   ├── subject.types.ts
    │   │   ├── semester.types.ts
    │   │   ├── calendar.types.ts
    │   │   ├── grading-scale.types.ts
    │   │   ├── rubric.types.ts
    │   │   ├── class.types.ts
    │   │   ├── educator.types.ts
    │   │   ├── student.types.ts
    │   │   ├── grade-lock.types.ts
    │   │   └── analytics.types.ts
    │   │
    │   ├── educator/
    │   │   ├── lesson.types.ts
    │   │   ├── assessment.types.ts
    │   │   ├── submission.types.ts
    │   │   ├── attendance.types.ts
    │   │   ├── grade.types.ts
    │   │   └── meeting.types.ts
    │   │
    │   └── student/
    │       ├── class.types.ts
    │       ├── assessment.types.ts
    │       ├── submission.types.ts
    │       ├── grade.types.ts
    │       ├── meeting.types.ts
    │       └── transcript.types.ts
    │
    ├── utils/
    │   ├── date.util.ts                    # format dates, relative time
    │   ├── token.util.ts                   # decode JWT, check expiry
    │   ├── validation.util.ts              # shared Zod schemas
    │   ├── role.util.ts                    # role checks, redirect paths
    │   └── csv.util.ts                     # CSV download helper (credentials)
    │
    ├── config/
    │   └── api.config.ts                   # NEXT_PUBLIC_API_URL base config
    │
    └── styles/
        └── globals.css                     # Tailwind base + shadcn variables
