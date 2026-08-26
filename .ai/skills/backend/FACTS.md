# Backend Skill — Facts

Last verified: 2026-08-26, commit 1f5fe24

## Framework

Framework: NestJS 10.3.0 (see backend/package.json @nestjs/*, nest-cli.json builder swc, sourceRoot src). Language: TypeScript 5.4, strict.

## Structure

```
backend/src/
├── main.ts / app.module.ts
├── core/        (database, configs)
├── commons/     (guards, interceptors, pipes)
├── modules/
│   ├── academic-calendar/
│   ├── academic-history/{academic-history.controller.ts, academic-history.service.ts, academic-history.repository.ts, dto/}
│   ├── assessment/
│   ├── attendance/
│   ├── auth/{auth.controller.ts, auth.service.ts, auth.repository.ts, jwt.strategy.ts, admin-request-session.guard.ts}
│   ├── class/, class-assignment-request/
│   ├── grading-scale/, grading-scheme/, grading-scheme-template/, grade/, grade-lock/
│   ├── enrollment/, enrollment-portal/, student-enrollment/, program-shift/
│   ├── student/, educator/, section/, semester/, program/, level/, course/, strand/, subject/
│   ├── meeting/, presentation/, lesson/, transcript/, analytics/, notification/, groupy/
│   └── ... (see backend/src/modules for full list)
├── prisma/schema.prisma
└── seeds/
```

Each domain typically splits controller/service/repository/dto/entity — some domains further split by role (admin/student/educator subfolders, e.g. academic-history/admin vs student).

## Project-specific conventions

- Validation via class-validator + class-transformer + global ValidationPipe (joi for env). Prisma for data access; repositories wrap DatabaseService (Prisma + pg adapter). No direct Prisma client in services — go through repository.
- Auth via Passport JWT (jwt.strategy.ts + admin-request-session), role enum Role {platform_owner, admin, educator, student} in schema.prisma.
- Module boundaries follow NestJS modules; shared logic in commons/core.

## Common pitfalls specific to this project

- Tenant scoping: every query must filter by org_id from token — see auth layer.
- Grading writes are authoritative — require transaction + deterministic logic where retried.
