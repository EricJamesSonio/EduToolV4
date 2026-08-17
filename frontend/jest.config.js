const nextJest = require('next/jest')

// Providing the path to your Next.js app lets next/jest load next.config.js
// and .env files, and handles the SWC transform + CSS/image mocking for you.
const createJestConfig = nextJest({ dir: './' })

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  // Only run Jest component/unit tests here — Playwright's e2e/ directory
  // has its own runner (playwright.config.ts) and must stay excluded.
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/e2e/'],
}

module.exports = createJestConfig(customJestConfig)