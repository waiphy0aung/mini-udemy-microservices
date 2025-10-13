module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.ts',
  ],
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/unit/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/mock.setup.ts'],
      moduleNameMapper: {
        '^@shared$': '<rootDir>/../../shared/src',
        '^@shared/(.*)$': '<rootDir>/../../shared/src/$1',
      },
      transform: {
        '^.+\\.ts$': ['ts-jest'],
      },
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/integration/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/database.setup.ts'],
      moduleNameMapper: {
        '^@shared$': '<rootDir>/../../shared/src',
        '^@shared/(.*)$': '<rootDir>/../../shared/src/$1',
      },
      transform: {
        '^.+\\.ts$': ['ts-jest'],
      },
    },
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!src/server.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 30000,
  maxWorkers: 1, // Run tests serially to avoid DB conflicts
};
