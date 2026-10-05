// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

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
  }
);