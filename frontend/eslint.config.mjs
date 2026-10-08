import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";

/**
 * TICK-INFRA-018 — timezone-enforcement selectors (shared by the error and
 * warn scopes below; only the severity differs).
 *
 * `new Date()` with no arguments and `new Date(<numeric literal>)` stay
 * allowed everywhere (current instant / epoch math are zone-free), as do
 * `Date.now()`, `getTime()`, and the `getUTC*` family.
 */
const TZ_BANNED = [
  {
    selector:
      'NewExpression[callee.name="Date"][arguments.length>1]',
    message:
      "Multi-argument new Date(y, m, d, …) builds browser-local wall-clock. Use calendarDateToUtc (calendar days) or zonedTimeToUtc from utils/datetime.util.ts.",
  },
  {
    selector:
      'NewExpression[callee.name="Date"][arguments.length=1][arguments.0.type!="Literal"]',
    message:
      "new Date(value) parses in the browser/process zone. Use localInputToIso (datetime-local edge), parseInstant/isoToLocalInput, or calendarDateOf/calendarDateToUtc from utils/datetime.util.ts. Reads of already-true instants need an eslint-disable with an R3 reason instead.",
  },
  {
    selector:
      'NewExpression[callee.name="Date"][arguments.length=1][arguments.0.type="Literal"][arguments.0.raw=/^(\'|")/]',
    message:
      'new Date("…") with a string literal is zone-dependent. Use the utils/datetime.util.ts helpers.',
  },
  {
    selector:
      'CallExpression[callee.object.name="Date"][callee.property.name="parse"]',
    message:
      "Date.parse follows the process zone. Use the utils/datetime.util.ts helpers.",
  },
  {
    selector:
      "CallExpression[callee.property.name=/^(getDate|getDay|getMonth|getFullYear|getHours|getMinutes|getSeconds)$/]",
    message:
      "Browser/process-local date getters shift with the viewer zone (and break SSR hydration). Read instants via getTime()/getUTC*, calendar days via calendarDateOf, weekdays via weekdayInZone (utils/datetime.util.ts). Wall-clock reads of picker-local values need an eslint-disable with a reason.",
  },
  {
    selector:
      "CallExpression[callee.property.name=/^(setDate|setMonth|setFullYear|setHours|setMinutes|setSeconds)$/]",
    message:
      "Browser/process-local date setters shift with the viewer zone. Use addDaysToCalendarDate / zonedTimeToUtc (utils/datetime.util.ts).",
  },
  {
    selector:
      "CallExpression[callee.property.name=/^toLocale(String|DateString|TimeString)$/]",
    message:
      "toLocale*String renders in the viewer zone (SSR hydration mismatch). Use formatInZone with an explicit timeZone from utils/datetime.util.ts.",
  },
  {
    selector:
      'CallExpression[callee.property.name="split"][callee.object.type="CallExpression"][callee.object.callee.property.name="toISOString"]',
    message:
      'toISOString().split("T")[0] slices the UTC day, not the school day. Use calendarDateOf / normalizeDateInput from utils/datetime.util.ts.',
  },
  {
    selector: "CallExpression[callee.name=/^(parseISO|format)$/]",
    message:
      "Bare parseISO/format resolve in the viewer zone. Use localInputToIso, formatInZone, formatCalendarDate (utils/datetime.util.ts) with an explicit zone.",
  },
];

/**
 * TICK-INFRA-018 — files fully migrated to the time layer (TICK-INFRA-017).
 * The selectors above are ERRORS here. To add a file: migrate it first
 * (helpers + specs green under all four TZs), then move its path here from
 * the warn scope. utils/datetime.util.ts implements the conversions (exempt
 * everywhere).
 */
const TZ_ERROR_SCOPE = [
  "src/api/educator/assessment.api.ts",
  "src/app/educator/classes/[classId]/assessments/[assessmentId]/page.tsx",
  "src/app/educator/classes/[classId]/assessments/new/page.tsx",
  "src/app/educator/classes/[classId]/meetings/new/page.tsx",
  "src/components/admin/academic-calendar/BreakEditor.tsx",
  "src/components/admin/academic-calendar/ProgramCalendarCard.tsx",
  "src/components/admin/enrollment-portal/EnrollmentPeriodModal.tsx",
  "src/components/admin/grade-lock/GradeLockSettingModal.tsx",
  "src/components/admin/grade-lock/GradeLockUnlockActionDialog.tsx",
  "src/components/admin/school-years/EditSchoolYearDialog.tsx",
  "src/components/admin/school-years/EventFormDialog.tsx",
  "src/components/admin/semester-settings/assign-row/helpers.ts",
  "src/components/admin/semester/SemesterFormDialog.tsx",
  "src/components/admin/semester/SemesterTermEditor.tsx",
  "src/components/educator/assessment-builder/ManualStep2.tsx",
  "src/components/educator/assessment-builder/Step6.tsx",
  "src/lib/school-year-dates.ts",
  "src/utils/semester.utils.ts",
];

/**
 * Error in migrated files, warn everywhere else (the visible allowlist —
 * shrink it by migrating a file: fix or reason-comment every hit, prove it
 * with the 4-TZ suites, then move its path to TZ_ERROR_SCOPE above).
 * utils/datetime.util.ts implements the conversions (exempt); the kind-C
 * floating schedule files below are exempt by design (HH:mm wall-clock,
 * not instants); specs build explicit fixtures (out of scope here).
 */
const KIND_C_EXEMPT = [
  "src/utils/scheduleTime.utils.ts",
  "src/**/org-schedule-config/**",
  "src/hooks/shared/useScheduleWindow.ts",
];

const tzEnforcementBlocks = [
  {
    files: TZ_ERROR_SCOPE,
    rules: {
      "no-restricted-syntax": ["error", ...TZ_BANNED],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/utils/datetime.util.ts",
      ...KIND_C_EXEMPT,
      ...TZ_ERROR_SCOPE,
      "src/**/*.spec.{ts,tsx}",
      "src/**/*.test.{ts,tsx}",
      "src/**/__tests__/**",
    ],
    rules: {
      "no-restricted-syntax": ["warn", ...TZ_BANNED],
    },
  },
];

export default defineConfig([
  // ============================================================
  // 1. Ignore folders
  // ============================================================
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      ".vercel/**",
      "dist/**",
    ],
  },

  // ============================================================
  // 2. Base JavaScript config
  // ============================================================
  js.configs.recommended,

  // ============================================================
  // 3. TypeScript config
  //    NON type-aware linting
  // ============================================================
  ...tseslint.configs.recommended,

  // ============================================================
  // 4. Global settings for frontend source files
  // ============================================================
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  // ============================================================
  // 5. React
  // ============================================================
  {
    ...pluginReact.configs.flat.recommended,

    settings: {
      react: {
        version: "detect",
      },
    },

    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },

  // ============================================================
  // 6. React Hooks
  // ============================================================
  {
    plugins: {
      "react-hooks": reactHooks,
    },

    rules: {
      // Keep this because incorrect hook usage can cause real bugs
      "react-hooks/rules-of-hooks": "error",

      // Disabled intentionally
      "react-hooks/exhaustive-deps": "off",
    },
  },

  // ============================================================
  // 7. Project-wide rule adjustments
  // ============================================================
  {
    rules: {
      // --------------------------------------------------------
      // Relaxed rules
      // --------------------------------------------------------

      // Explicit `any` is allowed where needed
      "@typescript-eslint/no-explicit-any": "off",

      // Unused variables are not blocking errors
      "@typescript-eslint/no-unused-vars": "off",

      // --------------------------------------------------------
      // Rules intentionally kept strict
      // --------------------------------------------------------

      // Can hide real runtime problems
      "@typescript-eslint/no-non-null-asserted-optional-chain":
        "error",

      // Detect expressions that don't actually do anything
      "@typescript-eslint/no-unused-expressions": "error",

      // Core ESLint rule
      "no-empty": "error",

      // Prefer const when a variable is never reassigned
      "prefer-const": "error",
    },
  },

  // ============================================================
  // 8. Jest configuration
  // ============================================================
  {
    files: ["jest.config.js"],

    languageOptions: {
      globals: globals.node,
    },

    rules: {
      // Jest config uses CommonJS require()
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // ============================================================
  // 9. Timezone enforcement (TICK-INFRA-018, see TZ_ERROR_SCOPE above)
  // ============================================================
  ...tzEnforcementBlocks,
]);