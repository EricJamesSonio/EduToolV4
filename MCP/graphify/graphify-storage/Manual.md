# Graphify AI Manual — EduToolV3

The AI navigation guide for the EduToolV3 knowledge book.

This is NOT documentation. It is a table of contents that tells an AI agent
which concept inside `graph.json` to open before reading implementation files.

## How to use

1. Match the task to a concept below using the description and keywords.
2. Read that concept's `locations` inside `graph.json`.
3. Read the relevant source files named there.
4. Do not read the whole `graph.json` — only the concept you need.

All concepts live at `graph.json → concepts.<identifier>`.

---

## AI-Question-Generation

Identifier: `AI-Question-Generation`

Description: AI-powered assessment question generation with concept extraction, chunking, progress tracking, and preview workflows.

Keywords: AiService, AiClientService, concept, question, blueprint, generation, preview, OpenRouter

Location: graph.json → concepts.AI-Question-Generation

Related: Assessment-Hybrid-Grading, Prisma-Data-Access

---

## Assessment-Hybrid-Grading

Identifier: `Assessment-Hybrid-Grading`

Description:
Hybrid assessment grading mode combining auto-graded system questions with manually graded sections.

Keywords:
hybrid, grading_mode, system, manual, mergeHybridScores, section_score

Location: graph.json → concepts.Assessment-Hybrid-Grading

Related: Grade-Computation-Engine, AI-Question-Generation

---

## Grade-Computation-Engine

Identifier: `Grade-Computation-Engine`

Description:
Weighted grade computation with category breakdowns, hybrid score merging, grading scale resolution, and lock management.

Keywords:
GradeCoreService, computeWeightedScore, buildCategoryBreakdown, resolveGrade, grade-lock, manual-score

Location: graph.json → concepts.Grade-Computation-Engine

Related: Grade-Lock, Grading-Scheme-Templates, Assessment-Hybrid-Grading

---

## Multi-Tenant-Organization

Identifier: `Multi-Tenant-Organization`

Description:
Multi-tenant architecture where each organization has isolated data scoped by org_id throughout all queries.

Keywords:
orgId, organization, school, tenant, platform

Location: graph.json → concepts.Multi-Tenant-Organization

Related: Prisma-Data-Access, Organization-Seeding

---

## Prisma-Data-Access

Identifier: `Prisma-Data-Access`

Description:
Database access layer using Prisma ORM with DatabaseService singleton and repository pattern across all modules.

Keywords:
DatabaseService, PrismaClient, prisma, repository, DATABASE_URL

Location: graph.json → concepts.Prisma-Data-Access

Related: Multi-Tenant-Organization

---

## Real-Time-Meeting

Identifier: `Real-Time-Meeting`

Description:
Real-time video conferencing with WebRTC (Agora), WebSocket signaling, chat, reactions, screen sharing, and presentation sync.

Keywords:
MeetingGateway, Agora, WebSocket, RTC, socket.io, chat, reaction, screen-share, presentation

Location: graph.json → concepts.Real-Time-Meeting

---

## JWT-Authentication

Identifier: `JWT-Authentication`

Description:
JWT-based authentication with access/refresh token rotation, Passport strategy, and guards.

Keywords:
JwtService, JwtStrategy, AuthGuard, access_token, refresh_token, TokenPayload

Location: graph.json → concepts.JWT-Authentication

Related: Role-Based-Access-Control

---

## Scheduled-Background-Jobs

Identifier: `Scheduled-Background-Jobs`

Description:
Cron-based background jobs for auto grade-lock, submission cleanup, notification archiving, and enrollment management.

Keywords:
SchedulerTasks, cron, @Cron, auto-grade-lock, notification-archiving, auto-unenroll

Location: graph.json → concepts.Scheduled-Background-Jobs

Related: Grade-Lock, Submission

---

## Role-Based-Access-Control

Identifier: `Role-Based-Access-Control`

Description:
RBAC system with role guards, decorators, and multi-portal authorization (admin, educator, student, platform).

Keywords:
RolesGuard, Roles, ROLES_KEY, AuthGuard, role, admin, educator, student, platform_owner

Location: graph.json → concepts.Role-Based-Access-Control

Related: JWT-Authentication

---

## Academic-Organization

Identifier: `Academic-Organization`

Description:
Academic program structure: programs, strands, levels, sections, subjects, and courses with school-year association and cross-org sharing.

Keywords:
ProgramService, StrandService, LevelService, SectionService, SubjectService, program, strand, level, section, subject

Location: graph.json → concepts.Academic-Organization

Related: Academic-Calendar, Subject-Prerequisites, Student-Enrollment

---

## Academic-Calendar

Identifier: `Academic-Calendar`

Description:
Academic calendar management: school years, semesters, semester templates with term dates, and academic calendar holidays and breaks.

Keywords:
SchoolYearService, SemesterService, SemesterTemplateService, AcademicCalendarService, school_year, semester, term_dates

Location: graph.json → concepts.Academic-Calendar

Related: Academic-Organization, Scheduled-Background-Jobs

---

## Student-Enrollment

Identifier: `Student-Enrollment`

Description:
Student acquisition and enrollment: class enrollment, program enrollment, org enrollment settings, subject prerequisites, and eligibility checks.

Keywords:
StudentEnrollmentService, OrgEnrollmentSettingService, SubjectPrerequisiteService, enrollment, prerequisite, eligibility

Location: graph.json → concepts.Student-Enrollment

Related: Academic-Organization, Multi-Tenant-Organization

---

## Grading-Scheme-Templates

Identifier: `Grading-Scheme-Templates`

Description:
Reusable grading scheme templates: program/class assignment, auto-apply to new classes, and per-program component weight resolution.

Keywords:
GradingSchemeTemplateService, resolveProgramTemplate, applyToClass, applyToProgram, autoApplyForNewClass, template

Location: graph.json → concepts.Grading-Scheme-Templates

Related: Grade-Computation-Engine, Organization-Seeding

---

## Organization-Seeding

Identifier: `Organization-Seeding`

Description:
Bulk organization bootstrap data: programs, strands, levels, sections, subjects, courses, grading schemes/scales/templates, prerequisites, and semester templates seeded for a new organization.

Keywords:
OrgSeederService, seedOrg, seeder, bootstrap, program, grading

Location: graph.json → concepts.Organization-Seeding

Related: Academic-Organization, Grading-Scheme-Templates, Multi-Tenant-Organization

---

## Analytics-Dashboard

Identifier: `Analytics-Dashboard`

Description:
Analytics and dashboards: enrollment breakdown, grade analytics, educator load, academic context, and actionable alerts.

Keywords:
AnalyticsService, DashboardService, enrollment breakdown, grade analytics, getAlerts

Location: graph.json → concepts.Analytics-Dashboard

Related: Grade-Computation-Engine, Student-Enrollment

---

## Legacy / Removed

`IPC-Communication` was removed — the codebase is a web (NestJS + Next.js)
system and no longer uses Electron IPC. Do not look for it in graph.json.