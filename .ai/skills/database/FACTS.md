# Database Skill — Facts

Last verified: 2026-08-26, commit 1f5fe24

## Database

Engine: PostgreSQL (see backend/prisma/schema.prisma datasource postgresql, @prisma/adapter-pg 5.22)
ORM: Prisma 5.22.0 (see backend/package.json, backend/prisma/schema.prisma generator client, binaryTargets native + debian-openssl-3.0.x)

## Core entities

```
Organization, Account, Profile, SchoolProfileDepartment/Course/Strand/Level/Section/Subject/SubjectSharing,
SchoolYear, Program, Course, Strand, Level, Section, Subject, SubjectSharing,
StudentProgramEnrollment, SchoolYearEnrollment, Class, ClassEnrollment, ClassAssignmentRequest,
Assessment, Submission, Attendance, GradingScheme, GradingScale, GradingScaleAssignment, ProgramCalendar,
EnrollmentApplication, GroupyMessage/Poll, Meeting, Notification, AuditLog, etc.
(see backend/prisma/schema.prisma for full list)
```

## Key relationships

```
Organization 1---N Account, SchoolYear, Program, SchoolProfileDepartment
Account 1---1 Profile; Account N---N Class via EducatorClasses
SchoolYear 1---N Program, Level/Section, StudentProgramEnrollment
Program 1---N Course, Strand, Level, Subject, StudentProgramEnrollment
Level 1---N Section; Section 1---N StudentProgramEnrollment
StudentProgramEnrollment N---1 Account, Program, Section, SchoolYear
Class N---N Account (educators), 1---N ClassEnrollment, Assessment, Attendance, Meeting
Assessment 1---N Submission
```

## Business constraints (project invariants, not schema)

- Tenant isolation: org_id on Organization/Account/Program/Level/Section/Subject/StudentProgramEnrollment etc. — queries must scope by authenticated org.
- Roles: Role enum platform_owner|admin|educator|student; AccountStatus active|suspended|pending|dropped|transferred|graduated.
- ProgramEnrollment: status active|ended + endReason shifted|completed|withdrawn|dropped|admin_correction|other.
- ClassEnrollmentOutcome: passed|failed|dropped|withdrawn|transferred_credited|completed etc.
- Soft-delete: Account.deleted_at, Section.deleted_at — excluded from default queries.
- Unique constraints: Organization.email_extension unique, SchoolProfileDepartment [org_id,type] unique, Account [org_id,email] unique, Profile account_id unique etc.
