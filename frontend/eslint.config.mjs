import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";

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
]);