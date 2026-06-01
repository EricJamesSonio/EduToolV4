const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: '<rootDir>/',
    }),

    // 🔥 ADD THIS LINE (this is your missing piece)
    '^src/(.*)$': '<rootDir>/src/$1',
  },

  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },

  extensionsToTreatAsEsm: ['.ts'],
};