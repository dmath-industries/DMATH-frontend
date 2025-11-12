/**
 * E2E тесты для главной страницы
 */

import { test, expect } from '@playwright/test';

test.describe('Главная страница', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('должна загружаться и отображать основной контент', async ({ page }) => {
    await expect(page.getByRole('heading', { 
      name: /Добро пожаловать в интерактивный учебный инструмент/i 
    })).toBeVisible();
  });

  test('должна отображать список возможностей', async ({ page }) => {
    await expect(page.getByRole('heading', { 
      name: 'Здесь вы можете:' 
    })).toBeVisible();

    await expect(page.getByText('Запускать алгоритмы шаг за шагом')).toBeVisible();
    await expect(page.getByText('Видеть, как они работают — визуально и понятно')).toBeVisible();
    await expect(page.getByText('Анализировать каждый этап решения')).toBeVisible();
  });

  test('должна отображать список тем для изучения', async ({ page }) => {
    await expect(page.getByRole('heading', { 
      name: 'Что можно изучать:' 
    })).toBeVisible();

    await expect(page.getByText('Графы:')).toBeVisible();
    await expect(page.getByText('Транспортные задачи:')).toBeVisible();
    await expect(page.getByText('Нейросети:')).toBeVisible();
  });

  test('должна иметь кнопку перехода к алгоритмам', async ({ page }) => {
    const algorithmLink = page.getByRole('link', { name: 'Перейти к алгоритмам' });
    await expect(algorithmLink).toBeVisible();
    await expect(algorithmLink).toHaveAttribute('href', '/algorithms');
  });

  test('должна переходить на страницу алгоритмов при клике на кнопку', async ({ page }) => {
    await page.getByRole('link', { name: 'Перейти к алгоритмам' }).click();
    
    await expect(page).toHaveURL('/algorithms');
  });

  test('должна иметь адаптивный дизайн', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByRole('heading', { 
      name: /Добро пожаловать/i 
    })).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('heading', { 
      name: /Добро пожаловать/i 
    })).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('heading', { 
      name: /Добро пожаловать/i 
    })).toBeVisible();
  });

  test('должна иметь правильный title', async ({ page }) => {
    await expect(page).toHaveTitle(/DMATH/i);
  });

  test('должна загружать Header компонент', async ({ page }) => {
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();
  });
});
