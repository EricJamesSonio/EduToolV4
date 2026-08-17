const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: '<rootDir>/',
    }),

    '^src/(.*)$': '<rootDir>/src/$1',
  },

  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },

  extensionsToTreatAsEsm: ['.ts'],

  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};