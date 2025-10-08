import { test, expect } from '@playwright/test';

test('главная страница открывается и отображает базовый контент', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Get started by editing')).toBeVisible();
  await expect(page.getByText('Deploy now')).toBeVisible();
});