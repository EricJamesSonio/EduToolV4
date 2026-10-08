// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * TICK-INFRA-018 — timezone-enforcement selectors (shared by the error and
 * warn scopes below; only the severity differs).
 *
 * `new Date()` with no arguments and `new Date(<numeric literal>)` stay
 * allowed everywhere (current instant / epoch math are zone-free), as do
 * `Date.now()`, `getTime()`, and the `getUTC*`/`setUTC*` family.
 */
const TZ_BANNED = [
  {
    selector:
      'NewExpression[callee.name="Date"][arguments.length>1]',
    message:
      'Multi-argument new Date(y, m, d, …) builds process-local wall-clock. Use calendarDateToUtc (calendar days) or zonedTimeToUtc from commons/utils/datetime.util.ts.',
  },
  {
    selector:
      'NewExpression[callee.name="Date"][arguments.length=1][arguments.0.type!="Literal"]',
    message:
      'new Date(value) parses in the process zone — the production bug. Use parseInstant (instants with Z/offset, rejects zone-less) or calendarDateToUtc/calendarDateOf from commons/utils/datetime.util.ts. Reads of already-true instants need an eslint-disable with an R3 reason instead.',
  },
  {
    selector:
      'NewExpression[callee.name="Date"][arguments.length=1][arguments.0.type="Literal"][arguments.0.raw=/^(\'|")/]',
    message:
      'new Date("…") with a string literal is zone-dependent (date-only parses as UTC, datetimes as process-local). Use calendarDateToUtc / parseInstant from commons/utils/datetime.util.ts.',
  },
  {
    selector: 'CallExpression[callee.object.name="Date"][callee.property.name="parse"]',
    message:
      'Date.parse follows the process zone. Use parseInstant / calendarDateToUtc from commons/utils/datetime.util.ts.',
  },
  {
    selector:
      'CallExpression[callee.property.name=/^(getDate|getDay|getMonth|getFullYear|getHours|getMinutes|getSeconds)$/]',
    message:
      'Process-local date getters shift by the server zone. Read instants via getTime()/getUTC*, calendar days via calendarDateOf, weekdays via weekdayInZone (commons/utils/datetime.util.ts). Wall-clock reads of picker-local values need an eslint-disable with a reason.',
  },
  {
    selector:
      'CallExpression[callee.property.name=/^(setDate|setMonth|setFullYear|setHours|setMinutes|setSeconds)$/]',
    message:
      'Process-local date setters shift by the server zone. Use addDaysToCalendarDate / zonedTimeToUtc / startOfDayInZone / endOfDayInZone from commons/utils/datetime.util.ts.',
  },
  {
    selector:
      'CallExpression[callee.property.name=/^toLocale(String|DateString|TimeString)$/]',
    message:
      'toLocale*String renders in the process/browser zone (SSR hydration mismatch). Use formatInZone with an explicit timeZone from commons/utils/datetime.util.ts.',
  },
  {
    selector:
      'CallExpression[callee.property.name="split"][callee.object.type="CallExpression"][callee.object.callee.property.name="toISOString"]',
    message:
      'toISOString().split("T")[0] slices the UTC day, not the school day. Use calendarDateOf from commons/utils/datetime.util.ts.',
  },
  {
    selector: 'CallExpression[callee.name=/^(parseISO|format)$/]',
    message:
      'Bare parseISO/format resolve in the process zone. Use the datetime.util.ts helpers (parseInstant, formatInZone) with an explicit zone.',
  },
];

/**
 * TICK-INFRA-018 — files fully migrated to the time layer (TICK-INFRA-017).
 * The selectors above are ERRORS here. To add a file: migrate it first
 * (helpers + specs green under all four TZs), then move its path here from
 * the warn scope. The two datetime.util-adjacent implementations are exempt
 * everywhere (they ARE the conversions).
 */
const TZ_ERROR_SCOPE = [
  'src/core/scheduler/scheduler.tasks.ts',
  'src/modules/academic-calendar/academic-calendar.service.ts',
  'src/modules/academic-calendar/data/holidays.data.ts',
  'src/modules/academic-calendar/dto/academic-calendar.dto.ts',
  'src/modules/academic-calendar/dto/program-calendar.dto.ts',
  'src/modules/academic-calendar/program-calendar/program-calendar.service.ts',
  'src/modules/assessment/dto/assessment.dto.ts',
  'src/modules/assessment/educator/assessment-educator.service.ts',
  'src/modules/assessment/educator/helpers/assessment-creation.helper.ts',
  'src/modules/assessment/educator/helpers/assessment-submission.helper.ts',
  'src/modules/attendance/attendance.repository.ts',
  'src/modules/attendance/attendance.service.ts',
  'src/modules/audit-log/audit-log.service.ts',
  'src/modules/enrollment-portal/enrollment-portal.service.ts',
  'src/modules/enrollment-portal/registrar/dto/enrollment-registrar.dto.ts',
  'src/modules/enrollment-portal/registrar/enrollment-auto-lock.service.ts',
  'src/modules/enrollment-portal/registrar/enrollment-registrar.repository.ts',
  'src/modules/enrollment-portal/registrar/enrollment-registrar.service.ts',
  'src/modules/grade-lock/dto/grade-lock.dto.ts',
  'src/modules/grade-lock/grade-lock-auto.service.ts',
  'src/modules/grade-lock/grade-lock-requests.service.ts',
  'src/modules/grade-lock/grade-lock-settings.service.ts',
  'src/modules/lesson/lesson-week-structure.service.ts',
  'src/modules/meeting/dto/meeting.dto.ts',
  'src/modules/meeting/meeting.service.ts',
  'src/modules/org-seeder/dto/org-seed.dto.ts',
  'src/modules/org-seeder/utils/date-calculator.util.ts',
  'src/modules/school-year/dto/school-year.dto.ts',
  'src/modules/school-year/school-year.repository.ts',
  'src/modules/school-year/school-year.service.ts',
  'src/modules/semester-template/dto/semester-template.dto.ts',
  'src/modules/semester-template/semester-template.repository.ts',
  'src/modules/semester-template/semester-template.service.ts',
  'src/modules/semester/dto/semester.dto.ts',
  'src/modules/semester/semester.service.ts',
  'src/seeds/playground-assessment-grading.ts',
];

/**
 * Error in migrated files, warn everywhere else (the visible allowlist —
 * shrink it by migrating a file: fix or reason-comment every hit, prove it
 * with the 4-TZ suites, then move its path to TZ_ERROR_SCOPE above).
 * datetime.util.ts implements the conversions (exempt); the kind-C floating
 * schedule files below are exempt by design (UTC wall-clock, not instants);
 * specs build explicit fixtures (out of scope for the syntax bans).
 */
const KIND_C_EXEMPT = [
  'src/commons/utils/schedule-time.util.ts',
  'src/modules/class/class-schedule.util.ts',
  'src/modules/org-schedule-config/**/*.ts',
  'src/seeds/domain/utils/schedule.util.ts',
];

const tzEnforcementBlocks = [
  {
    files: TZ_ERROR_SCOPE,
    rules: {
      'no-restricted-syntax': ['error', ...TZ_BANNED],
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: [
      'src/commons/utils/datetime.util.ts',
      ...KIND_C_EXEMPT,
      ...TZ_ERROR_SCOPE,
      'src/**/__TEST__/**/*.spec.ts',
      'src/**/__TEST__/**/*.test.ts',
      'src/**/TEST/**/*.spec.ts',
      'src/**/*.spec.ts',
      'src/**/*.test.ts',
    ],
    rules: {
      'no-restricted-syntax': ['warn', ...TZ_BANNED],
    },
  },
];

export default tseslint.config(
  { ignores: ['eslint.config.mjs'] },

  eslint.configs.recommended,
  ...tseslint.configs.recommended, // NOT type-checked
  eslintPluginPrettierRecommended,

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'prettier/prettier': 'off',

      /**
       * Schedule-time rule (UTC wall-clock convention).
       *
       * `ClassSchedule.start_time`/`end_time` are stored UTC and carry a
       * meaningless date component. Reading or stamping them with
       * server-local getters (getHours/setHours/...) shifted every slot by the
       * server's UTC offset - a 07:00 class conflict-checked as 15:00. The
       * ONLY files allowed to touch a Date<->"HH:mm" conversion are the shared
       * schedule-time helper (`commons/utils/schedule-time.util.ts`, which
       * uses getUTC* / setUTC*) and its spec, plus the legacy shim module
       * (`class-schedule.util.ts`) while callers migrate onto the helper.
       *
       * Seeds are intentionally NOT exempt: a local `setHours` in a seeder is
       * exactly how dev-seeded rows ended up shifted from production-written
       * ones (seed util fixed with the convention in the same change).
       */
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.object.type='Identifier'][callee.property.name=/^(getHours|getMinutes|getSeconds|setHours|setMinutes|setSeconds)$/]",
          message:
            'Server-local time getters/setters are forbidden: schedule times are UTC wall-clock. Import from commons/utils/schedule-time.util.ts instead.',
        },
      ],
    },
  },

  // The shared schedule-time helper and its spec, the legacy shim module, and
  // the Category B calendar-date helpers are ALLOWED to use local getters —
  // they are the conversions themselves (or pure calendar math, not schedule
  // wall-clock). Everything else must call the helper. The spec exemption
  // keeps historical `setHours` fixtures compiling while they migrate.
  {
    files: [
      'src/commons/utils/schedule-time.util.ts',
      'src/commons/utils/__TEST__/schedule-time.util.spec.ts',
      'src/modules/class/class-schedule.util.ts',
      // ── Category B (calendar dates, separate PR) ──
      'src/modules/academic-calendar/**/*.ts',
      'src/modules/attendance/**/*.ts',
      'src/modules/lesson/**/*.ts',
      'src/modules/grade-lock/**/*.ts',
      'src/modules/school-year/**/*.ts',
      'src/seeds/domain/utils/school-year-window.util.ts',
      'src/seeds/domain/orchestrator.ts',
      // ── Test fixtures ──
      // Specs build Dates for calendar math and for exercising the helpers
      // themselves; exempting them here does not weaken the guard, which is
      // about production schedule-time reads/writes.
      'src/**/__TEST__/**/*.spec.ts',
      'src/**/__TEST__/**/*.test.ts',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },

  ...tzEnforcementBlocks,
);