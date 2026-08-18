import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";

export default defineConfig([

  // 1️⃣ Ignore folders
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      ".vercel/**",
      "dist/**",
    ],
  },

  // 2️⃣ Base JS config
  js.configs.recommended,

  // 3️⃣ TypeScript (NON type-aware)
  ...tseslint.configs.recommended,

  // 4️⃣ Global settings
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },

  // 5️⃣ React
  {
    ...pluginReact.configs.flat.recommended,
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off", // Next.js
      "react/prop-types": "off", // using TS
    },
  },

  // 6️⃣ React Hooks
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

{
  rules: {
    // Ignore unused variables
    "@typescript-eslint/no-unused-vars": "off",

    // Allow explicit `any`
    "@typescript-eslint/no-explicit-any": "off",

    // Disable React dependency warning
    "react-hooks/exhaustive-deps": "off",

    // Keep this because it can hide a real runtime problem
    "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
  },
}
]);