import type { Config } from 'jest';

const tsTransformReact = [
  'ts-jest',
  {
    tsconfig: 'tsconfig.json',
    babelConfig: { presets: [['@babel/preset-react', { runtime: 'automatic' }]] },
  },
] as const;

const collectCoverageFrom = [
  'src/**/*.{ts,tsx}',
  '!src/**/__tests__/**',
  '!src/**/examples/**',
];

const config: Config = {
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/**/*.node.test.ts'],
      collectCoverageFrom,
      transform: { '^.+\\.tsx?$': tsTransformReact },
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      testMatch: ['<rootDir>/src/**/*.browser.test.ts?(x)'],
      collectCoverageFrom,
      transform: { '^.+\\.tsx?$': tsTransformReact },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      testPathIgnorePatterns: ['\\.node\\.test\\.ts$'],
    },
  ],
};

export default config;