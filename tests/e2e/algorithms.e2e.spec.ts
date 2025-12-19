import { test, expect } from '@playwright/test';

test.describe('Страница списка алгоритмов', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('должна загружаться и отображать список алгоритмов', async ({ page }) => {
    await expect(page).toHaveURL('/');
  });

  test('должна отображать карточку алгоритма Робертса-Флореса', async ({ page }) => {
    await expect(page.getByText('Алгоритм Робертса-Флореса')).toBeVisible();
  });

  test('должна отображать все алгоритмы', async ({ page }) => {
    await expect(page.getByText('Алгоритм Робертса-Флореса')).toBeVisible();
    await expect(page.getByText('Алгоритм Прима')).toBeVisible();
    await expect(page.getByText('Алгоритм раскраски графа')).toBeVisible();
    await expect(page.getByText('Алгоритм Форда-Беллмана')).toBeVisible();
    await expect(page.getByText('Венгерский алгоритм')).toBeVisible();
    await expect(page.getByText('Алгоритм Брона-Кербоша')).toBeVisible();
  });

  test('должна переходить на страницу алгоритма при клике', async ({ page }) => {
    const robertsFloresLink = page.locator('a[href="/algorithms/roberts-flores"]').first();

    await expect(robertsFloresLink).toBeVisible();
    await robertsFloresLink.click();

    await expect(page).toHaveURL('/algorithms/roberts-flores');
  });

  test('должна иметь адаптивную сетку карточек', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const algorithmLinks = page.locator('a[href^="/algorithms/"]');
    const countDesktop = await algorithmLinks.count();
    expect(countDesktop).toBeGreaterThan(0);
    await expect(algorithmLinks.first()).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    const countMobile = await algorithmLinks.count();
    expect(countMobile).toBeGreaterThan(0);
    await expect(algorithmLinks.first()).toBeVisible();
  });

  test('все карточки алгоритмов должны быть кликабельными', async ({ page }) => {
    const algorithmLinks = page.locator('a[href^="/algorithms/"]');
    const count = await algorithmLinks.count();

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = algorithmLinks.nth(i);
      await expect(link).toHaveAttribute('href', /^\/algorithms\/.+/);
    }
  });

  test('должна отображать правильное количество алгоритмов', async ({ page }) => {
    const algorithmCards = page.locator('a[href^="/algorithms/"]');
    const count = await algorithmCards.count();

    expect(count).toBe(6);
  });
});
