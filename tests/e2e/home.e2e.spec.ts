import { test, expect } from '@playwright/test';

test.describe('Главная страница', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dmath-language', 'ru');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('должна загружаться и отображать основной контент', async ({ page }) => {
    await expect(page.getByText('Алгоритм Робертса-Флореса')).toBeVisible({ timeout: 10000 });
  });

  test('должна отображать список возможностей', async ({ page }) => {
    await expect(page.getByText('Алгоритм Робертса-Флореса')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Алгоритм Прима')).toBeVisible();
    await expect(page.getByText('Алгоритм раскраски графа')).toBeVisible();
  });

  test('должна отображать список тем для изучения', async ({ page }) => {
    await expect(page.getByText('Алгоритм Робертса-Флореса')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Алгоритм Форда-Беллмана')).toBeVisible();
    await expect(page.getByText('Венгерский алгоритм')).toBeVisible();
  });

  test('должна иметь кнопку перехода к алгоритмам', async ({ page }) => {
    const algorithmLink = page.locator('a[href="/algorithms/roberts-flores"]').first();
    await expect(algorithmLink).toBeVisible();
  });

  test('должна переходить на страницу алгоритмов при клике на кнопку', async ({ page }) => {
    await page.locator('a[href="/algorithms/roberts-flores"]').first().click();

    await expect(page).toHaveURL('/algorithms/roberts-flores');
  });

  test('должна иметь адаптивный дизайн', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByText('Алгоритм Робертса-Флореса')).toBeVisible({ timeout: 10000 });

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('Алгоритм Робертса-Флореса')).toBeVisible({ timeout: 10000 });

    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('Алгоритм Робертса-Флореса')).toBeVisible({ timeout: 10000 });
  });

  test('должна иметь правильный title', async ({ page }) => {
    await expect(page).toHaveTitle(/DMATH/i);
  });

  test('должна загружать Header компонент', async ({ page }) => {
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();
  });
});
