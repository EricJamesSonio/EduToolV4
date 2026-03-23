================================================================================
  EDUTOOL — NESTJS BACKEND BUILD GUIDE
  Project structure, modules, build phases, conventions
================================================================================


================================================================================
  QUICK REFERENCE — WHAT THIS FILE COVERS
================================================================================

  1.  Project Structure
  2.  Build Philosophy — Phase-based approach
  3.  Phase 1 — Infrastructure & Core (no modules yet)
  4.  Phase 2 — Standalone Modules (no cross-module dependencies)
  5.  Phase 3 — Connected Modules (cross-module interactions)
  6.  Phase 4 — Event-Driven Modules (background + side effects)
  7.  Module Reference — all 22 modules
  8.  Event Catalogue — all system events
  9.  Coding Conventions & Rules
  10. API Endpoint Reference


================================================================================
  1. PROJECT STRUCTURE
================================================================================

  src/
    modules/
      auth/
      organization/
      school-year/
      semester/
      academic-calendar/
      level/
      section/
      subject/
      class/
      educator/
      student/
      enrollment/
      lesson/
      assessment/
      attendance/
      grade/
      grading-scale/
      rubric/
      meeting/
      notification/
      audit-log/
      export/

    commons/
      filters/
        http-exception.filter.ts
        all-exception.filter.ts
      pipes/
        validation.pipe.ts
        parse-int.pipe.ts
      decorators/
        current-user.decorator.ts
        roles.decorator.ts
        public.decorator.ts
      guards/
        auth.guard.ts
        roles.guard.ts
      utils/
        hash.util.ts
        token.util.ts
        date.util.ts
      interceptors/
        logging.interceptor.ts
        response.interceptor.ts

    core/
      logger/
        logger.ts
        logger.module.ts
      database/
        database.module.ts
        database.provider.ts
      events/
        event.module.ts
        event.service.ts
        events.constants.ts      <-- all event name strings live here
      middleware/
        request-id.middleware.ts

    configs/
      app.config.ts
      jwt.config.ts
      db.config.ts

    main.ts
    app.module.ts

  --------------------------------------------------------------------------------
  Module anatomy — every feature module follows this exact shape, no exceptions:
  --------------------------------------------------------------------------------

    module-name/
      module-name.module.ts
      module-name.controller.ts    <- HTTP only, no business logic
      module-name.service.ts       <- business logic, calls repository
      module-name.repository.ts    <- Prisma only, no logic
      dto/
        create-module-name.dto.ts
        update-module-name.dto.ts
        query-module-name.dto.ts   <- GET filter/pagination params
      entity/
        module-name.entity.ts      <- response shape / Swagger schema


================================================================================
  2. BUILD PHILOSOPHY — PHASE-BASED APPROACH
================================================================================

  The goal is to never be blocked by an unfinished dependency.
  We build in 4 phases:

  Phase 1 — Infrastructure
    Build everything that modules will depend on but that depends on nothing.
    Configs, core (database, logger, events, middleware), commons (guards,
    pipes, filters, interceptors, decorators, utils), and main.ts bootstrap.
    No feature modules yet. After this phase, the app boots with no routes
    but every shared tool is ready.

  Phase 2 — Standalone Modules
    Build each feature module in isolation. At this stage, a module only
    knows about itself and the database. No cross-module service injection.
    No events emitted. Just CRUD + its own business rules.
    Goal: every module can be tested independently before wiring anything up.

  Phase 3 — Connected Modules
    Start injecting one module's service into another where a direct,
    synchronous dependency makes sense (e.g. enrollment needs to know a
    student's current section; class needs to check educator availability).
    Add cross-module validation logic now.

  Phase 4 — Event-Driven Side Effects
    Wire up the event system. Modules that cause side effects (notification,
    audit-log) become pure event listeners. Other modules emit events instead
    of calling notification/audit services directly. Background jobs (concept
    extraction, assessment generation, auto-lock scheduler) go here too.

  Rule of thumb:
    If module A needs data FROM module B to do its own job -> inject B into A.
    If module A's action should TRIGGER something in module B as a side effect
    -> emit an event, let B listen. A should not know B exists.


================================================================================
  3. PHASE 1 — INFRASTRUCTURE & CORE
================================================================================

  Build these in order. Nothing else starts until Phase 1 is complete.

  --------------------------------------------------------------------------------
  3.1  configs/
  --------------------------------------------------------------------------------

  app.config.ts
    registerAs('app', () => ({
      port:        parseInt(process.env.PORT ?? '3000', 10),
      nodeEnv:     process.env.NODE_ENV ?? 'development',
      apiPrefix:   process.env.API_PREFIX ?? 'api',
      corsOrigins: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    }))

  jwt.config.ts
    registerAs('jwt', () => ({
      secret:           process.env.JWT_SECRET,
      accessExpiresIn:  process.env.JWT_ACCESS_EXPIRES  ?? '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES ?? '7d',
    }))

  db.config.ts
    registerAs('database', () => ({
      url:      process.env.DATABASE_URL,
      poolSize: parseInt(process.env.DB_POOL_SIZE ?? '10', 10),
    }))

  Validate all env vars with a Joi schema in ConfigModule.forRoot().
  A missing JWT_SECRET must crash the app on startup, not silently produce
  unsigned tokens.

  Required env variables:
    DATABASE_URL          required   Full Prisma connection string
    JWT_SECRET            required   Min 32 chars, random
    JWT_ACCESS_EXPIRES    optional   Default: 15m
    JWT_REFRESH_EXPIRES   optional   Default: 7d
    PORT                  optional   Default: 3000
    NODE_ENV              optional   development | production | test
    API_PREFIX            optional   Default: api
    CORS_ORIGINS          optional   Comma-separated allowed origins
    DB_POOL_SIZE          optional   Default: 10

  --------------------------------------------------------------------------------
  3.2  core/database/
  --------------------------------------------------------------------------------

  Singleton Prisma client. Never import PrismaClient directly anywhere else.
  Every repository receives the client via injection.

  database.provider.ts
    Provide a DATABASE_PROVIDER token. Factory reads DATABASE_URL from
    ConfigService, creates PrismaClient, calls $connect(), and returns it.

  database.module.ts
    Mark @Global(). Export DATABASE_PROVIDER. Import ConfigModule.
    AppModule imports this once — all other modules get it for free.

  In repositories:
    constructor(@Inject(DATABASE_PROVIDER) private readonly db: PrismaClient) {}

  RULE: Every repository query on org-scoped data must include
        WHERE org_id = :orgId. Never use findUnique on a bare ID without
        also scoping to the org. The orgId always comes from the JWT payload
        via @CurrentUser('orgId'), never from the request body.

  --------------------------------------------------------------------------------
  3.3  core/logger/
  --------------------------------------------------------------------------------

  Winston-based structured logger. Every log entry is JSON with:
    timestamp, level, requestId, context (class name), message.

  logger.ts
    Create the Winston instance with Console + File transports.
    Console: JSON format. Files: error.log and combined.log.

  logger.module.ts
    @Global(). Wrap with WinstonModule.forRoot(). Replace NestJS's built-in
    logger so internal NestJS logs also pass through Winston.

  --------------------------------------------------------------------------------
  3.4  core/middleware/request-id.middleware.ts
  --------------------------------------------------------------------------------

  Attaches a unique request ID (UUID v4) to every incoming request.
  - Check if X-Request-Id header already exists (forwarded from gateway/proxy).
  - If not, generate a new UUID v4.
  - Set req['requestId'] and res.setHeader('X-Request-Id', requestId).
  - Store in AsyncLocalStorage so every log line in the request cycle
    carries the same requestId without passing it manually.

  Apply in AppModule via configure(consumer) { consumer.apply(...).forRoutes('*') }

  --------------------------------------------------------------------------------
  3.5  core/events/
  --------------------------------------------------------------------------------

  NestJS EventEmitter for decoupled side effects.
  Install: @nestjs/event-emitter

  event.module.ts
    @Global(). EventEmitterModule.forRoot(). Export EventEmitter2.

  events.constants.ts
    All event name strings as constants to avoid typos:

      export const EVENTS = {
        ENROLLMENT_CREATED:               'enrollment.created',
        ENROLLMENT_REMOVED:               'enrollment.removed',
        ASSESSMENT_RELEASED:              'assessment.released',
        ASSESSMENT_DEADLINE_APPROACHING:  'assessment.deadline.approaching',
        SCORE_PUBLISHED:                  'score.published',
        GRADE_LOCKED:                     'grade.locked',
        GRADE_LOCK_WINDOW_OPENED:         'grade.lock-window.opened',
        GRADE_AUTO_LOCKED:                'grade.auto-locked',
        CLASS_REASSIGNED:                 'class.reassigned',
        MEETING_CREATED:                  'meeting.created',
        CONCEPT_EXTRACTION_REQUESTED:     'concept.extraction.requested',
        CONCEPT_EXTRACTION_COMPLETED:     'concept.extraction.completed',
        ASSESSMENT_GENERATION_COMPLETED:  'assessment.generation.completed',
        STUDENT_STATUS_CHANGED:           'student.status.changed',
        STUDENT_PROFILE_CHANGED:          'student.profile.changed',
        PASSWORD_RESET:                   'password.reset',
        SECTION_CAPACITY_OVERFLOW:        'section.capacity.overflow',
        CLASS_CAPACITY_OVERFLOW:          'class.capacity.overflow',
      }

  event.service.ts
    Thin wrapper around EventEmitter2. Provides a typed emit() method.
    Inject this in services that emit events instead of injecting EventEmitter2
    directly — makes mocking easier in tests.

  --------------------------------------------------------------------------------
  3.6  commons/
  --------------------------------------------------------------------------------

  BUILD ORDER within commons:
    1. utils/ — no dependencies, pure functions
    2. decorators/ — no dependencies
    3. pipes/ — no dependencies
    4. filters/ — depends on logger
    5. guards/ — depends on jwt config + decorators
    6. interceptors/ — depends on logger

  ── utils/ ──────────────────────────────────────────────────────────────────

  hash.util.ts
    hashPassword(plain: string): Promise<string>    -> bcrypt hash, 12 rounds
    comparePassword(plain: string, hash: string): Promise<boolean>
    Only used in auth module during login and account creation.

  token.util.ts
    signAccessToken(payload: JwtPayload): string
    signRefreshToken(payload: JwtPayload): string
    verifyToken(token: string): JwtPayload
    Thin wrappers around @nestjs/jwt. Read expiry/secret from ConfigService.

  date.util.ts
    isHoliday(date: Date, calendarEvents: CalendarEvent[]): boolean
    isNoClassDay(date: Date, calendarEvents: CalendarEvent[]): boolean
    computeWeekIndex(date: Date, classStart: Date, calendarEvents: CalendarEvent[]): string
      -> returns '1', '2', '3' for single-day classes
      -> returns '1.1', '1.2', '2.1', '2.2' for multi-day classes
    isOverlapping(rangeA: DateRange, rangeB: DateRange): boolean
    formatTermLabel(term: Term): string

    These are used by class (session generation), attendance (session skipping),
    and semester (date overlap validation). Centralise here — do not duplicate.

  ── decorators/ ──────────────────────────────────────────────────────────────

  current-user.decorator.ts
    Extracts req.user (decoded JWT payload) from the execution context.
    Supports optional field access: @CurrentUser('orgId') orgId: string

  roles.decorator.ts
    @Roles(Role.ADMIN, Role.EDUCATOR)
    Sets roles metadata on a route handler. Consumed by RolesGuard.

  public.decorator.ts
    @Public()
    Marks a route as public — AuthGuard skips JWT verification for it.
    Apply to POST /auth/login and POST /auth/refresh.

  ── pipes/ ───────────────────────────────────────────────────────────────────

  validation.pipe.ts
    Extends NestJS ValidationPipe with:
      transform: true           — DTOs are class instances, not plain objects
      whitelist: true           — strips unknown fields
      forbidNonWhitelisted: true
      exceptionFactory: format class-validator errors into a flat list

  parse-int.pipe.ts
    Parses a route param to integer. Throws 400 if not a valid integer.
    Use selectively on :id params that should be integers.

  ── filters/ ─────────────────────────────────────────────────────────────────

  http-exception.filter.ts
    Catches all HttpExceptions. Returns consistent JSON envelope:
      {
        statusCode, error, message,
        requestId (from AsyncLocalStorage),
        timestamp, path
      }

  all-exception.filter.ts
    Catches everything else (runtime errors, Prisma errors, third-party).
    Logs full stack trace via logger. Returns generic 500.
    Prevents raw error details from reaching clients.

    Register in main.ts in this order:
      app.useGlobalFilters(new AllExceptionFilter(logger), new HttpExceptionFilter(logger))
    AllExceptionFilter must be registered first (outermost catch).

  ── guards/ ──────────────────────────────────────────────────────────────────

  auth.guard.ts
    @Injectable() implements CanActivate
    - Check if route has @Public() decorator — skip if yes.
    - Extract Bearer token from Authorization header.
    - Verify with JwtService. Throw 401 on missing/expired/invalid.
    - Attach decoded payload to req.user.
    Applied globally in main.ts.

  roles.guard.ts
    @Injectable() implements CanActivate
    - Read @Roles() metadata from route handler.
    - If no roles set, allow through.
    - Compare req.user.role against allowed roles.
    - Throw 403 if not in list.
    Applied globally in main.ts AFTER auth.guard.

  Role enum:
    export enum Role {
      PLATFORM_OWNER = 'PLATFORM_OWNER',
      ADMIN          = 'ADMIN',
      EDUCATOR       = 'EDUCATOR',
      STUDENT        = 'STUDENT',
    }

  ── interceptors/ ────────────────────────────────────────────────────────────

  response.interceptor.ts
    Wraps all 2xx responses in a consistent envelope:
      { success: true, statusCode, data, timestamp }
    Apply globally. This runs AFTER controller returns.

  logging.interceptor.ts
    Logs every request and response:
      request:  requestId, method, path
      response: requestId, method, path, statusCode, duration (ms)
    Errors logged at error level, all others at info.
    Reads requestId from AsyncLocalStorage — no need to pass it manually.

  --------------------------------------------------------------------------------
  3.7  main.ts
  --------------------------------------------------------------------------------

  Full bootstrap — wire everything in this order:

    const app = await NestFactory.create(AppModule, { logger: winstonLogger });
    const config = app.get(ConfigService);

    app.setGlobalPrefix(config.get('app.apiPrefix'));
    app.enableCors({ origin: config.get('app.corsOrigins'), credentials: true });

    // Middleware
    app.use(requestIdMiddleware);

    // Pipes
    app.useGlobalPipes(new CustomValidationPipe());

    // Filters (AllException outermost, then Http)
    app.useGlobalFilters(
      new AllExceptionFilter(logger),
      new HttpExceptionFilter(logger),
    );

    // Interceptors
    app.useGlobalInterceptors(
      new LoggingInterceptor(logger),
      new ResponseInterceptor(),
    );

    // Guards (Auth before Roles)
    app.useGlobalGuards(
      new AuthGuard(jwtService, reflector),
      new RolesGuard(reflector),
    );

    // Swagger (dev only)
    if (nodeEnv !== 'production') {
      SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
    }

    await app.listen(config.get('app.port'));

  Order matters. Auth guard must run before Roles guard.
  Filters are applied outermost-first.

  --------------------------------------------------------------------------------
  PHASE 1 COMPLETE CHECKLIST
  --------------------------------------------------------------------------------

    [ ] ConfigModule loads and validates all env vars on startup
    [ ] App fails fast if JWT_SECRET or DATABASE_URL is missing
    [ ] DatabaseModule connects Prisma on startup
    [ ] LoggerModule replaces NestJS default logger
    [ ] RequestIdMiddleware attaches requestId to every request
    [ ] EventModule is globally available
    [ ] All commons are importable and individually unit-testable
    [ ] main.ts boots with no routes but all globals wired
    [ ] GET /health returns 200 (add a minimal HealthModule for sanity check)


================================================================================
  4. PHASE 2 — STANDALONE MODULES
================================================================================

  In Phase 2 we build each feature module as a self-contained unit.
  Rules for this phase:
    - No service from another feature module is injected yet.
    - No events are emitted yet.
    - Only the module's own repository, its own business rules,
      and the database are in play.
    - Every module should be fully testable in isolation with a mocked repo.

  Build in this order (each one depends only on what came before):

  ────────────────────────────────────────────────────────────────────────────
  4.1  auth
  ────────────────────────────────────────────────────────────────────────────

  Handles login and JWT issuance only. No self-registration.
  In Phase 2, auth only checks credentials exist in the DB and issues tokens.
  Account status checks (Suspended, Dropped, etc.) added in Phase 3 once
  student/educator modules are stable.

  What to build:
    - AuthRepository: find account by email across all account types
    - AuthService: validate credentials (hash.util), issue JWT pair (token.util)
    - AuthController:
        POST /auth/login    -> @Public()
        POST /auth/refresh  -> @Public()
        POST /auth/logout
        GET  /auth/me

  JWT Payload shape:
    {
      sub:   string   // user ID
      email: string
      role:  Role
      orgId: string   // null for PLATFORM_OWNER
      iat:   number
      exp:   number
    }

  ────────────────────────────────────────────────────────────────────────────
  4.2  organization
  ────────────────────────────────────────────────────────────────────────────

  Each Admin owns exactly one org. Created on first login.
  All other modules scope queries to this org via orgId from JWT.

  What to build:
    - OrgRepository: findByAdminId, create, update
    - OrgService: create org, get org, update name/description
    - OrgController:
        POST  /organization
        GET   /organization         -> @Roles(ADMIN)
        PATCH /organization         -> @Roles(ADMIN)

  RULE: Multi-tenant isolation is enforced at the repository layer.
  Every query that reads org-scoped data includes WHERE org_id = :orgId.
  The orgId comes from @CurrentUser('orgId'), never from req.body.

  ────────────────────────────────────────────────────────────────────────────
  4.3  level
  ────────────────────────────────────────────────────────────────────────────

  Manages the org's level defaults template and per-school-year level structure.
  Built-in types: Elementary, High School, Senior High, College.
  Admin can also add custom programs.

  What to build:
    - LevelRepository: find defaults by orgId, find by schoolYearId, update
    - LevelService: get/update defaults, get/update school year levels
    - LevelController:
        GET   /levels/defaults
        PATCH /levels/defaults          -> @Roles(ADMIN)
        GET   /levels?schoolYearId=
        PATCH /levels/:id               -> @Roles(ADMIN)

  In Phase 2, level defaults are independent of school-year module.
  School-year seeding from defaults is wired in Phase 3.

  ────────────────────────────────────────────────────────────────────────────
  4.4  section
  ────────────────────────────────────────────────────────────────────────────

  Named student groupings per grade/year level. Always custom-named by Admin.
  No auto-naming. Each section has a capacity limit.

  What to build:
    - SectionRepository: CRUD, countStudentsBySection(sectionId)
    - SectionService: create, list, edit name/capacity, soft delete
    - SectionController:
        POST   /sections                -> @Roles(ADMIN)
        GET    /sections
        PATCH  /sections/:id            -> @Roles(ADMIN)
        DELETE /sections/:id            -> @Roles(ADMIN)

  Capacity overflow prompt logic is added in Phase 3 when student module exists.

  ────────────────────────────────────────────────────────────────────────────
  4.5  school-year
  ────────────────────────────────────────────────────────────────────────────

  Status: Pending -> Active -> Ended. Only one Active at a time.
  New year inherits from level defaults on creation.

  What to build:
    - SchoolYearRepository: CRUD, findActiveByOrgId, countActiveByOrgId
    - SchoolYearService:
        - create (seed from level defaults in Phase 3 — stub for now)
        - list, activate (guard: only one Active), end (archive)
    - SchoolYearController:
        POST   /school-years                    -> @Roles(ADMIN)
        GET    /school-years
        PATCH  /school-years/:id/activate       -> @Roles(ADMIN)
        PATCH  /school-years/:id/end            -> @Roles(ADMIN)
        PATCH  /school-years/:id                -> @Roles(ADMIN)

  ────────────────────────────────────────────────────────────────────────────
  4.6  semester
  ────────────────────────────────────────────────────────────────────────────

  Reusable templates. Up to 3 semesters per template, each with non-overlapping
  date ranges and custom terms. Programs select a template per school year.

  What to build:
    - SemesterRepository: CRUD
    - SemesterService:
        - validate date ranges (isOverlapping from date.util)
        - validate terms exist per semester
    - SemesterController:
        POST   /semester-settings               -> @Roles(ADMIN)
        GET    /semester-settings
        PATCH  /semester-settings/:id           -> @Roles(ADMIN)
        DELETE /semester-settings/:id           -> @Roles(ADMIN)

  ────────────────────────────────────────────────────────────────────────────
  4.7  academic-calendar
  ────────────────────────────────────────────────────────────────────────────

  Org-wide events per school year.
  Types: Holiday, No Class Day (skip sessions), Exam Week, Special Event (advisory).

  What to build:
    - CalendarRepository: CRUD, findBySchoolYear, findByDateRange
    - CalendarService: create, list, edit, soft delete
      - Warn on retroactive event creation (date < today)
    - CalendarController:
        POST   /academic-calendar               -> @Roles(ADMIN)
        GET    /academic-calendar?schoolYearId=
        PATCH  /academic-calendar/:id           -> @Roles(ADMIN)
        DELETE /academic-calendar/:id           -> @Roles(ADMIN)

  In Phase 3, session generation in the class module will query this to
  skip Holiday and No Class Day dates.

  ────────────────────────────────────────────────────────────────────────────
  4.8  educator
  ────────────────────────────────────────────────────────────────────────────

  Admin creates educator accounts. System-generated Educator ID on creation.
  Password reset by Admin only.

  What to build:
    - EducatorRepository: CRUD, findByIdOrName
    - EducatorService:
        - create (generate system password via hash.util)
        - list, view profile, edit, soft delete (block if active classes in Phase 3)
        - resetPassword
    - EducatorController:
        POST   /educators                       -> @Roles(ADMIN)
        GET    /educators
        GET    /educators/:id
        PATCH  /educators/:id                   -> @Roles(ADMIN)
        DELETE /educators/:id                   -> @Roles(ADMIN)
        POST   /educators/:id/reset-password    -> @Roles(ADMIN)

  ────────────────────────────────────────────────────────────────────────────
  4.9  student
  ────────────────────────────────────────────────────────────────────────────

  Most complex account type. Dynamic profile based on level section.
  Full status lifecycle. Bulk CSV import supported.

  Statuses:
    Active      - normal access
    Pending     - section unresolved, cannot access system
    Dropped     - read-only, no login, enrollments removed
    Transferred - same as Dropped
    Suspended   - no login, enrollments intact
    Graduated   - system-set at max year, read-only

  Status transition rules:
    Dropped / Transferred / Graduated -> cannot reverse to Active without
    explicit Admin confirmation (logged to audit-log in Phase 4).
    Suspended -> Active: Admin lifts directly.
    Pending -> Active: resolved when Admin assigns valid section.

  What to build:
    - StudentRepository: CRUD, findByIdOrName, search with filters
    - StudentService:
        - create (generate system password, section capacity check — stub in Phase 2)
        - list, view, edit profile
        - change status (enforce transition rules)
        - bulk CSV import (validate rows, create valid accounts)
        - resetPassword
        - download credentials CSV
    - StudentController:
        POST   /students                        -> @Roles(ADMIN)
        GET    /students
        GET    /students/:id
        PATCH  /students/:id                    -> @Roles(ADMIN)
        PATCH  /students/:id/status             -> @Roles(ADMIN)
        POST   /students/import                 -> @Roles(ADMIN)
        POST   /students/:id/reset-password     -> @Roles(ADMIN)
        GET    /students/credentials-csv        -> @Roles(ADMIN)

  Section capacity check (Phase 2 stub):
    For now, just check if sectionId exists and the section has capacity > 0.
    Full overflow prompt logic (create new section OR leave Pending) added
    in Phase 3 when section module interaction is wired.

  ────────────────────────────────────────────────────────────────────────────
  4.10  grading-scale
  ────────────────────────────────────────────────────────────────────────────

  Per-level-section scale. Ranges must cover 0-100, no gaps or overlaps.

  What to build:
    - GradingScaleRepository: CRUD, findByLevelSection
    - GradingScaleService:
        - create and validate (ranges cover 0-100 fully)
        - lock/unlock (lock on first grade lock, unlock on new school year)
    - GradingScaleController:
        POST   /grading-scales                  -> @Roles(ADMIN)
        GET    /grading-scales
        PATCH  /grading-scales/:id              -> @Roles(ADMIN)

  ────────────────────────────────────────────────────────────────────────────
  4.11  rubric
  ────────────────────────────────────────────────────────────────────────────

  Two types: Admin org default and Educator personal library.
  Weights must total exactly 100%. Locks once first student is enrolled.

  Category types:
    assessment-linked  -> auto-pulls from assessments (Activities, Quizzes, Exams)
    manual-entry       -> educator inputs directly (Attendance, Behavior, Recitation)

  What to build:
    - RubricRepository: CRUD, findDefault, findByEducator
    - RubricService:
        - validateWeights (must sum to 100%)
        - Admin: get/update org default
        - Educator: CRUD personal library
        - lock (triggered in Phase 3 when first student enrolled in a class)
    - RubricController:
        GET    /rubrics/default
        PATCH  /rubrics/default                 -> @Roles(ADMIN)
        POST   /rubrics                         -> @Roles(EDUCATOR)
        GET    /rubrics                         -> @Roles(EDUCATOR)
        PATCH  /rubrics/:id                     -> @Roles(EDUCATOR)

  ────────────────────────────────────────────────────────────────────────────
  4.12  subject
  ────────────────────────────────────────────────────────────────────────────

  Each subject assigned to an educator, assigned a grading system.
  Lock/unlock lifecycle: unlocked at year start, Admin manually locks.

  What to build:
    - SubjectRepository: CRUD, findByLevel, findByEducator
    - SubjectService: create, list, edit, lock, unlock
    - SubjectController:
        POST   /subjects                        -> @Roles(ADMIN)
        GET    /subjects
        PATCH  /subjects/:id                    -> @Roles(ADMIN)
        PATCH  /subjects/:id/lock               -> @Roles(ADMIN)
        PATCH  /subjects/:id/unlock             -> @Roles(ADMIN)

  ────────────────────────────────────────────────────────────────────────────
  4.13  notification
  ────────────────────────────────────────────────────────────────────────────

  In Phase 2, build the storage and retrieval layer only.
  Event listeners are wired in Phase 4.

  What to build:
    - NotificationRepository: create, findByUser, deleteById
    - NotificationService:
        - createNotification(userId, message, type)   <- called by event listeners later
        - listForUser(userId)
        - dismiss(id, userId)
        - archiveOlderThan90Days()  <- scheduled job in Phase 4
    - NotificationController:
        GET    /notifications
        DELETE /notifications/:id

  ────────────────────────────────────────────────────────────────────────────
  4.14  audit-log
  ────────────────────────────────────────────────────────────────────────────

  In Phase 2, build the write and read layer only.
  Event listeners are wired in Phase 4.

  Two tiers. Both are immutable — never deleted.

  Admin Audit Log — high-impact Admin actions:
    student profile changes (field, old value, new value)
    account status changes
    subject enrollment changes
    educator class assignment changes
    section/class capacity overflow decisions
    password resets
    grade lock overrides
    academic calendar changes

  Educator Activity Log — per-class events (scoped to own classes):
    student enrolled / removed
    meeting started / ended
    assessment created, edited, published, deleted
    scores published / unpublished
    grade locked
    lesson created / updated
    concept extraction triggered / completed

  What to build:
    - AuditLogRepository:
        createAdminLog(actor, actionType, targetEntity, details)
        createActivityLog(educatorId, classId, eventType, details)
        findAdminLogs(filters: { dateRange, actionType, targetEntity })
        findActivityLogs(classId)
    - AuditLogService: thin wrapper around repository
    - AuditLogController:
        GET /audit-log              -> @Roles(ADMIN)
        GET /activity-log?classId=  -> @Roles(EDUCATOR, ADMIN)

  ────────────────────────────────────────────────────────────────────────────
  PHASE 2 COMPLETE CHECKLIST
  ────────────────────────────────────────────────────────────────────────────

    [ ] Each module unit-tested with mocked repository
    [ ] Auth issues valid JWTs and guards work
    [ ] Org scoping works — all repo queries include orgId
    [ ] Section/student/educator CRUD works end-to-end
    [ ] Grading scale validates range coverage
    [ ] Rubric validates 100% weight total
    [ ] Notification and audit-log can store and retrieve records


================================================================================
  5. PHASE 3 — CONNECTED MODULES
================================================================================

  Now we inject modules into each other where a synchronous dependency is needed.
  A module needs to know the result of another module's query before it can
  proceed with its own work. That is a direct injection, not an event.

  Examples of direct injection (synchronous — needs the answer now):
    - enrollment needs student service (is student Active?)
    - enrollment needs class service (is class at capacity?)
    - class needs academic-calendar service (which dates are holidays?)
    - class needs educator service (is educator free at this time?)
    - section capacity check needs section service

  ────────────────────────────────────────────────────────────────────────────
  5.1  section <-> student (capacity enforcement)
  ────────────────────────────────────────────────────────────────────────────

  Wire SectionService into StudentService.

  On student create or profile update:
    1. Check section.countStudentsInSection(sectionId) vs section.capacity.
    2. If at capacity:
       - Prompt Admin: create new section OR leave student Pending.
       - If new section: Admin names it. New section created. Student assigned.
       - If Pending: student saved with status = Pending, no section.
    3. Result logged to audit-log (emit event in Phase 4).

  ────────────────────────────────────────────────────────────────────────────
  5.2  school-year -> level (seeding on creation)
  ────────────────────────────────────────────────────────────────────────────

  Wire LevelService into SchoolYearService.

  On school year creation:
    1. Fetch org's level defaults from LevelService.
    2. Deep-clone the structure into the new school year's level records.
    3. Changes to the school year's levels are independent of defaults after this.

  ────────────────────────────────────────────────────────────────────────────
  5.3  class (session generation)
  ────────────────────────────────────────────────────────────────────────────

  Wire AcademicCalendarService and DateUtil into ClassService.

  On class creation:
    1. Get semester date range from the class's semester setting.
    2. Iterate over every occurrence of the class's weekday(s) in the range.
    3. For each date, call isHoliday() or isNoClassDay() from date.util
       using the org's academic calendar events.
    4. Skip holiday/no-class dates. Assign week indexes via computeWeekIndex().
    5. Persist session records.

  Schedule conflict validation:
    Type 1: same level + section + time slot + day -> ConflictException
    Type 2: educator double-booked at same time across any level -> ConflictException
    Run both checks on POST /classes and PATCH /classes/:id.

  ────────────────────────────────────────────────────────────────────────────
  5.4  enrollment (full validation suite)
  ────────────────────────────────────────────────────────────────────────────

  enrollment is the most validation-heavy module. Wire in:
    StudentService  -> check student is Active
    ClassService    -> check capacity, check no schedule conflict
    SectionService  -> check student's section matches class section (if set)

  On POST /enrollments:
    1. Fetch student. Must be Active. Throw 400 if not.
    2. Validate level section + grade/year level + course/strand match.
    3. Validate section match if class has a section set.
    4. Check no duplicate enrollment (same subject, same semester).
    5. Check class capacity. If full:
       - Prompt Admin: add parallel session OR leave student Pending Enrollment.
       - If new session: create parallel class, enroll student there.
       - If Pending: save enrollment with status = PENDING.
    6. Wrap steps 4+5 in a database transaction with row locking.
    7. Rubric locks after first enrollment (call rubric.lockForClass(classId)).

  USE TRANSACTIONS for capacity check + insert. Race conditions are likely
  under bulk imports where multiple enrollments hit the same class simultaneously.

  ────────────────────────────────────────────────────────────────────────────
  5.5  educator -> class (removal block)
  ────────────────────────────────────────────────────────────────────────────

  Wire ClassService into EducatorService.

  On DELETE /educators/:id:
    1. Check classService.hasActiveClasses(educatorId).
    2. If yes, throw 409: "Educator has active classes. Reassign them first."
    3. If no, proceed with soft delete.

  ────────────────────────────────────────────────────────────────────────────
  5.6  class -> educator (reassignment)
  ────────────────────────────────────────────────────────────────────────────

  On PATCH /classes/:id/reassign:
    1. Validate new educator exists and is in the same org.
    2. Create an ownership history record:
         previousEducatorId, fromDate, toDate (today), reason (optional note)
         newEducatorId, startDate (today)
    3. Update class.educatorId to new educator.
    4. New educator inherits all lessons, assessments, scores, attendance.
    5. Previously recorded scores remain attributed to the original educator.
    6. Emit CLASS_REASSIGNED event (Phase 4).

  ────────────────────────────────────────────────────────────────────────────
  5.7  lesson (concept extraction trigger)
  ────────────────────────────────────────────────────────────────────────────

  On POST /lessons or PATCH /lessons/:id:
    1. If lesson detail >= 10 words and no concept build exists:
       - Emit CONCEPT_EXTRACTION_REQUESTED (Phase 4 wires the listener).
    2. If detail updated and a concept build already exists:
       - Leave old build as-is. Educator manually triggers /re-extract.
    3. On POST /lessons/:id/re-extract:
       - Emit CONCEPT_EXTRACTION_REQUESTED.
       - Old concept build replaced when new one completes.

  ────────────────────────────────────────────────────────────────────────────
  5.8  assessment (attempt control)
  ────────────────────────────────────────────────────────────────────────────

  One active attempt per student across all tabs and devices.

  On POST /assessments/:id/attempts (student opens assessment):
    1. Check for an existing attempt with status = Active for this student.
    2. If found: return existing attempt with saved progress. Do not create new.
    3. If not found: create new attempt, status = Active.
    4. If end date has passed: throw 403 Forbidden.

  On PATCH /assessments/:id/attempts/:attemptId (auto-save):
    1. Validate attemptId belongs to the authenticated student.
    2. Update saved answers. Status stays Active.

  On POST /assessments/:id/attempts/:attemptId/submit:
    1. Validate attemptId belongs to student and status = Active.
    2. Auto-grade MC, T/F, Identification, Enumeration.
    3. Set attempt status = Submitted. Score saved.
    4. Auto-mark attendance Present for today's session if one exists.

  On end date passing (scheduler in Phase 4):
    All Draft attempts for that assessment are closed automatically.

  ────────────────────────────────────────────────────────────────────────────
  5.9  grade (computation)
  ────────────────────────────────────────────────────────────────────────────

  Wire AssessmentService and RubricService into GradeService.

  Grade computation per term per student:
    1. Fetch all assessments for the class + term.
    2. Fetch student's scores for each assessment.
    3. Group by rubric category.
    4. For assessment-linked categories:
         category score = sum(earned) / sum(total) * 100
    5. For manual-entry categories:
         category score = whatever the educator entered.
    6. Apply rubric weights.
    7. Term grade = weighted average.
    8. Overall subject grade = average (or weighted) of all term grades.

  On grade lock:
    1. All unpublished scores are set to published = true.
    2. Final grade is revealed to students.
    3. If any essay items are ungraded, warn but allow.
    4. Grade becomes read-only.
    5. Emit GRADE_LOCKED event (Phase 4).
    6. Grading scale locks if this is the first lock for the level section
       in this school year.

  ────────────────────────────────────────────────────────────────────────────
  5.10  attendance (auto-mark from assessment)
  ────────────────────────────────────────────────────────────────────────────

  Wire AttendanceService into AssessmentService (or handle in assessment submit).

  On assessment submission (POST /assessments/:id/attempts/:attemptId/submit):
    1. Find today's session for the student's class.
    2. If a session exists and student has no attendance record yet for it:
       - Auto-mark Present.
    3. If attendance record already exists (manually set): leave it alone.

  ────────────────────────────────────────────────────────────────────────────
  PHASE 3 COMPLETE CHECKLIST
  ────────────────────────────────────────────────────────────────────────────

    [ ] Section capacity overflow prompt works (new section OR Pending)
    [ ] New school year seeds structure from level defaults
    [ ] Class session generation skips holidays and no-class days
    [ ] Class schedule conflict validation (both types) works
    [ ] Enrollment validates all 5 conditions and uses transactions
    [ ] Rubric locks on first enrollment
    [ ] Educator deletion blocked if active classes exist
    [ ] Class reassignment creates ownership history record
    [ ] Assessment attempt control (one active attempt per student)
    [ ] Grade computation respects rubric weights and categories
    [ ] Auto-attendance mark on assessment submission


================================================================================
  6. PHASE 4 — EVENT-DRIVEN SIDE EFFECTS
================================================================================

  Now we wire the event system. The rule:
    Modules that cause side effects should not know about notification or
    audit-log modules. They emit an event. notification and audit-log listen.

  notification and audit-log modules are pure listeners in this phase.
  They should have zero imports from other feature modules in their own
  module.ts — only @OnEvent decorators.

  ────────────────────────────────────────────────────────────────────────────
  6.1  notification event listeners
  ────────────────────────────────────────────────────────────────────────────

  Add @OnEvent handlers in NotificationService for each of these:

  EVENTS.ENROLLMENT_CREATED
    -> notify educator: "Student [name] was added to your class [title] by Admin."
    -> notify student: "You have been enrolled in [subject]."

  EVENTS.ENROLLMENT_REMOVED
    -> notify educator: "Student [name] was removed from [title] by Admin."

  EVENTS.ASSESSMENT_RELEASED
    -> notify assigned students: "Assessment [title] is now available."

  EVENTS.ASSESSMENT_DEADLINE_APPROACHING
    -> notify assigned students: "Assessment [title] closes in [X] hours."

  EVENTS.SCORE_PUBLISHED
    -> notify student(s): "Your score for [assessment] has been published."

  EVENTS.GRADE_LOCKED
    -> notify students in class: "Grades have been locked for [subject]. All scores visible."

  EVENTS.GRADE_LOCK_WINDOW_OPENED
    -> notify all educators in org: "Grade lock window is now open. Deadline: [date]."

  EVENTS.GRADE_AUTO_LOCKED
    -> notify affected educator: "Grades for [class] were auto-locked (deadline passed)."

  EVENTS.CLASS_REASSIGNED
    -> notify new educator: "You have been assigned to [class title]."

  EVENTS.MEETING_CREATED
    -> notify invited students: "A meeting has been scheduled: [title] on [date]."

  EVENTS.CONCEPT_EXTRACTION_COMPLETED
    -> notify educator: "Concept extraction complete for lesson [title]."

  EVENTS.ASSESSMENT_GENERATION_COMPLETED
    -> notify educator: "Assessment [title] has been generated and is ready to review."

  EVENTS.SECTION_CAPACITY_OVERFLOW
    -> notify Admin: "Section [name] is full. A student is pending section assignment."

  EVENTS.CLASS_CAPACITY_OVERFLOW
    -> notify Admin: "Class [title] is full. A student has pending enrollment."

  ────────────────────────────────────────────────────────────────────────────
  6.2  audit-log event listeners
  ────────────────────────────────────────────────────────────────────────────

  Add @OnEvent handlers in AuditLogService for each of these:

  EVENTS.STUDENT_PROFILE_CHANGED
    -> Admin Audit Log: field changed, old value, new value, actor, timestamp

  EVENTS.STUDENT_STATUS_CHANGED
    -> Admin Audit Log: old status, new status, actor, timestamp

  EVENTS.ENROLLMENT_CREATED
    -> Admin Audit Log: studentId, classId, actor (always Admin)

  EVENTS.ENROLLMENT_REMOVED
    -> Admin Audit Log: studentId, classId, actor

  EVENTS.PASSWORD_RESET
    -> Admin Audit Log: target account, reset by (Admin)

  EVENTS.CLASS_REASSIGNED
    -> Admin Audit Log + Educator Activity Log: previous educator, new educator,
       reason, date range

  EVENTS.GRADE_LOCKED
    -> Educator Activity Log: classId, lockedBy (educator or auto), timestamp

  EVENTS.SECTION_CAPACITY_OVERFLOW
    -> Admin Audit Log: sectionId, decision (new section OR pending), result

  EVENTS.CLASS_CAPACITY_OVERFLOW
    -> Admin Audit Log: classId, decision (new session OR pending), result

  EVENTS.CONCEPT_EXTRACTION_REQUESTED + COMPLETED
    -> Educator Activity Log: lessonId, classId, timestamps

  EVENTS.ASSESSMENT_CREATED / PUBLISHED / DELETED
    -> Educator Activity Log per event

  EVENTS.SCORE_PUBLISHED / UNPUBLISHED
    -> Educator Activity Log: assessmentId, scope (all or selected students)

  ────────────────────────────────────────────────────────────────────────────
  6.3  background jobs (scheduled tasks)
  ────────────────────────────────────────────────────────────────────────────

  Use @nestjs/schedule (CronJob) for these:

  Assessment end-date closer
    Runs every minute (or at a fine interval).
    Finds all assessments where endDate <= now and status != CLOSED.
    Sets all Draft attempts for those assessments to CLOSED.

  Assessment deadline notification
    Runs hourly or configurable.
    Finds assessments where endDate is within the notification window (e.g. 24h).
    Emits EVENTS.ASSESSMENT_DEADLINE_APPROACHING for each affected student.

  Grade auto-lock
    Runs every hour (or at midnight).
    Finds all classes where lock window deadline has passed and grade is not locked.
    Locks those grades automatically.
    Emits EVENTS.GRADE_AUTO_LOCKED for the affected educator.

  Notification archival
    Runs daily at midnight.
    Finds all notifications older than 90 days.
    Sets archived = true. Removes from active list.

  ────────────────────────────────────────────────────────────────────────────
  6.4  AI background jobs
  ────────────────────────────────────────────────────────────────────────────

  Concept extraction job
    Listener: @OnEvent(EVENTS.CONCEPT_EXTRACTION_REQUESTED)
    Input: lessonId, lesson detail text
    Process:
      1. Send lesson detail to AI service (OpenAI or internal).
      2. Parse response into concept sections with available item counts.
      3. Store concept build against the lesson.
      4. Emit EVENTS.CONCEPT_EXTRACTION_COMPLETED.
    Non-blocking — original lesson save returns immediately.
    On re-extraction: replace old concept build entirely.
    WARNING: re-extraction does not affect assessments already generated
    from the old build. Only new assessments will use the updated build.

  Assessment generation job
    Listener: @OnEvent(EVENTS.ASSESSMENT_GENERATION_REQUESTED)
    Input: assessmentId, template config (item ranges, types, concept sections)
    Process:
      1. For each item range, call AI to generate questions of the specified type
         from the specified concept sections.
      2. Validate item count matches the configured range.
      3. Store generated questions against the assessment.
      4. Emit EVENTS.ASSESSMENT_GENERATION_COMPLETED.
    Non-blocking — assessment creation returns immediately with status = GENERATING.
    Questions become editable after generation (before release date).

  ────────────────────────────────────────────────────────────────────────────
  6.5  meeting (built-in room)
  ────────────────────────────────────────────────────────────────────────────

  Build meeting module in Phase 4 since it depends on:
    - academic-calendar (suppress reminders on event days)
    - notification (via events)

  What to build:
    - MeetingRepository: CRUD, findByClass, findInvitedStudents
    - MeetingService:
        - create (check calendar for event-day suppression)
        - list, detail
        - handle join requests (accept / decline by educator)
        - end meeting
        - soft delete
    - MeetingController:
        POST   /meetings                                -> @Roles(EDUCATOR)
        GET    /meetings?classId=
        GET    /meetings/:id
        POST   /meetings/:id/join-request              -> @Roles(STUDENT)
        PATCH  /meetings/:id/join-request/:studentId   -> @Roles(EDUCATOR)
        PATCH  /meetings/:id/end                       -> @Roles(EDUCATOR)
        DELETE /meetings/:id                           -> @Roles(EDUCATOR)

  On create: emit EVENTS.MEETING_CREATED (notification listener notifies students).
  Do not schedule meeting reminders on Academic Calendar event days —
  check AcademicCalendarService before emitting the reminder.

  ────────────────────────────────────────────────────────────────────────────
  6.6  export
  ────────────────────────────────────────────────────────────────────────────

  Build last — depends on grade, student, class, rubric all being stable.

  PDF per-student class card contains:
    Student info, class info, grade breakdown per rubric category per term,
    term grades (Prelim, Midterm, etc.), final subject grade, remark,
    educator name, org name, school year, semester.

  CSV per-class export contains:
    All students, all category scores per term, term grades, final grade,
    remark, passing status.

  Both Admin and Educators can trigger exports (Admin: any class in org;
  Educator: own classes only).

  ExportController:
    GET /export/class-card/:studentId/:classId  -> @Roles(ADMIN, EDUCATOR)
    GET /export/class-csv/:classId              -> @Roles(ADMIN, EDUCATOR)

  ────────────────────────────────────────────────────────────────────────────
  PHASE 4 COMPLETE CHECKLIST
  ────────────────────────────────────────────────────────────────────────────

    [ ] All notification triggers work end-to-end
    [ ] Audit log receives all expected events
    [ ] Assessment auto-close on end date works
    [ ] Deadline notification scheduler fires correctly
    [ ] Grade auto-lock scheduler fires on deadline
    [ ] Notification archival runs daily and clears 90-day-old records
    [ ] Concept extraction runs in background, educator notified on complete
    [ ] Assessment generation runs in background, educator notified on complete
    [ ] Meeting creation suppresses reminders on calendar event days
    [ ] PDF and CSV exports generate correctly with locked grades


================================================================================
  7. MODULE REFERENCE — ALL 22 MODULES
================================================================================

  Quick lookup. See phases above for build detail.

  Module              Phase  Role Access                   Key Dependency
  ──────────────────  ─────  ──────────────────────────    ──────────────────────────────────
  auth                  1    all roles                      hash.util, token.util
  organization          2    Admin                          orgId from JWT
  level                 2    Admin                          school-year (Phase 3 seeding)
  section               2    Admin                          student (Phase 3 capacity)
  school-year           2    Admin                          level (Phase 3 seeding)
  semester              2    Admin                          date.util (overlap check)
  academic-calendar     2    Admin / Educator / Student     class (Phase 3 session gen)
  educator              2    Admin / Educator               class (Phase 3 removal block)
  student               2    Admin / Student                section (Phase 3 capacity)
  grading-scale         2    Admin                          grade (Phase 3 lock trigger)
  rubric                2    Admin / Educator               enrollment (Phase 3 lock)
  subject               2    Admin / Educator               class (assignment)
  enrollment            3    Admin                          student, class, section, rubric
  class                 3    Admin / Educator               calendar, educator, subject
  lesson                3    Educator                       events (Phase 4 extraction)
  assessment            3    Educator / Student             lesson, rubric, attendance
  attendance            3    Educator                       assessment (auto-mark)
  grade                 3    Educator / Admin / Student     assessment, rubric, grading-scale
  meeting               4    Educator / Student             calendar, events
  notification          2/4  all roles                      events (listeners in Phase 4)
  audit-log             2/4  Admin / Educator               events (listeners in Phase 4)
  export                4    Admin / Educator               grade, student, class, rubric


================================================================================
  8. EVENT CATALOGUE
================================================================================

  All events emitted and who listens. Use EVENTS constants from events.constants.ts.
  Never use raw strings — always reference the constant.

  Event                              Emitted By      Notification   Audit Log
  ────────────────────────────────   ─────────────   ────────────   ─────────
  enrollment.created                 enrollment      educator+stud  admin log
  enrollment.removed                 enrollment      educator       admin log
  assessment.released                assessment      students       -
  assessment.deadline.approaching    scheduler       students       -
  score.published                    assessment      student(s)     activity
  grade.locked                       grade           students+edu   activity
  grade.lock-window.opened           grade           all educators  -
  grade.auto-locked                  scheduler       educator       activity
  class.reassigned                   class           new educator   admin+activity
  meeting.created                    meeting         students       activity
  concept.extraction.requested       lesson          -              activity
  concept.extraction.completed       ai job          educator       activity
  assessment.generation.completed    ai job          educator       activity
  student.status.changed             student         -              admin log
  student.profile.changed            student         -              admin log
  password.reset                     auth            -              admin log
  section.capacity.overflow          section         admin          admin log
  class.capacity.overflow            enrollment      admin          admin log


================================================================================
  9. CODING CONVENTIONS & RULES
================================================================================

  ── REPOSITORY PATTERN ────────────────────────────────────────────────────────

  Controller  ->  Service  ->  Repository  ->  Prisma
  Never skip a layer. Controllers call services only. Services call repositories
  only. Repositories call Prisma only. Nothing else touches the database.

  ── MULTI-TENANT RULE ─────────────────────────────────────────────────────────

  Every repository query on org-scoped data includes WHERE org_id = :orgId.
  orgId always comes from JWT payload via @CurrentUser('orgId').
  Never accept orgId from request body.
  Never use findUnique on a bare ID without org scope.

  Wrong:   db.student.findUnique({ where: { id } })
  Correct: db.student.findFirst({ where: { id, orgId } })

  ── SOFT DELETE ───────────────────────────────────────────────────────────────

  Never hard-delete: classes, assessments, lessons, enrollments, meetings.
  Set deleted_at = now(). All list queries filter WHERE deleted_at IS NULL.
  Historical grades referencing soft-deleted items are preserved for transcripts.

  ── ERROR HANDLING ────────────────────────────────────────────────────────────

  Throw typed HttpExceptions with descriptive messages.
  Map known Prisma errors in the repository layer — never let them bubble raw:

    P2002 (unique violation)  ->  ConflictException
    P2025 (record not found)  ->  NotFoundException

  Unknown errors bubble to AllExceptionFilter which logs and returns 500.

  ── DTO VALIDATION ────────────────────────────────────────────────────────────

  Every endpoint uses a typed DTO with class-validator decorators.
  Global ValidationPipe strips unknown fields and transforms to class instances.
  No raw body parsing anywhere.

  ── TRANSACTIONS ──────────────────────────────────────────────────────────────

  Use db.$transaction([...]) for any multi-step write where partial failure
  would leave data inconsistent. Required for:
    - enrollment (capacity check + insert)
    - bulk student import
    - grade lock (publish all scores + lock in one operation)

  ── EVENTS RULE ───────────────────────────────────────────────────────────────

  If module A's action should trigger a side effect in module B:
    -> A emits an event. B listens. A does not import B.

  If module A needs data from B to complete its own work:
    -> inject B's service into A directly.

  Notification and audit-log modules must not be imported by other modules.
  They are pure listeners — they receive events and write records.

  ── RESPONSE SHAPE ────────────────────────────────────────────────────────────

  All successful responses (via ResponseInterceptor):
    { success: true, statusCode, data, timestamp }

  All error responses (via HttpExceptionFilter):
    { statusCode, error, message, requestId, timestamp, path }

  ── ROLE ENUM ─────────────────────────────────────────────────────────────────

    PLATFORM_OWNER
    ADMIN
    EDUCATOR
    STUDENT

  ── JWT PAYLOAD ───────────────────────────────────────────────────────────────

    sub     string    user ID
    email   string
    role    Role
    orgId   string    null for PLATFORM_OWNER
    iat     number
    exp     number


================================================================================
  10. API ENDPOINT REFERENCE
================================================================================

  Grouped by module. @Public() = no auth. @Roles() = role restriction.
  All others require a valid JWT.

  ── auth ──────────────────────────────────────────────────────────────────────
  POST   /auth/login                          @Public()
  POST   /auth/refresh                        @Public()
  POST   /auth/logout
  GET    /auth/me

  ── organization ──────────────────────────────────────────────────────────────
  POST   /organization                        @Roles(ADMIN)
  GET    /organization                        @Roles(ADMIN)
  PATCH  /organization                        @Roles(ADMIN)

  ── school-year ───────────────────────────────────────────────────────────────
  POST   /school-years                        @Roles(ADMIN)
  GET    /school-years
  PATCH  /school-years/:id/activate           @Roles(ADMIN)
  PATCH  /school-years/:id/end                @Roles(ADMIN)
  PATCH  /school-years/:id                    @Roles(ADMIN)

  ── semester ──────────────────────────────────────────────────────────────────
  POST   /semester-settings                   @Roles(ADMIN)
  GET    /semester-settings
  PATCH  /semester-settings/:id              @Roles(ADMIN)
  DELETE /semester-settings/:id              @Roles(ADMIN)

  ── academic-calendar ─────────────────────────────────────────────────────────
  POST   /academic-calendar                   @Roles(ADMIN)
  GET    /academic-calendar?schoolYearId=
  PATCH  /academic-calendar/:id              @Roles(ADMIN)
  DELETE /academic-calendar/:id              @Roles(ADMIN)

  ── level ─────────────────────────────────────────────────────────────────────
  GET    /levels/defaults
  PATCH  /levels/defaults                     @Roles(ADMIN)
  GET    /levels?schoolYearId=
  PATCH  /levels/:id                          @Roles(ADMIN)

  ── section ───────────────────────────────────────────────────────────────────
  POST   /sections                            @Roles(ADMIN)
  GET    /sections
  PATCH  /sections/:id                        @Roles(ADMIN)
  DELETE /sections/:id                        @Roles(ADMIN)

  ── subject ───────────────────────────────────────────────────────────────────
  POST   /subjects                            @Roles(ADMIN)
  GET    /subjects
  PATCH  /subjects/:id                        @Roles(ADMIN)
  PATCH  /subjects/:id/lock                   @Roles(ADMIN)
  PATCH  /subjects/:id/unlock                 @Roles(ADMIN)

  ── class ─────────────────────────────────────────────────────────────────────
  POST   /classes                             @Roles(ADMIN)
  GET    /classes
  GET    /classes/:id
  PATCH  /classes/:id                         @Roles(ADMIN)
  PATCH  /classes/:id/reassign               @Roles(ADMIN)
  PATCH  /classes/:id/archive                @Roles(ADMIN)

  ── educator ──────────────────────────────────────────────────────────────────
  POST   /educators                           @Roles(ADMIN)
  GET    /educators
  GET    /educators/:id
  PATCH  /educators/:id                       @Roles(ADMIN)
  DELETE /educators/:id                       @Roles(ADMIN)
  POST   /educators/:id/reset-password        @Roles(ADMIN)

  ── student ───────────────────────────────────────────────────────────────────
  POST   /students                            @Roles(ADMIN)
  GET    /students
  GET    /students/:id
  PATCH  /students/:id                        @Roles(ADMIN)
  PATCH  /students/:id/status                 @Roles(ADMIN)
  POST   /students/import                     @Roles(ADMIN)
  POST   /students/:id/reset-password         @Roles(ADMIN)
  GET    /students/credentials-csv            @Roles(ADMIN)

  ── enrollment ────────────────────────────────────────────────────────────────
  POST   /enrollments                         @Roles(ADMIN)
  DELETE /enrollments/:id                     @Roles(ADMIN)
  GET    /enrollments?studentId=
  GET    /enrollments?classId=

  ── lesson ────────────────────────────────────────────────────────────────────
  POST   /lessons                             @Roles(EDUCATOR)
  GET    /lessons?classId=
  PATCH  /lessons/:id                         @Roles(EDUCATOR)
  POST   /lessons/:id/re-extract              @Roles(EDUCATOR)
  DELETE /lessons/:id                         @Roles(EDUCATOR)

  ── assessment ────────────────────────────────────────────────────────────────
  POST   /assessments                         @Roles(EDUCATOR)
  GET    /assessments?classId=
  GET    /assessments/:id
  PATCH  /assessments/:id                     @Roles(EDUCATOR)
  POST   /assessments/:id/publish             @Roles(EDUCATOR)
  POST   /assessments/:id/unpublish           @Roles(EDUCATOR)
  DELETE /assessments/:id                     @Roles(EDUCATOR)
  PATCH  /assessments/:id/students/:studentId/status   @Roles(EDUCATOR)
  POST   /assessments/:id/attempts            @Roles(STUDENT)
  PATCH  /assessments/:id/attempts/:aid       @Roles(STUDENT)
  POST   /assessments/:id/attempts/:aid/submit         @Roles(STUDENT)

  ── attendance ────────────────────────────────────────────────────────────────
  GET    /attendance?classId=
  GET    /attendance/:sessionId
  PATCH  /attendance/:sessionId/students/:studentId   @Roles(EDUCATOR)

  ── grade ─────────────────────────────────────────────────────────────────────
  GET    /grades?classId=&term=
  PATCH  /grades/:studentId/:classId/essay    @Roles(EDUCATOR)
  POST   /grades/lock?classId=                @Roles(EDUCATOR)
  POST   /grades/unlock?classId=              @Roles(ADMIN)
  POST   /grades/lock-window                  @Roles(ADMIN)
  GET    /grades/transcript?studentId=

  ── grading-scale ─────────────────────────────────────────────────────────────
  POST   /grading-scales                      @Roles(ADMIN)
  GET    /grading-scales
  PATCH  /grading-scales/:id                  @Roles(ADMIN)

  ── rubric ────────────────────────────────────────────────────────────────────
  GET    /rubrics/default
  PATCH  /rubrics/default                     @Roles(ADMIN)
  POST   /rubrics                             @Roles(EDUCATOR)
  GET    /rubrics                             @Roles(EDUCATOR)
  PATCH  /rubrics/:id                         @Roles(EDUCATOR)

  ── meeting ───────────────────────────────────────────────────────────────────
  POST   /meetings                            @Roles(EDUCATOR)
  GET    /meetings?classId=
  GET    /meetings/:id
  POST   /meetings/:id/join-request           @Roles(STUDENT)
  PATCH  /meetings/:id/join-request/:sid      @Roles(EDUCATOR)
  PATCH  /meetings/:id/end                    @Roles(EDUCATOR)
  DELETE /meetings/:id                        @Roles(EDUCATOR)

  ── notification ──────────────────────────────────────────────────────────────
  GET    /notifications
  DELETE /notifications/:id

  ── audit-log ─────────────────────────────────────────────────────────────────
  GET    /audit-log                           @Roles(ADMIN)
  GET    /activity-log?classId=               @Roles(EDUCATOR, ADMIN)

  ── export ────────────────────────────────────────────────────────────────────
  GET    /export/class-card/:studentId/:classId   @Roles(ADMIN, EDUCATOR)
  GET    /export/class-csv/:classId               @Roles(ADMIN, EDUCATOR)


================================================================================
  EduTool NestJS Backend Build Guide
================================================================================