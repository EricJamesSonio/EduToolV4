# Database Schema

Source of truth: [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)

- **Provider:** PostgreSQL
- **ORM:** Prisma (`prisma-client-js`, `driverAdapters` preview)
- **ID strategy:** UUID (`@default(uuid())`) unless noted
- **Tenancy:** most tables carry `org_id` for organization scoping

---

## Enums

| Enum | Values |
|---|---|
| `Role` | `platform_owner`, `admin`, `educator`, `student` |
| `AccountStatus` | `active`, `suspended`, `pending`, `dropped`, `transferred`, `graduated` |
| `SectionOverflowAction` | `auto_create`, `no_section`, `expand_capacity` |
| `EnrollmentStatus` | `active`, `pending`, `removed` |
| `ProgramEnrollmentStatus` | `active`, `ended` |
| `ProgramEnrollmentEndReason` | `shifted`, `completed`, `withdrawn`, `dropped`, `admin_correction`, `other` |
| `ClassEnrollmentOutcome` | `passed`, `failed`, `dropped`, `withdrawn`, `withdrawn_due_to_shifting`, `transferred_credited`, `completed` |
| `ClassAssignmentRequestOrigin` | `student_request`, `admin_flag` |
| `ClassAssignmentRequestStatus` | `pending_review`, `ready` |
| `SubmissionStatus` | `draft`, `submitted`, `exempted`, `custom` |
| `AttendanceStatus` | `present`, `absent`, `late`, `excused` |
| `SchoolYearStatus` | `pending`, `active`, `ended` |
| `SchoolYearEnrollmentStatus` | `active`, `pending`, `unenrolled` |
| `GradingMode` | `system`, `manual`, `hybrid` |
| `OtpPurpose` | `org_registration`, `enrollment_verification`, `personal_email_change` |
| `EnrollmentApplicationStatus` | `pending`, `locked`, `approved`, `rejected` |
| `GroupyMessageType` | `text`, `gif`, `sticker`, `poll`, `system` |
| `GroupyReactionType` | `like`, `love`, `laugh`, `wow`, `sad` |
| `ConcernStatus` | `open`, `resolved` |
| `RegistrationStatus` | `pending`, `approved`, `rejected`, `needs_revision` |

---

## Core Tables

### `Organization`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `name` | String | |
| `description` | String? | |
| `address` | String? | |
| `logo_url` | String? | |
| `email_extension` | String? | `@unique` |
| `slug` | String? | `@unique` |
| `admin_account_id` | String? | `@unique` |
| `auto_seed_new_school_years` | Boolean | `@default(false)` |

**Relations:** `accounts Account[]`

### `OrgEnrollmentSetting`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | `@unique` |
| `require_semester_reenrollment` | Boolean | `@default(false)` |
| `auto_unenroll_on_year_end` | Boolean | `@default(true)` |
| `default_shift_outcome` | ClassEnrollmentOutcome | `@default(dropped)` |
| `allow_educator_scheme_override` | Boolean | `@default(false)` |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

### `OrgScheduleConfig`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | `@unique` |
| `start_time` | String | `@default("07:00")` |
| `end_time` | String | `@default("17:00")` |
| `slot_duration` | Int | `@default(30)` |
| `active_weekdays` | Int[] | `@default([0, 1, 2, 3, 4, 5, 6])` (0 = Sunday) |
| `breaks` | Json | `@default("[]")` — `{ label, start, end }` |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

### `Account`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String? | |
| `role` | Role | |
| `email` | String | `@unique` |
| `password` | String | |
| `status` | AccountStatus | |
| `is_registrar` | Boolean | `@default(false)` |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |
| `deleted_at` | DateTime? | |

**Relations:** `organization`, `profile`, `classes` (EducatorClasses), `educatorSubjects`, `teachableSubjects`, `scheduleProfile`
**Constraints:** `@@unique([org_id, email])`, `@@index([org_id, role, status])`, `@@index([org_id, status, created_at])`

### `Profile`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `account_id` | String | `@unique` |
| `full_name` | String | |
| `metadata` | Json? | |
| `personal_email` | String? | `@unique` |
| `profile_image` | String? | `@default("profile/default.png")` |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `account Account`

### `SchoolProfileDepartment`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `type` | String | matches Program.type |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Relations:** `courses`, `strands`, `levels`, `subjects`
**Constraints:** `@@unique([org_id, type])`

### `SchoolProfileCourse`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `department_id` | String | |
| `code` | String? | |
| `name` | String | |

**Relations:** `department` (onDelete: Cascade), `levels`, `sharings`

### `SchoolProfileStrand`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `department_id` | String | |
| `name` | String | |

**Relations:** `department` (onDelete: Cascade), `levels`, `sharings`

### `SchoolProfileLevel`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `department_id` | String | |
| `course_id` | String? | |
| `strand_id` | String? | |
| `name` | String | |
| `order_index` | Int | |

**Relations:** `department`, `course`, `strand` (all onDelete: Cascade), `sections`, `subjects`

### `SchoolProfileSection`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `level_id` | String | |
| `name` | String | |
| `capacity` | Int | |

**Relations:** `level` (onDelete: Cascade)

### `SchoolProfileSubject`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `department_id` | String? | minor/GE subjects |
| `level_id` | String? | major subjects |
| `name` | String | |
| `subject_type` | String | `@default("major")` — `"major"` \| `"minor"` |
| `level_name` | String? | |

**Relations:** `department`, `level` (onDelete: Cascade), `sharings`

### `SchoolProfileSubjectSharing`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `subject_id` | String | |
| `course_id` | String? | |
| `strand_id` | String? | |

**Relations:** `subject`, `course`, `strand` (onDelete: Cascade)
**Constraints:** `@@unique([subject_id, course_id])`, `@@unique([subject_id, strand_id])`

### `SchoolProfileGradingScale`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `program_type` | String | |
| `name` | String | |
| `ranges` | Json | |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Constraints:** `@@unique([org_id, program_type])`, `@@unique([org_id, name])`, `@@index([org_id])`

### `SchoolProfileGradingScheme`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `program_type` | String | |
| `name` | String | |
| `components` | Json | |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Constraints:** `@@unique([org_id, program_type])`, `@@unique([org_id, name])`, `@@index([org_id])`

### `SchoolProfileSemesterTermConfig`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `program_type` | String | |
| `terms` | Json | |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Constraints:** `@@unique([org_id, program_type])`, `@@index([org_id])`

---

## Structure

### `Program`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `school_year_id` | String | |
| `name` | String | |
| `type` | String | |

**Relations:** `schoolYear`, `courses`, `strands`, `semesters`, `levels`, `subjects`, `studentEnrollments`, `semesterAssignment`, `gradingScaleAssignments`, `gradingSchemeProgramAssignments`, `programCalendars`, `enrollmentApplications`

### `Course`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `school_year_id` | String | |
| `program_id` | String | |
| `name` | String | |
| `code` | String? | |
| `deleted_at` | DateTime? | |

**Relations:** `schoolYear`, `program`, `subjects`, `sharings`, `studentEnrollments`, `sections`, `levels`, `enrollmentApplications`
**Constraints:** `@@index([org_id, school_year_id, deleted_at])`

### `Strand`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `school_year_id` | String | |
| `program_id` | String | |
| `name` | String | |
| `deleted_at` | DateTime? | |

**Relations:** `schoolYear`, `program`, `subjects`, `sharings`, `studentEnrollments`, `sections`, `levels`, `enrollmentApplications`
**Constraints:** `@@index([org_id, school_year_id, deleted_at])`

### `Level`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `school_year_id` | String | |
| `program_id` | String | |
| `course_id` | String? | |
| `strand_id` | String? | |
| `name` | String | |
| `deleted_at` | DateTime? | |

**Relations:** `schoolYear`, `program`, `course` (onDelete: Restrict), `strand` (onDelete: Restrict), `sections`, `sharings`, `studentEnrollments`, `subjects`, `enrollmentApplications`
**Constraints:** `@@index([org_id, school_year_id, deleted_at])`

### `Section`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `level_id` | String | |
| `course_id` | String? | |
| `strand_id` | String? | |
| `school_year_id` | String | |
| `name` | String | |
| `capacity` | Int | |
| `order_index` | Int | `@default(0)` |
| `deleted_at` | DateTime? | |

**Relations:** `level`, `course` (Restrict), `strand` (Restrict), `schoolYear`, `studentEnrollments`, `enrollmentApplications`

### `SchoolYear`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `name` | String | |
| `status` | SchoolYearStatus | `@default(pending)` |
| `start_date` | DateTime? | |
| `end_date` | DateTime? | |

**Relations:** `programs`, `courses`, `strands`, `levels`, `sections`, `gradingScaleAssignments`, `gradingSchemeProgramAssignments`, `studentEnrollments`, `semesters`, `classes`, `academicCalendars`, `programCalendars`, `enrollmentPeriods`, `enrollmentApplications`

### `SemesterTemplate`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `program_type` | String | |
| `name` | String | |

**Relations:** `semesters`, `assignments`

### `SemesterTemplateItem`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `template_id` | String | |
| `name` | String | |
| `order_index` | Int | |

**Relations:** `template`, `terms`, `semesters`

### `SemesterTemplateTerm`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `semester_id` | String | |
| `name` | String | |
| `order_index` | Int | |

**Relations:** `semester` (onDelete: Cascade), `termDates`

### `ProgramSemesterAssignment`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `program_id` | String | `@unique` |
| `template_id` | String | |

**Relations:** `program`, `template`, `termDates`

### `ProgramSemesterTermDate`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `assignment_id` | String | |
| `term_id` | String | |
| `start_date` | DateTime | |
| `end_date` | DateTime | |

**Relations:** `assignment`, `term` (onDelete: Cascade)
**Constraints:** `@@unique([assignment_id, term_id])`

### `StudentSchoolYear`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `student_id` | String | |
| `school_year_id` | String | |
| `status` | SchoolYearEnrollmentStatus | `@default(pending)` |
| `enrolled_at` | DateTime | `@default(now())` |
| `unenrolled_at` | DateTime? | |
| `notes` | String? | |

**Relations:** `schoolYear`, `programEnrollments`, `classAssignmentRequests`
**Constraints:** `@@unique([org_id, student_id, school_year_id])`

### `StudentProgramEnrollment`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `student_school_year_id` | String | |
| `program_id` | String | |
| `level_id` | String? | |
| `course_id` | String? | |
| `strand_id` | String? | |
| `section_id` | String? | |
| `status` | ProgramEnrollmentStatus | `@default(active)` |
| `enrolled_at` | DateTime | `@default(now())` |
| `section_assigned_at` | DateTime? | |
| `end_reason` | ProgramEnrollmentEndReason? | |
| `ended_at` | DateTime? | |
| `ended_by` | String? | |
| `is_regular` | Boolean | `@default(false)` |
| `regular_marked_at` | DateTime? | |
| `regular_marked_by` | String? | |

**Relations:** `studentSchoolYear`, `program`, `level`, `course`, `strand`, `section`, `shiftFromEvent` (ShiftFrom), `shiftToEvent` (ShiftTo), `classAssignmentRequests`

### `Semester`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `school_year_id` | String | |
| `program_id` | String | |
| `template_semester_id` | String? | |
| `name` | String | |
| `start_date` | DateTime | |
| `end_date` | DateTime | |

**Relations:** `schoolYear`, `program`, `templateSemester`, `terms`
**Constraints:** `@@unique([org_id, school_year_id, program_id, template_semester_id])`

### `Term`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `semester_id` | String | |
| `name` | String | |
| `order_index` | Int | |
| `start_date` | DateTime | |
| `end_date` | DateTime | |

**Relations:** `semester`

---

## Academic

### `Subject`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `name` | String | |
| `code` | String? | |
| `subject_type` | String | `@default("major")` |
| `program_id` | String? | |
| `level_id` | String? | |
| `course_id` | String? | |
| `strand_id` | String? | |
| `educator_id` | String? | |
| `is_locked` | Boolean | `@default(false)` |
| `year_level` | String? | |
| `term_label` | String? | |
| `sessions_per_week` | Int? | null = program-type default |
| `session_minutes` | Int? | null = program-type default |
| `session_durations` | Int[] | `@default([])` per-session lengths |
| `deleted_at` | DateTime? | soft delete / archive |

**Relations:** `program`, `course`, `strand`, `level`, `classes`, `prerequisites` (SubjectPrereqs), `prereqFor` (PrereqFor), `sharings`, `educatorSubjects`, `completionOverrides`
**Constraints:** `@@index([org_id, deleted_at])`

### `EducatorSubject`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `educator_id` | String | |
| `subject_id` | String | |
| `section_ids` | String[] | `@default([])` |
| `section_slots` | Json | `@default("[]")` |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `educator` (onDelete: Cascade), `subject` (onDelete: Restrict)
**Constraints:** `@@unique([educator_id, subject_id])`, `@@index([org_id, subject_id])`, `@@index([org_id, educator_id])`

### `EducatorTeachableSubject`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `educator_id` | String | |
| `subject_key` | String | normalized subject key |
| `display_name` | String | |
| `program_type` | String | `@default("")` |
| `level_name` | String | `@default("")` |
| `course_name` | String | `@default("")` |
| `strand_name` | String | `@default("")` |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `educator` (onDelete: Cascade)
**Constraints:** `@@unique([org_id, educator_id, subject_key])`, `@@index([org_id, educator_id])`

### `EducatorScheduleProfile`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `educator_id` | String | `@unique` |
| `use_custom_availability` | Boolean | `@default(false)` |
| `available_weekdays` | Int[] | `@default([])` |
| `max_minutes_per_day` | Int? | |
| `max_minutes_per_week` | Int? | |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Relations:** `educator` (onDelete: Cascade)
**Constraints:** `@@index([org_id])`

### `SubjectSharing`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `subject_id` | String | |
| `course_id` | String? | |
| `strand_id` | String? | |
| `level_id` | String? | |

**Relations:** `subject`, `course`, `strand`, `level`
**Constraints:** `@@unique([subject_id, course_id])`, `@@unique([subject_id, strand_id])`, `@@unique([subject_id, level_id])`

### `SubjectPrerequisite`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `subject_id` | String | |
| `prerequisite_id` | String | |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `subject` (SubjectPrereqs), `prerequisite` (PrereqFor)
**Constraints:** `@@unique([org_id, subject_id, prerequisite_id])`, `@@index([org_id, subject_id])`

### `SubjectCompletionOverride`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `student_id` | String | |
| `subject_id` | String | |
| `status` | String | `@default("pending")` |
| `reason` | String? | |
| `actor_id` | String? | |
| `source` | String | `@default("manual")` |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Relations:** `subject`
**Constraints:** `@@unique([org_id, student_id, subject_id])`, `@@index([org_id, student_id])`, `@@index([org_id, subject_id])`

### `Class`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `subject_id` | String | |
| `educator_id` | String | |
| `section_id` | String? | |
| `school_year_id` | String | |
| `semester_id` | String | |
| `capacity` | Int | |
| `created_at` | DateTime | `@default(now())` |
| `deleted_at` | DateTime? | |

**Relations:** `subject`, `educator` (EducatorClasses), `schoolYear`, `schedules`, `enrollments`, `gradeLock`, `ownershipLogs`, `meetings`, `grades`, `gradingSchemes`, `gradeLockEvents`, `groupyMessages`
**Constraints:** `@@index([org_id, school_year_id, semester_id])`, `@@index([org_id, educator_id])`, `@@index([org_id, created_at])`

### `Room`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `name` | String | |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Relations:** `schedules ClassSchedule[]`
**Constraints:** `@@unique([org_id, name])`, `@@index([org_id])`

### `ClassSchedule`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `class_id` | String | |
| `weekday` | Int | |
| `start_time` | DateTime | |
| `end_time` | DateTime | |
| `room_id` | String? | |

**Relations:** `class`, `room` (onDelete: Restrict)
**Constraints:** `@@index([room_id])`, `@@index([class_id])`, `@@index([org_id, class_id])`

### `ClassOwnershipLog`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `class_id` | String | |
| `from_educator_id` | String | |
| `to_educator_id` | String | |
| `reason` | String? | |
| `reassigned_at` | DateTime | `@default(now())` |
| `reassigned_by` | String | |

**Relations:** `class`

### `Enrollment`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `class_id` | String | |
| `student_id` | String | |
| `status` | EnrollmentStatus | |
| `created_at` | DateTime | `@default(now())` |
| `outcome` | ClassEnrollmentOutcome? | |
| `outcome_reason` | String? | |
| `outcome_set_at` | DateTime? | |
| `outcome_set_by` | String? | |
| `shift_event_id` | String? | |

**Relations:** `class`, `shiftEvent`
**Constraints:** `@@index([org_id, class_id, status])`, `@@index([org_id, student_id, status])`, `@@unique([org_id, class_id, student_id])`

### `ProgramShiftEvent`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `student_school_year_id` | String | |
| `from_program_enrollment_id` | String | `@unique` |
| `to_program_enrollment_id` | String | `@unique` |
| `default_outcome_used` | ClassEnrollmentOutcome | |
| `actor_id` | String | |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `fromProgramEnrollment` (ShiftFrom), `toProgramEnrollment` (ShiftTo), `affectedEnrollments`
**Constraints:** `@@index([org_id, student_school_year_id])`

### `ClassAssignmentRequest`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `student_id` | String | |
| `student_school_year_id` | String | |
| `program_enrollment_id` | String? | |
| `origin` | ClassAssignmentRequestOrigin | |
| `status` | ClassAssignmentRequestStatus | `@default(pending_review)` |
| `student_requested_subject_ids` | String[] | |
| `admin_finalized_subject_ids` | String[] | `@default([])` |
| `requested_at` | DateTime | `@default(now())` |
| `finalized_at` | DateTime? | |
| `finalized_by` | String? | |
| `reopen_reason` | String? | |
| `has_prerequisite_warning` | Boolean | `@default(false)` |
| `prerequisite_warnings` | Json | `@default("[]")` |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Relations:** `studentSchoolYear`, `programEnrollment`
**Constraints:** `@@index([org_id, student_school_year_id])`, `@@index([org_id, student_id])`, `@@index([status])`, `@@index([org_id, has_prerequisite_warning])`

---

## Academic Calendar

### `AcademicCalendar`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `school_year_id` | String | |
| `title` | String | |
| `type` | String | |
| `start_date` | DateTime | |
| `end_date` | DateTime | |
| `description` | String? | |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `schoolYear`

---

## Program Academic Calendar

### `ProgramCalendar`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `school_year_id` | String | |
| `program_id` | String | |
| `start_date` | DateTime | |
| `end_date` | DateTime | |
| `notes` | String? | |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Relations:** `schoolYear` (Cascade), `program` (Cascade), `breaks`, `terms`, `holidays`
**Constraints:** `@@unique([program_id, school_year_id])`

### `ProgramCalendarBreak`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `calendar_id` | String | |
| `label` | String | |
| `start_date` | DateTime | |
| `end_date` | DateTime | |
| `order_index` | Int | |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `calendar` (Cascade)

### `ProgramCalendarTerm`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `calendar_id` | String | |
| `label` | String | |
| `order_index` | Int | |
| `start_date` | DateTime | |
| `end_date` | DateTime | |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `calendar` (Cascade)

### `ProgramCalendarHoliday`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `calendar_id` | String | |
| `holiday_key` | String? | |
| `title` | String | |
| `date` | DateTime | |
| `description` | String? | |
| `type` | String | |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `calendar` (Cascade)

---

## Holiday Config

### `OrgHolidayConfig`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | `@unique` |
| `enabled_keys` | String[] | |
| `custom_holidays` | Json | `@default("[]")` |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

---

## Grading Scale

### `GradingScale`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `name` | String | |
| `program_type` | String | |
| `ranges` | Json | |
| `is_locked` | Boolean | `@default(false)` |
| `locked_at` | DateTime? | |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Relations:** `assignments`

### `GradingScaleAssignment`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `grading_scale_id` | String | |
| `program_id` | String | |
| `school_year_id` | String | |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `grading_scale` (Cascade), `program`, `school_year`
**Constraints:** `@@unique([program_id, school_year_id])`

---

## Grading Scheme Templates

### `GradingSchemeTemplate`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `name` | String | |
| `program_type` | String? | |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `components`, `programAssignments`

### `GradingSchemeProgramAssignment`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `program_id` | String | |
| `school_year_id` | String | |
| `template_id` | String | |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Relations:** `program` (Cascade), `school_year` (Restrict), `template` (Cascade)
**Constraints:** `@@unique([program_id, school_year_id])`, `@@index([org_id])`, `@@index([template_id])`

### `GradingSchemeTemplateComponent`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `template_id` | String | |
| `name` | String | |
| `type` | String | |
| `weight` | Float | |
| `max_score` | Float? | |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `template`

---

## Grading Scheme

### `GradingScheme`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `class_id` | String | |
| `template_id` | String? | |
| `name` | String | |
| `is_locked` | Boolean | `@default(false)` |
| `locked_at` | DateTime? | |
| `created_at` | DateTime | `@default(now())` |
| `is_default` | Boolean | `@default(false)` |

**Relations:** `class`, `components`

### `GradingSchemeComponent`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `grading_scheme_id` | String | |
| `name` | String | |
| `type` | String | |
| `weight` | Float | |
| `max_score` | Float? | |
| `is_optional` | Boolean | `@default(false)` |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `gradingScheme`

---

## Lessons

### `Lesson`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `class_id` | String | |
| `title` | String | |
| `description` | String? | |
| `detail` | String? | |
| `week_number` | Int | |
| `sub_index` | Int | |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `concept`
**Constraints:** `@@unique([class_id, week_number, sub_index])`

### `LessonConcept`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `lesson_id` | String | `@unique` |
| `content` | Json | |
| `raw_response` | String? | |
| `raw_request` | String? | |
| `prompt_version` | String? | |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `lesson` (Cascade)

---

## Presentations

### `Presentation` — `@@map("presentations")`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `class_id` | String | |
| `lesson_id` | String | |
| `title` | String | |
| `template` | String | `@default("modern")` |
| `settings` | Json | `@default("{}")` |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Relations:** `slides`

### `Slide` — `@@map("slides")`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `presentation_id` | String | |
| `slide_number` | Int | |
| `title` | String? | |
| `content` | String | |
| `lesson_section` | String? | |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `presentation` (Cascade)
**Constraints:** `@@unique([presentation_id, slide_number])`

---

## Assessments

### `ManualScore`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `class_id` | String | |
| `student_id` | String | |
| `term_id` | String | |
| `category` | String | |
| `score` | Float | |
| `updated_at` | DateTime | `@updatedAt` |

**Constraints:** `@@unique([org_id, class_id, student_id, term_id, category])`, `@@index([org_id, class_id, term_id])`

### `Assessment`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `class_id` | String | |
| `lesson_id` | String? | |
| `term_id` | String | |
| `type` | String | |
| `title` | String? | |
| `total_items` | Int | |
| `release_date` | DateTime? | |
| `end_date` | DateTime? | |
| `is_published` | Boolean | `@default(false)` |
| `week_number` | Int? | |
| `created_at` | DateTime | `@default(now())` |
| `deleted_at` | DateTime? | |
| `grading_mode` | GradingMode | `@default(system)` |
| `manual_max_score` | Float? | |
| `show_breakdown` | Boolean | `@default(false)` |

**Relations:** `submissions`, `gradingOverrides`
**Constraints:** `@@index([org_id, class_id, term_id])`, `@@index([org_id, class_id, type])`

### `AssessmentGradingOverride`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `assessment_id` | String | |
| `student_id` | String | |
| `include` | Boolean | `@default(true)` |
| `reason` | String? | |
| `created_by` | String | |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Relations:** `assessment` (Cascade)
**Constraints:** `@@unique([assessment_id, student_id])`

### `Question`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `assessment_id` | String | |
| `type` | String | |
| `question_text` | String | |
| `correct_answer` | String? | |
| `choices` | Json? | |
| `order` | Int | `@default(0)` |
| `is_manual` | Boolean | `@default(false)` |
| `section_type` | String? | |

**Constraints:** `@@index([assessment_id])`

### `Submission`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `assessment_id` | String | |
| `student_id` | String | |
| `status` | SubmissionStatus | |
| `score` | Float? | |
| `manual_score` | Float? | |
| `submitted_at` | DateTime? | |
| `reopened_until` | DateTime? | |
| `manual_section_score` | Float? | |
| `system_section_score` | Float? | |
| `is_missed` | Boolean | `@default(false)` |
| `is_exempted` | Boolean | `@default(false)` |

**Relations:** `assessment`
**Constraints:** `@@unique([assessment_id, student_id])`, `@@index([org_id, assessment_id])`, `@@index([org_id, student_id])`, `@@index([assessment_id, status])`

### `SubmissionAnswer`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `submission_id` | String | |
| `question_id` | String | |
| `answer` | String | |
| `is_correct` | Boolean? | |

**Constraints:** `@@index([submission_id])`

---

## Grading

### `Grade`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `student_id` | String | |
| `class_id` | String | |
| `term_id` | String | |
| `final_score` | Float | |
| `final_grade` | String | |
| `is_locked` | Boolean | `@default(false)` |
| `locked_at` | DateTime? | |

**Relations:** `class`
**Constraints:** `@@unique([org_id, student_id, class_id, term_id])`, `@@index([org_id, class_id, term_id])`, `@@index([org_id, class_id])`, `@@index([org_id, student_id, is_locked])`

### `GradeLock`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `class_id` | String | `@unique` |
| `setting_id` | String | |
| `is_locked` | Boolean | `@default(false)` |
| `locked_at` | DateTime? | |
| `locked_by` | String? | |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `class`, `setting`
**Constraints:** `@@index([org_id, setting_id])`

### `GradeLockEvent`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `class_id` | String | |
| `type` | String | |
| `reason` | String? | |
| `actor_id` | String | |
| `metadata` | Json? | |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `class`

### `GradeLockSetting`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `name` | String | `@default("Default Setting")` |
| `description` | String? | |
| `lockType` | String? | |
| `lock_deadline` | DateTime? | |
| `deadlineDays` | Int? | |
| `allowOverride` | Boolean | `@default(false)` |
| `is_default` | Boolean | `@default(false)` |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Relations:** `gradeLocks`
**Constraints:** `@@unique([org_id, name])`

---

## Grade Templates

### `GradeTemplate`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `school_year_id` | String | |
| `program_id` | String? | null = all departments |
| `name` | String | |
| `file_name` | String | |
| `file_data` | Bytes | |
| `config` | Json | `@default("{}")` |
| `uploaded_by` | String | |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Relations:** `submissions`
**Constraints:** `@@index([org_id, school_year_id])`

### `GradeTemplateSubmission`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `template_id` | String | |
| `class_id` | String | |
| `educator_id` | String | |
| `rows_written` | Int | `@default(0)` |
| `ungraded_count` | Int | `@default(0)` |
| `unmatched_count` | Int | `@default(0)` |
| `submitted_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Relations:** `template` (Cascade)
**Constraints:** `@@unique([template_id, class_id])`, `@@index([org_id, educator_id])`

---

## Attendance

### `AttendanceSession`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `class_id` | String | |
| `date` | DateTime | |
| `week_number` | Int | |
| `sub_index` | Int | |

**Constraints:** `@@index([class_id, week_number])`, `@@index([class_id, date])`

### `AttendanceRecord`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `session_id` | String | |
| `student_id` | String | |
| `status` | AttendanceStatus | |

**Constraints:** `@@unique([session_id, student_id])`

---

## Meetings

### `Meeting`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `class_id` | String | |
| `educator_id` | String | |
| `title` | String | |
| `description` | String? | |
| `start_time` | DateTime | |
| `status` | String | `@default("scheduled")` |
| `is_ephemeral` | Boolean | `@default(false)` |
| `created_at` | DateTime | `@default(now())` |
| `deleted_at` | DateTime? | |

**Relations:** `class`, `invites`, `join_requests`
**Constraints:** `@@index([class_id, is_ephemeral, status])`

### `MeetingInvite`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `meeting_id` | String | |
| `student_id` | String | |

**Relations:** `meeting`
**Constraints:** `@@unique([meeting_id, student_id])`

### `MeetingJoinRequest`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `meeting_id` | String | |
| `student_id` | String | |
| `status` | String | `@default("pending")` |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `meeting`
**Constraints:** `@@unique([meeting_id, student_id])`

---

## Groupy (per-class group chat)

### `GroupyMessage`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `class_id` | String | |
| `sender_account_id` | String | |
| `sender_role` | Role | |
| `sender_name` | String | |
| `sender_profile_image` | String? | |
| `type` | GroupyMessageType | |
| `body` | String? | |
| `gif_url` | String? | |
| `sticker_id` | String? | |
| `poll_id` | String? | `@unique` |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `class`, `poll`, `reactions`
**Constraints:** `@@index([org_id, class_id, created_at])`

### `GroupyReadReceipt`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `class_id` | String | |
| `account_id` | String | |
| `last_read_message_id` | String? | |
| `updated_at` | DateTime | `@updatedAt` |

**Constraints:** `@@unique([class_id, account_id])`, `@@index([org_id, class_id])`

### `GroupyReaction`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `message_id` | String | |
| `account_id` | String | |
| `reaction_type` | GroupyReactionType | |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `message` (Cascade)
**Constraints:** `@@unique([message_id, account_id])`

### `GroupyPoll`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `class_id` | String | |
| `created_by` | String | |
| `question` | String | |
| `closes_at` | DateTime? | |
| `is_closed` | Boolean | `@default(false)` |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `message`, `options`, `votes`

### `GroupyPollOption`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `poll_id` | String | |
| `label` | String | |
| `order_index` | Int | |

**Relations:** `poll` (Cascade), `votes`

### `GroupyPollVote`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `poll_id` | String | |
| `option_id` | String | |
| `account_id` | String | |
| `voted_at` | DateTime | `@default(now())` |

**Relations:** `poll` (Cascade), `option` (Cascade)
**Constraints:** `@@unique([poll_id, account_id])`

---

## System

### `Notification`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `account_id` | String | |
| `type` | String | |
| `payload` | Json | |
| `read_at` | DateTime? | |
| `archived_at` | DateTime? | |
| `created_at` | DateTime | `@default(now())` |

**Constraints:** `@@index([org_id, account_id, created_at])`, `@@index([archived_at, created_at])`

### `AuditLog`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `actor_id` | String | |
| `log_type` | String | `@default("admin")` |
| `action` | String | |
| `entity_type` | String | |
| `entity_id` | String | |
| `metadata` | Json? | |
| `created_at` | DateTime | `@default(now())` |

**Constraints:** `@@index([org_id, created_at])`, `@@index([org_id, log_type, created_at])`, `@@index([org_id, entity_type, entity_id])`, `@@index([org_id, actor_id])`

### `MeetingChatMessage`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `meeting_id` | String | |
| `sender_id` | String | |
| `sender_name` | String | |
| `message` | String | |
| `created_at` | DateTime | `@default(now())` |

### `ConcernCategory`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `label` | String | |
| `is_default` | Boolean | `@default(false)` |
| `is_active` | Boolean | `@default(true)` |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Relations:** `concerns`
**Constraints:** `@@unique([org_id, label])`

### `Concern`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `category_id` | String | |
| `sender_account_id` | String | |
| `sender_role` | Role | |
| `subject` | String | |
| `status` | ConcernStatus | `@default(open)` |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |
| `last_message_at` | DateTime | `@default(now())` |
| `resolved_by` | String? | |
| `resolved_at` | DateTime? | |

**Relations:** `category`, `messages`
**Constraints:** `@@index([org_id, sender_account_id])`

### `ConcernMessage`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `concern_id` | String | |
| `sender_account_id` | String | |
| `sender_role` | Role | |
| `sender_name` | String | |
| `body` | String | |
| `created_at` | DateTime | `@default(now())` |

**Relations:** `concern`
**Constraints:** `@@index([concern_id])`

### `OrgConcernSetting`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | `@unique` |
| `last_digest_sent_at` | DateTime? | |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

### `Otp`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `email` | String | |
| `purpose` | OtpPurpose | `@default(org_registration)` |
| `org_id` | String? | |
| `full_name` | String? | |
| `code` | String | |
| `plan` | String? | |
| `institution_name` | String? | |
| `role` | String? | |
| `student_count` | String? | |
| `programs_departments` | String? | |
| `expires_at` | DateTime | |
| `used_at` | DateTime? | |
| `created_at` | DateTime | `@default(now())` |

### `RegistrationRequest`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `email` | String | |
| `full_name` | String | |
| `plan` | String? | |
| `institution_name` | String? | |
| `role` | String? | |
| `student_count` | String? | |
| `programs_departments` | String? | |
| `status` | RegistrationStatus | `@default(pending)` |
| `revision_notes` | Json? | |
| `reviewed_by` | String? | |
| `reviewed_at` | DateTime? | |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

---

## Public Enrollment Portal

### `EnrollmentPeriod`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `school_year_id` | String | |
| `name` | String | |
| `token` | String | `@unique` |
| `start_date` | DateTime | |
| `end_date` | DateTime | |
| `lock_date` | DateTime | |
| `created_by` | String | |
| `section_overflow_action` | SectionOverflowAction | `@default(no_section)` |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Relations:** `schoolYear`, `applications`
**Constraints:** `@@index([org_id, school_year_id])`

### `EnrollmentApplication`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id`, `@default(uuid())` |
| `org_id` | String | |
| `school_year_id` | String | |
| `enrollment_period_id` | String | |
| `application_code` | String | |
| `personal_email` | String | |
| `first_name` | String | |
| `middle_name` | String? | |
| `last_name` | String | |
| `age` | Int? | |
| `address` | String? | |
| `contact_number` | String? | |
| `last_school_graduated` | String? | |
| `program_id` | String | |
| `course_id` | String? | |
| `strand_id` | String? | |
| `level_id` | String | |
| `section_id` | String? | |
| `status` | EnrollmentApplicationStatus | `@default(pending)` |
| `rejection_reason` | String? | |
| `reviewed_by` | String? | |
| `reviewed_at` | DateTime? | |
| `locked_at` | DateTime? | |
| `unlocked_by` | String? | |
| `unlocked_at` | DateTime? | |
| `resulting_account_id` | String? | |
| `submitted_at` | DateTime | `@default(now())` |
| `created_at` | DateTime | `@default(now())` |
| `updated_at` | DateTime | `@updatedAt` |

**Relations:** `schoolYear`, `enrollmentPeriod`, `program`, `course`, `strand`, `level`, `section`
**Constraints:** `@@unique([org_id, school_year_id, personal_email])`, `@@unique([org_id, school_year_id, application_code])`, `@@index([org_id, school_year_id, enrollment_period_id])`
