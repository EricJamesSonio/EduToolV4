// .eslintrc.cjs
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // 1️⃣ Ignore build and output folders
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      ".vercel/**",
      "dist/**"
    ],
  },

  // 2️⃣ JS / TS source files
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: globals.browser,
    },
    plugins: { js },
    extends: ["js/recommended"],
  },

  // 3️⃣ TypeScript rules
  tseslint.configs.recommended,

  // 4️⃣ React rules
  {
    ...pluginReact.configs.flat.recommended,
    settings: {
      react: {
        version: "detect",
        jsxRuntime: "automatic", // no need to import React in JSX
      },
    },
  },

  // 5️⃣ Optional custom rules
  {
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/explicit-module-boundary-types": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
]);