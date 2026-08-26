# Project

Last verified: 2026-08-26, commit 1f5fe24

This is an education management platform (EduTool) for school/org administration, educator class/grading workflows, student academic history/enrollment, and platform-level tenancy.

Stack:
- Frontend: Next.js 16.2.1 App Router (React 19.2.4), Tailwind 4, TanStack Query 5.95.2 / React Table 8, Zustand 5, React Hook Form + Zod, Axios, Socket.IO client, Agora RTC (see frontend/package.json)
- Backend: NestJS 10.3 (SWC builder, see backend/package.json, nest-cli.json), Prisma 5.22 + @prisma/adapter-pg on PostgreSQL (see backend/prisma/schema.prisma, datasource postgresql), Helmet, Passport JWT, Socket.IO, Winston
- Database: PostgreSQL via Prisma (enums: Role, AccountStatus, EnrollmentStatus, ClassEnrollmentOutcome, SchoolYearStatus, GradingMode, etc.; models: Organization, Account, Profile, SchoolYear, Program/Course/Strand/Level/Section/Subject, Enrollment, Class, Assessment, Submission, Attendance, GradingScheme/Scale, Meeting, Groupy, etc.)
- Infra/Deploy: Next standalone output (frontend/next.config.ts output standalone), Docker-ready, CI via .github/workflows/ci.yml + frontend-e2e.yml

Main domains (from backend/src/modules/*, frontend/src/app/*, prisma models):
- auth (login, JWT, admin-request, roles platform_owner/admin/educator/student — see backend/src/modules/auth)
- organization / school-profile / school-year / program / course / strand / level / section / subject / semester / semester-template / academic-calendar
- student / student-enrollment / enrollment-portal / program-shift / class / class-assignment-request
- educator / class / lesson / presentation / meeting (Agora + Socket.IO)
- grade / grading-scale / grading-scheme / grading-scheme-template / grade-lock / assessment / submission / attendance / transcript / academic-history / analytics / audit-log
- concern / notification / export / upload / mail / health / org-enrollment-setting / registrar / platform-registration / groupy (realtime chat)
- platform (multi-tenant org management)

Out of scope / not part of this system:
- Billing/payments not evidenced — no billing module present.
- AI integration scaffold exists (.ai/skills/ai-integration) but no concrete AI provider wiring found in backend/src — leave as future.
