backend/
├─ .env
├─ .gitignore
├─ api/
│   ├─ v1/
│   │   ├─ academic-calendar.md
│   │   ├─ all.md
│   │   ├─ audit-log.md
│   │   ├─ auth.md
│   │   ├─ educator.md
│   │   ├─ grading-scale.md
│   │   ├─ level.md
│   │   ├─ notification.md
│   │   ├─ org.md
│   │   ├─ platform.md
│   │   ├─ rubric.md
│   │   ├─ school-year.md
│   │   ├─ section.md
│   │   ├─ semester.md
│   │   ├─ student.md
│   │   └─ subject.md
│   └─ v2/
├─ api.md
├─ nest-cli.json
├─ prisma/
│   ├─ commands.md
│   ├─ migrations/
│   │   ├─ 20260323090255_init/
│   │   │   └─ migration.sql
│   │   ├─ 20260323104605_add_deleted_at_to_section/
│   │   │   └─ migration.sql
│   │   ├─ 20260323110158_add_semester_term_relation/
│   │   │   └─ migration.sql
│   │   ├─ 20260323111736_add_academic_calendar/
│   │   │   └─ migration.sql
│   │   ├─ 20260323114801_add/
│   │   │   └─ migration.sql
│   │   ├─ 20260323115553_add/
│   │   │   └─ migration.sql
│   │   ├─ 20260324072441_add_school_year_id_to_level/
│   │   │   └─ migration.sql
│   │   └─ migration_lock.toml
│   └─ schema.prisma
├─ README.md
├─ requirements.md
├─ src/
│   ├─ app.controller.spec.ts
│   ├─ app.controller.ts
│   ├─ app.module.ts
│   ├─ app.service.ts
│   ├─ commons/
│   │   ├─ decorators/
│   │   │   ├─ current-user.decorator.ts
│   │   │   └─ roles.decorator.ts
│   │   ├─ filters/
│   │   │   ├─ all-exception.filter.ts
│   │   │   └─ http-exception.filter.ts
│   │   ├─ guards/
│   │   │   ├─ auth.guard.ts
│   │   │   └─ role.guard.ts
│   │   ├─ interceptors/
│   │   │   ├─ logging.interceptor.ts
│   │   │   └─ response.interceptor.ts
│   │   ├─ pipes/
│   │   │   ├─ parse-int.pipe.ts
│   │   │   └─ validation.pipe.ts
│   │   └─ utils/
│   │       ├─ hash.util.ts
│   │       ├─ password.util.ts
│   │       └─ token.util.ts
│   ├─ configs/
│   │   ├─ app.config.ts
│   │   ├─ db.config.ts
│   │   ├─ env.validation.ts
│   │   └─ jwt.config.ts
│   ├─ core/
│   │   ├─ database/
│   │   │   ├─ database.module.ts
│   │   │   └─ database.provider.ts
│   │   ├─ logger/
│   │   │   ├─ logger.module.ts
│   │   │   └─ logger.ts
│   │   └─ middleware/
│   │       └─ request-id.middleware.ts
│   ├─ main.ts
│   └─ modules/
│       ├─ academic-calendar/
│       │   ├─ academic-calendar.controller.spec.ts
│       │   ├─ academic-calendar.controller.ts
│       │   ├─ academic-calendar.module.ts
│       │   ├─ academic-calendar.repository.ts
│       │   ├─ academic-calendar.service.spec.ts
│       │   ├─ academic-calendar.service.ts
│       │   ├─ dto/
│       │   │   └─ academic-calendar.dto.ts
│       │   └─ entity/
│       │       └─ academic-calendar.entity.ts
│       ├─ audit-log/
│       │   ├─ audit-log.controller.spec.ts
│       │   ├─ audit-log.controller.ts
│       │   ├─ audit-log.module.ts
│       │   ├─ audit-log.repository.ts
│       │   ├─ audit-log.service.spec.ts
│       │   ├─ audit-log.service.ts
│       │   ├─ dto/
│       │   │   └─ audit-log.dto.ts
│       │   └─ entity/
│       │       └─ audit-log.entity.ts
│       ├─ auth/
│       │   ├─ auth.controller.spec.ts
│       │   ├─ auth.controller.ts
│       │   ├─ auth.module.ts
│       │   ├─ auth.repository.ts
│       │   ├─ auth.service.spec.ts
│       │   ├─ auth.service.ts
│       │   ├─ dto/
│       │   │   └─ auth.dto.ts
│       │   ├─ entity/
│       │   │   └─ auth.entity.ts
│       │   └─ strategies/
│       │       └─ jwt.strategy.ts
│       ├─ educator/
│       │   ├─ dto/
│       │   │   └─ educator.dto.ts
│       │   ├─ educator.controller.spec.ts
│       │   ├─ educator.controller.ts
│       │   ├─ educator.module.ts
│       │   ├─ educator.repository.ts
│       │   ├─ educator.service.spec.ts
│       │   ├─ educator.service.ts
│       │   ├─ educator.utils.ts
│       │   └─ entity/
│       │       └─ educator.entity.ts
│       ├─ grading-scale/
│       │   ├─ dto/
│       │   │   └─ grading-scale.dto.ts
│       │   ├─ entity/
│       │   │   └─ grading-scale.entity.ts
│       │   ├─ grading-scale.controller.spec.ts
│       │   ├─ grading-scale.controller.ts
│       │   ├─ grading-scale.module.ts
│       │   ├─ grading-scale.repository.ts
│       │   ├─ grading-scale.service.spec.ts
│       │   └─ grading-scale.service.ts
│       ├─ health/
│       │   ├─ health.controller.spec.ts
│       │   ├─ health.controller.ts
│       │   └─ health.module.ts
│       ├─ level/
│       │   ├─ dto/
│       │   │   └─ level.dto.ts
│       │   ├─ entity/
│       │   │   └─ level.entity.ts
│       │   ├─ level.controller.spec.ts
│       │   ├─ level.controller.ts
│       │   ├─ level.module.ts
│       │   ├─ level.repository.ts
│       │   ├─ level.service.spec.ts
│       │   └─ level.service.ts
│       ├─ notification/
│       │   ├─ dto/
│       │   │   └─ notification.dto.ts
│       │   ├─ entity/
│       │   │   └─ notification.entity.ts
│       │   ├─ notification.controller.spec.ts
│       │   ├─ notification.controller.ts
│       │   ├─ notification.module.ts
│       │   ├─ notification.repository.ts
│       │   ├─ notification.service.spec.ts
│       │   └─ notification.service.ts
│       ├─ organization/
│       │   ├─ dto/
│       │   │   └─ organization.dto.ts
│       │   ├─ entity/
│       │   │   └─ organization.entity.ts
│       │   ├─ organization.controller.spec.ts
│       │   ├─ organization.controller.ts
│       │   ├─ organization.module.ts
│       │   ├─ organization.repository.ts
│       │   ├─ organization.service.spec.ts
│       │   └─ organization.service.ts
│       ├─ platform/
│       │   ├─ dto/
│       │   │   ├─ create-admin.dto.ts
│       │   │   ├─ get-admins.dto.ts
│       │   │   ├─ login-platform.dto.ts
│       │   │   └─ reset-password.dto.ts
│       │   ├─ guards/
│       │   │   └─ platform-owner.guard.ts
│       │   ├─ platform.controller.spec.ts
│       │   ├─ platform.controller.ts
│       │   ├─ platform.module.ts
│       │   ├─ platform.service.spec.ts
│       │   ├─ platform.service.ts
│       │   └─ utils/
│       ├─ rubric/
│       │   ├─ dto/
│       │   │   └─ rubric.dto.ts
│       │   ├─ entity/
│       │   │   └─ rubric.entity.ts
│       │   ├─ rubric.controller.spec.ts
│       │   ├─ rubric.controller.ts
│       │   ├─ rubric.module.ts
│       │   ├─ rubric.repository.ts
│       │   ├─ rubric.service.spec.ts
│       │   └─ rubric.service.ts
│       ├─ school-year/
│       │   ├─ dto/
│       │   │   └─ school-year.dto.ts
│       │   ├─ entity/
│       │   │   └─ school-year.entity.ts
│       │   ├─ school-year.controller.spec.ts
│       │   ├─ school-year.controller.ts
│       │   ├─ school-year.module.ts
│       │   ├─ school-year.repository.ts
│       │   ├─ school-year.service.spec.ts
│       │   └─ school-year.service.ts
│       ├─ section/
│       │   ├─ dto/
│       │   │   └─ section.dto.ts
│       │   ├─ entity/
│       │   │   └─ section.entity.ts
│       │   ├─ section.controller.spec.ts
│       │   ├─ section.controller.ts
│       │   ├─ section.module.ts
│       │   ├─ section.repository.ts
│       │   ├─ section.service.spec.ts
│       │   └─ section.service.ts
│       ├─ semester/
│       │   ├─ dto/
│       │   │   └─ semester.dto.ts
│       │   ├─ entity/
│       │   │   └─ semester.entity.ts
│       │   ├─ semester.controller.spec.ts
│       │   ├─ semester.controller.ts
│       │   ├─ semester.module.ts
│       │   ├─ semester.repository.ts
│       │   ├─ semester.service.spec.ts
│       │   └─ semester.service.ts
│       ├─ student/
│       │   ├─ dto/
│       │   │   └─ student.dto.ts
│       │   ├─ entity/
│       │   │   └─ student.entity.ts
│       │   ├─ student.controller.spec.ts
│       │   ├─ student.controller.ts
│       │   ├─ student.module.ts
│       │   ├─ student.repository.ts
│       │   ├─ student.service.spec.ts
│       │   ├─ student.service.ts
│       │   └─ student.utils.ts
│       └─ subject/
│           ├─ dto/
│           │   └─ subject.dto.ts
│           ├─ entity/
│           │   └─ subject.entity.ts
│           ├─ subject.controller.spec.ts
│           ├─ subject.controller.ts
│           ├─ subject.module.ts
│           ├─ subject.repository.ts
│           ├─ subject.service.spec.ts
│           └─ subject.service.ts
└─ test/
    ├─ app.e2e-spec.ts
    └─ jest-e2e.json