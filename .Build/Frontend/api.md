================================================================================
  EDUTOOL — API ENDPOINTS REFERENCE
  Extracted from backend controllers
  Base URL: http://localhost:5000
================================================================================


================================================================================
  AUTH
  Controller: /auth
================================================================================

  POST   /auth/login                          public — { email, password }
  POST   /auth/refresh                        bearer — { refreshToken }
  POST   /auth/logout                         bearer
  GET    /auth/me                             bearer


================================================================================
  PLATFORM OWNER
  Controller: /platform
================================================================================

  POST   /platform/login                      public — { password }
  POST   /platform/admins                     platform_owner — { email }
  GET    /platform/admins                     platform_owner — ?search&page&limit
  GET    /platform/admins/:id                 platform_owner
  PATCH  /platform/admins/:id/block           platform_owner
  PATCH  /platform/admins/:id/unblock         platform_owner
  POST   /platform/admins/:id/reset-password  platform_owner


================================================================================
  ORGANIZATION
  Controller: /organization
================================================================================

  POST   /organization                        admin — { name, description }
  GET    /organization                        admin
  PATCH  /organization                        admin — { name?, description? }


================================================================================
  SCHOOL YEARS
  Controller: /school-years
================================================================================

  POST   /school-years                        admin — { name }
  GET    /school-years                        admin
  PATCH  /school-years/:id                    admin — { name }
  PATCH  /school-years/:id/activate           admin
  PATCH  /school-years/:id/end                admin


================================================================================
  LEVELS
  Controller: /levels
================================================================================

  GET    /levels/defaults                     admin
  PATCH  /levels/defaults                     admin — { levels: [{ id, programId, name }] }
  GET    /levels?schoolYearId=                admin
  PATCH  /levels/:id                          admin — { name }


================================================================================
  PROGRAMS
  Controller: /programs
================================================================================

  POST   /programs                            admin — { name, type }
  GET    /programs                            admin
  GET    /programs/:id                        admin
  PATCH  /programs/:id                        admin — { name?, type? }
  DELETE /programs/:id                        admin


================================================================================
  SECTIONS
  Controller: /sections
================================================================================

  POST   /sections                            admin — { levelId, name, capacity }
  GET    /sections?levelId=                   admin
  PATCH  /sections/:id                        admin — { name?, capacity? }
  DELETE /sections/:id                        admin


================================================================================
  SUBJECTS
  Controller: /subjects
================================================================================

  POST   /subjects                            admin — { name, levelId, educatorId? }
  GET    /subjects?levelId=&educatorId=&search= admin/educator
  PATCH  /subjects/:id                        admin — { name?, levelId?, educatorId? }
  PATCH  /subjects/:id/lock                   admin
  PATCH  /subjects/:id/unlock                 admin


================================================================================
  SEMESTER SETTINGS
  Controller: /semester-settings
================================================================================

  POST   /semester-settings                   admin — { schoolYearId, name, startDate, endDate, terms[] }
  GET    /semester-settings                   admin
  PATCH  /semester-settings/:id               admin — { name?, startDate?, endDate?, terms[]? }
  DELETE /semester-settings/:id               admin


================================================================================
  ACADEMIC CALENDAR
  Controller: /academic-calendar
================================================================================

  POST   /academic-calendar                   admin — { schoolYearId, title, type, startDate, endDate, description? }
  GET    /academic-calendar?schoolYearId=     admin/educator/student
  PATCH  /academic-calendar/:id               admin — { title?, type?, startDate?, endDate?, description? }
  DELETE /academic-calendar/:id               admin


================================================================================
  GRADING SCALES
  Controller: /grading-scales
================================================================================

  POST   /grading-scales                      admin — { levelId, schoolYearId, name, ranges[] }
  GET    /grading-scales?levelId=&schoolYearId= admin
  PATCH  /grading-scales/:id                  admin — { name?, ranges[]? }

  NOTE: ranges[] = [{ minPercent, maxPercent, gradeValue, remark, isPassing }]
  NOTE: ranges must cover 0-100 fully, no gaps or overlaps
  NOTE: scale is locked after first grade lock — returns 400 if editing locked scale


================================================================================
  RUBRICS
  Controller: /rubrics
================================================================================

  GET    /rubrics/default                     admin/educator
  PATCH  /rubrics/default                     admin — { name?, categories[]? }
  POST   /rubrics                             educator — { name, categories[] }
  GET    /rubrics                             educator — own library
  PATCH  /rubrics/:id                         educator — { name?, categories[]? }

  NOTE: categories[] = [{ name, type, weight, assessmentTypes[]? }]
  NOTE: weights must total exactly 100%
  NOTE: rubric locks when first student enrolls in class — returns 400 if editing locked


================================================================================
  CLASSES
  Controller: /classes
================================================================================

  POST   /classes                             admin — { subjectId, educatorId, sectionId?, schoolYearId, semesterId, capacity, schedules[] }
  GET    /classes?schoolYearId=&semesterId=&educatorId=&subjectId=&sectionId=  admin/educator
  GET    /classes/:id                         admin/educator
  PATCH  /classes/:id                         admin — { educatorId?, sectionId?, capacity?, schedules[]? }
  DELETE /classes/:id                         admin — soft delete

  POST   /classes/:id/enroll                  admin — { studentId }
  GET    /classes/:id/enrollments             admin/educator
  PATCH  /classes/:classId/enrollments/:enrollmentId  admin — { status }
  DELETE /classes/:classId/enrollments/:enrollmentId  admin

  POST   /classes/:id/reassign-educator       admin — { educatorId, reason? }
  GET    /classes/:id/ownership-history       admin/educator

  NOTE: schedules[] = [{ weekday (0-6), startTime (HH:mm), endTime (HH:mm) }]
  NOTE: enroll returns { overflow: true } if class is at capacity


================================================================================
  EDUCATOR CLASSES (Educator view)
  Controller: /educator
================================================================================

  GET    /educator/classes                    educator/admin — own classes


================================================================================
  STUDENT CLASSES (Student view)
  Controller: /student/classes
================================================================================

  GET    /student/classes                     student — own enrolled classes
  GET    /student/classes/:classId            student — single class detail


================================================================================
  EDUCATORS
  Controller: /educators
================================================================================

  POST   /educators                           admin — { fullName, email }
  GET    /educators?search=                   admin
  GET    /educators/:id                       admin
  PATCH  /educators/:id                       admin — { fullName?, email? }
  DELETE /educators/:id                       admin — blocked if active classes exist
  POST   /educators/:id/reset-password        admin


================================================================================
  STUDENTS
  Controller: /students
================================================================================

  POST   /students                            admin — { fullName, email, studentId, levelId, sectionId? }
  GET    /students?search=&status=&levelId=&sectionId=  admin
  GET    /students/:id                        admin
  PATCH  /students/:id                        admin — { fullName?, email?, levelId?, sectionId? }
  PATCH  /students/:id/status                 admin — { status, reason? }
  POST   /students/:id/reset-password         admin
  GET    /students/:id/enrollments            admin
  POST   /students/:id/enrollments            admin — { classId }
  DELETE /students/:id/enrollments/:enrollmentId  admin

  GET    /students/credentials-csv            admin — download CSV
  GET    /students/import-template            admin — download blank CSV template
  POST   /students/import                     admin — multipart/form-data file upload


================================================================================
  LESSONS (Educator)
  Controller: /classes/:classId/lessons
================================================================================

  POST   /classes/:classId/lessons            educator — { title, description?, weekNumber, subIndex, detail }
  GET    /classes/:classId/lessons?weekNumber= educator
  GET    /classes/:classId/lessons/:id        educator — includes concept build
  PATCH  /classes/:classId/lessons/:id        educator — { title?, description?, weekNumber?, subIndex? }
  DELETE /classes/:classId/lessons/:id        educator — soft delete
  GET    /classes/:classId/lessons/:id/concept  educator
  POST   /classes/:classId/lessons/:id/re-extract  educator — { detail: string }

  NOTE: concept extraction triggers async on create (10+ word detail required)
  NOTE: re-extract replaces previous concept build


================================================================================
  LESSONS (Student)
  Controller: /student/classes/:classId/lessons
================================================================================

  GET    /student/classes/:classId/lessons?weekNumber=  student
  GET    /student/classes/:classId/lessons/:lessonId    student — no concept data


================================================================================
  ASSESSMENTS (Educator)
  Controller: /classes/:classId/assessments
================================================================================

  POST   /classes/:classId/assessments        educator — { lessonId, termId, type, totalItems, releaseDate?, ranges[] }
  GET    /classes/:classId/assessments?termId=&type=  educator
  GET    /classes/:classId/assessments/:id    educator — includes questions
  PATCH  /classes/:classId/assessments/:id    educator — { releaseDate?, type? }
  DELETE /classes/:classId/assessments/:id    educator — soft delete

  PATCH  /classes/:classId/assessments/:id/questions/:questionId  educator — { questionText?, correctAnswer? }
  GET    /classes/:classId/assessments/:id/submissions  educator
  PATCH  /classes/:classId/assessments/:id/submissions/:submissionId/status  educator — { status, manualScore? }
  PATCH  /classes/:classId/assessments/:id/submissions/:submissionId/grade   educator — { score }
  POST   /classes/:classId/assessments/:id/publish    educator — { studentIds[]? }
  POST   /classes/:classId/assessments/:id/unpublish  educator

  NOTE: ranges[] = [{ from, to, questionType, conceptSections[] }]
  NOTE: question generation runs async — notification sent on complete
  NOTE: questions lock after releaseDate passes


================================================================================
  ASSESSMENTS (Student)
  Controller: /classes/:classId/assessments  (student role)
================================================================================

  GET    /classes/:classId/assessments        student — list with submission status
  GET    /classes/:classId/assessments/:id    student — detail (questions hidden before release)
  GET    /classes/:classId/assessments/:id/result  student


================================================================================
  SUBMISSIONS (Student)
  Controller: /assessments/:assessmentId
================================================================================

  POST   /assessments/:assessmentId/submit              student — start or resume
  PATCH  /assessments/:assessmentId/submit/save         student — { answers[] } save draft
  POST   /assessments/:assessmentId/submit/finish       student — { answers[] } submit
  GET    /assessments/:assessmentId/submissions/:submissionId/answers  educator/admin

  NOTE: answers[] = [{ questionId, answer }]
  NOTE: one active attempt per student enforced
  NOTE: auto-grades non-essay questions on finish
  NOTE: auto-marks attendance present on submit


================================================================================
  ATTENDANCE (Educator)
  Controller: /classes/:classId/attendance
================================================================================

  GET    /classes/:classId/attendance/sessions?weekNumber=  admin/educator
  GET    /classes/:classId/attendance/sessions/:sessionId   admin/educator
  POST   /classes/:classId/attendance/sessions/:sessionId/records  educator — { records: [{ studentId, status }] }
  PATCH  /classes/:classId/attendance/sessions/:sessionId/records/:recordId  educator — { status }

  NOTE: status = present | absent | late | excused


================================================================================
  ATTENDANCE (Student)
  Controller: /student/classes/:classId/attendance
================================================================================

  GET    /student/classes/:classId/attendance  student — own records + summary


================================================================================
  GRADES (Educator)
  Controller: /classes/:classId/grades
================================================================================

  GET    /classes/:classId/grades             educator/admin — all terms
  GET    /classes/:classId/grades/:termId     educator/admin — single term
  POST   /classes/:classId/grades/:termId/compute  educator/admin — trigger grade computation
  PATCH  /classes/:classId/grades/:termId/students/:studentId/manual  educator — { category, score }


================================================================================
  GRADES (Student)
  Controller: /student/classes/:classId/grades
================================================================================

  GET    /student/classes/:classId/grades     student — own published grades


================================================================================
  GRADE LOCK
  Controller: /grade-lock
================================================================================

  POST   /grade-lock/settings                 admin — { schoolYearId, lockDeadline }
  GET    /grade-lock/settings?schoolYearId=   admin/educator
  GET    /grade-lock/classes                  admin
  POST   /grade-lock/:classId/lock            educator — lock own class
  POST   /grade-lock/:classId/unlock          admin — override unlock


================================================================================
  ANALYTICS
  Controller: /analytics
================================================================================

  GET    /analytics/overview                  admin
  GET    /analytics/enrollment                admin
  GET    /analytics/grades?schoolYearId=&termId=  admin
  GET    /analytics/educators                 admin
  GET    /analytics/alerts                    admin


================================================================================
  AUDIT LOG / ACTIVITY LOG
  Controller: root
================================================================================

  GET    /audit-log?from=&to=&action=&entityType=&entityId=&actorId=  admin
  GET    /activity-log?classId=&from=&to=   educator/admin


================================================================================
  MEETINGS (Educator)
  Controller: /classes/:classId/meetings
================================================================================

  POST   /classes/:classId/meetings           educator — { title, description?, startTime, invitedStudentIds[]? }
  GET    /classes/:classId/meetings           educator
  GET    /classes/:classId/meetings/:id       educator
  PATCH  /classes/:classId/meetings/:id       educator — { title?, description?, startTime?, invitedStudentIds[]? }
  DELETE /classes/:classId/meetings/:id       educator — soft delete
  POST   /classes/:classId/meetings/:id/end   educator

  NOTE: invitedStudentIds[] empty = invite all enrolled students


================================================================================
  MEETINGS — JOIN REQUESTS
  Controller: /meetings
================================================================================

  POST   /meetings/:id/join-request           student
  PATCH  /meetings/:id/join-request/:reqId    educator — { status: accepted | declined }


================================================================================
  MEETINGS — AGORA TOKEN
  Controller: /meetings
================================================================================

  GET    /meetings/:id/token                  educator/student
  → returns { token, channel, appId, uid }


================================================================================
  MEETINGS (Student)
  Controller: /student/classes/:classId/meetings
================================================================================

  GET    /student/classes/:classId/meetings       student
  GET    /student/classes/:classId/meetings/:id   student


================================================================================
  NOTIFICATIONS
  Controller: /notifications
================================================================================

  GET    /notifications?unreadOnly=           any authenticated user
  DELETE /notifications/:id                   any authenticated user — dismiss


================================================================================
  EXPORT
  Controller: /classes
================================================================================

  GET    /classes/:classId/export/csv                       admin/educator — download CSV
  GET    /classes/:classId/students/:studentId/card         admin/educator — download PDF


================================================================================
  TRANSCRIPT (Student)
  Controller: /student/transcript
================================================================================

  GET    /student/transcript                  student — full history grouped by year → semester → term


================================================================================
  HEALTH CHECK
  Controller: /check
================================================================================

  GET    /check                               public


================================================================================
  WEBSOCKET — MEETING ROOM
  Namespace: /meeting
  Connect: ws://localhost:5000/meeting?meetingId=<id>
  Auth: handshake.auth.token = JWT
================================================================================

  CLIENT → SERVER EVENTS:
    chat:send                { message: string }
    hand:raise               (no payload)
    hand:lower               (no payload)
    reaction:send            { emoji: string }  — allowed: 👍 👏 ❤️ 😂 😮 🎉
    webrtc:offer             { targetUserId, offer }
    webrtc:answer            { targetUserId, answer }
    webrtc:ice               { targetUserId, candidate }
    lesson:slide_change      { slide: number }  — educator only
    lesson:presentation_start  (no payload)     — educator only
    lesson:presentation_stop   (no payload)     — educator only
    screen:share_started     (no payload)
    screen:share_stopped     (no payload)

  SERVER → CLIENT EVENTS:
    room:state               { participants[], chatHistory[], currentSlide, isPresenting }
    room:participant_joined  { userId, name, role, participants[] }
    room:participant_left    { userId, name, participants[] }
    chat:message             { id, senderId, senderName, message, createdAt }
    hand:update              { userId, name, handRaised, participants[] }
    reaction:received        { userId, name, emoji }
    webrtc:offer             { fromUserId, offer }
    webrtc:answer            { fromUserId, answer }
    webrtc:ice               { fromUserId, candidate }
    lesson:slide_sync        { slide, controlledBy }
    lesson:presentation_started  { educatorId, currentSlide }
    lesson:presentation_stopped  { educatorId }
    screen:sharing           { userId, name, sharing: boolean }
    error                    { message } — then disconnect


================================================================================
  NOTIFICATION TYPES (payload reference)
================================================================================

  concept_extraction_completed    { lessonId }
  assessment_generation_completed { assessmentId }
  meeting_created                 { meetingId, title, startTime, classId }
  meeting_join_request            { meetingId, studentId, requestId, title }
  meeting_join_accepted           { meetingId, title }


================================================================================
  RESPONSE SHAPE
================================================================================

  All responses wrapped by ResponseInterceptor:
  {
    success: boolean,
    data: T,
    message: string,
    timestamp: string
  }

  Errors:
  {
    statusCode: number,
    message: string,
    error: string
  }

  Paginated (platform admin list):
  {
    data: T[],
    meta: { total, page, limit, totalPages }
  }


================================================================================
  EduTool API Endpoints Reference
================================================================================