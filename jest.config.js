const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Берём только юнит-тесты
  testMatch: ['<rootDir>/src/**/__tests__/**/*.[jt]s?(x)'],

  // Покрытие только по src/
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{ts,tsx}',
    '!**/__tests__/**'
  ],
  coverageThreshold: {
    global: { lines: 80, functions: 80, branches: 80, statements: 80 }
  },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }
};

module.exports = createJestConfig(customJestConfig);