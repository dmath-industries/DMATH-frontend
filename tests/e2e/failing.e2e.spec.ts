/**
 * Демонстрационный e2e тест для G3.6 - падающие e2e тесты
 * Этот тест специально написан с ошибками для демонстрации блокировки CI
 */

import { test, expect } from '@playwright/test';

test('failing e2e test for G3.6 demonstration', async ({ page }) => {
  await page.goto('/');
  
  await expect(page.getByText('NonExistentText')).toBeVisible();
  await expect(page.getByText('AnotherNonExistentText')).toBeVisible();
});

test('another failing e2e test', async ({ page }) => {
  await page.goto('/combinatorics');
  
  await expect(page.getByText('ThisTextDoesNotExist')).toBeVisible();
});

test('test with wrong URL', async ({ page }) => {
  await page.goto('/non-existent-page');
  
  await expect(page.getByText('Page Not Found')).toBeVisible();
});
