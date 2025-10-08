import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: 'e2e',
    testMatch: '**/*.e2e.spec.ts',
    testIgnore: ['**/src/**', '**/__tests__/**'],
    use: { baseURL: 'http://localhost:3000', headless: true },
    webServer: { command: 'npm run start', port: 3000, reuseExistingServer: !process.env.CI },
});
