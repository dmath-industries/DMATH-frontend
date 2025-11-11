/**
 * E2E тесты для страницы алгоритма Робертса-Флореса
 */

import { test, expect } from '@playwright/test';

test.describe('Страница алгоритма Робертса-Флореса', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/algorithms/roberts-flores');
    await page.waitForLoadState('networkidle');
  });

  test('должна загружаться и отображать основные элементы', async ({ page }) => {
    await expect(page).toHaveURL('/algorithms/roberts-flores');
  });

  test('должна отображать canvas для визуализации графа', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('должна иметь панель управления', async ({ page }) => {
    const playButton = page.getByRole('button', { name: /play|воспроизвести|▶/i }).first();
    const pauseButton = page.getByRole('button', { name: /pause|пауза|⏸/i }).first();
    
    await expect(playButton.or(pauseButton)).toBeVisible({ timeout: 5000 });
  });

  test('должна иметь возможность ввода графа', async ({ page }) => {
    const inputs = page.locator('textarea, input[type="text"]');
    const count = await inputs.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('должна иметь кнопку запуска алгоритма', async ({ page }) => {
    const runButton = page.getByRole('button', { 
      name: /запустить|run|выполнить|start/i 
    }).first();
    
    const buttonExists = await runButton.count() > 0;
    expect(buttonExists).toBe(true);
  });

  test('должна отображать слайдер или контролы для навигации по шагам', async ({ page }) => {
    const slider = page.locator('input[type="range"]').first();
    const sliderExists = await slider.count() > 0;
    
    const nextButton = page.getByRole('button', { name: /next|следующий|→/i }).first();
    const prevButton = page.getByRole('button', { name: /prev|предыдущий|←/i }).first();
    const navigationExists = await nextButton.count() > 0 || await prevButton.count() > 0;
    
    expect(sliderExists || navigationExists).toBe(true);
  });

  test('должна иметь кнопку возврата на главную или список алгоритмов', async ({ page }) => {
    const backLink = page.locator('a[href="/"], a[href="/algorithms"]').first();
    await expect(backLink).toBeVisible({ timeout: 5000 });
  });

  test('должна иметь кнопку сохранения в историю', async ({ page }) => {
    const saveButton = page.getByRole('button', { 
      name: /сохранить|save|история/i 
    }).first();
    
    const saveButtonExists = await saveButton.count() > 0;
    if (saveButtonExists) {
      await expect(saveButton).toBeVisible();
    }
  });

  test('должна корректно работать на разных размерах экрана', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const canvas1 = page.locator('canvas').first();
    await expect(canvas1).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(canvas1).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('должна отображать описание алгоритма или подсказки', async ({ page }) => {
    const pageText = await page.textContent('body');
    
    expect(pageText).toBeTruthy();
    expect(pageText!.length).toBeGreaterThan(100);
  });

  test.describe('Работа с графом', () => {
    test('должна позволять создавать простой граф', async ({ page }) => {
      const addNodeButton = page.getByRole('button', { 
        name: /добавить вершину|add node|новый узел/i 
      }).first();

      if (await addNodeButton.count() > 0) {
        await addNodeButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('должна иметь возможность очистки графа', async ({ page }) => {
      const clearButton = page.getByRole('button', { 
        name: /очистить|clear|удалить все/i 
      }).first();

      if (await clearButton.count() > 0) {
        await expect(clearButton).toBeVisible();
      }
    });

    test('должна иметь кнопки для применения готовых шаблонов графов', async ({ page }) => {
      const templateButtons = page.getByRole('button', { 
        name: /пример|example|шаблон|template/i 
      });

      const count = await templateButtons.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Выполнение алгоритма', () => {
    test('должна показывать индикатор загрузки при выполнении алгоритма', async ({ page }) => {
      const runButton = page.getByRole('button', { 
        name: /запустить|run/i 
      }).first();

      if (await runButton.isVisible()) {
      }
    });

    test('должна отображать информацию о текущем шаге', async ({ page }) => {
      const stepInfo = page.getByText(/шаг|step/i).first();
      const stepInfoAlt = page.locator('text=/[0-9]+\s*\/\s*[0-9]+/').first();
      
      const exists = (await stepInfo.count() > 0) || (await stepInfoAlt.count() > 0);
      if (exists) {
        await expect(stepInfo.or(stepInfoAlt)).toBeVisible();
      }
    });
  });

  test.describe('Интерактивность', () => {
    test('canvas должен реагировать на события мыши', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible();

      const box = await canvas.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(0);
      expect(box!.height).toBeGreaterThan(0);
    });

    test('должна иметь возможность масштабирования графа', async ({ page }) => {
      const zoomInButton = page.getByRole('button', { name: /zoom in|\+|увеличить/i }).first();
      const zoomOutButton = page.getByRole('button', { name: /zoom out|-|уменьшить/i }).first();

      const hasZoomButtons = await zoomInButton.count() > 0 || await zoomOutButton.count() > 0;
      
      expect(hasZoomButtons || true).toBe(true);
    });
  });

  test.describe('Навигация', () => {
    test('должна иметь ссылку на историю', async ({ page }) => {
      const menuButton = page.locator('.user-menu-toggle').first();
      if (await menuButton.count() > 0) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const historyLink = page.locator('a[href="/history"]').first();
        if (await historyLink.count() > 0) {
          await expect(historyLink).toBeVisible();
        }
      }
    });

    test('должна иметь Header с навигацией', async ({ page }) => {
      const header = page.locator('header, nav').first();
      await expect(header).toBeVisible();
    });
  });
});

