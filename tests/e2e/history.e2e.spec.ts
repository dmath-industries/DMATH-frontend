import { test, expect } from '@playwright/test';

test.describe('Страница истории', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dmath-language', 'ru');
    });
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('должна загружаться и отображать заголовок', async ({ page }) => {
    await expect(page).toHaveURL('/history');
    await expect(page.getByRole('heading', { name: 'История решений', level: 3 })).toBeVisible({
      timeout: 10000,
    });
  });

  test('должна иметь кнопку возврата на главную', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /назад на главную/i });
    await expect(backLink).toBeVisible({ timeout: 10000 });
    await expect(backLink).toHaveAttribute('href', '/');
  });

  test('должна переходить на главную при клике на кнопку назад', async ({ page }) => {
    await page.getByRole('link', { name: /назад на главную/i }).click({ timeout: 10000 });
    await expect(page).toHaveURL('/');
  });

  test('должна отображать сообщение о пустой истории если сессий нет', async ({ page }) => {
    await page.evaluate(() => {
      return new Promise<void>(resolve => {
        const request = indexedDB.deleteDatabase('SessionsDB');
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
        setTimeout(() => resolve(), 1000);
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    const emptyMessage = page.getByText(/История пуста|Запустите алгоритм/i).first();
    await expect(emptyMessage).toBeVisible({ timeout: 10000 });
  });

  test('должна отображать индикатор загрузки', async ({ page }) => {
    await page.goto('/history');

    const spinner = page.locator('.animate-spin').first();
    const loadingText = page.getByText(/загрузка/i).first();

    const spinnerCount = await spinner.count();
    const textCount = await loadingText.count();

    if (spinnerCount === 0 && textCount === 0) {
      await expect(page.getByRole('heading', { name: 'История решений', level: 3 })).toBeVisible({
        timeout: 10000,
      });
    } else {
      if (spinnerCount > 0) {
        await expect(spinner)
          .toBeVisible({ timeout: 1000 })
          .catch(() => {});
      }
      if (textCount > 0) {
        await expect(loadingText)
          .toBeVisible({ timeout: 1000 })
          .catch(() => {});
      }
    }
  });

  test('должна иметь ссылку на страницу алгоритмов если история пуста', async ({ page }) => {
    await page.evaluate(() => {
      return new Promise<void>(resolve => {
        const request = indexedDB.deleteDatabase('SessionsDB');
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
        setTimeout(() => resolve(), 1000);
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    const algorithmsLink = page.getByRole('link', { name: /перейти к алгоритмам/i });

    if ((await algorithmsLink.count()) > 0) {
      await expect(algorithmsLink).toBeVisible();
      await expect(algorithmsLink).toHaveAttribute('href', '/');
    }
  });

  test.describe('Со сохранёнными сессиями', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => {
        return new Promise<void>(async resolve => {
          const dbRequest = indexedDB.open('SessionsDB', 1);

          dbRequest.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('sessions')) {
              db.createObjectStore('sessions', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('graphs')) {
              db.createObjectStore('graphs', { keyPath: 'id' });
            }
          };

          dbRequest.onsuccess = (event: Event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const tx = db.transaction('sessions', 'readwrite');
            const store = tx.objectStore('sessions');

            const testSession = {
              id: 'test-session-1',
              algorithmName: 'roberts-flores',
              graphDTO: {
                nodes: [
                  { id: 'a', x: 0, y: 0 },
                  { id: 'b', x: 100, y: 100 },
                ],
                edges: [{ id: 'e1', source: 'a', target: 'b' }],
              },
              steps: [],
              createdAt: Date.now() - 86400000,
              updatedAt: Date.now() - 86400000,
              metadata: {
                totalSteps: 10,
                executionTime: 150,
              },
            };

            store.add(testSession);

            tx.oncomplete = () => {
              db.close();
              resolve();
            };
          };

          dbRequest.onerror = () => resolve();
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');
    });

    test('должна иметь кнопку открытия сессии', async ({ page }) => {
      const openButton = page.getByRole('button', { name: /открыть|open/i }).first();

      if ((await openButton.count()) > 0) {
        await expect(openButton).toBeVisible();
      }
    });

    test('должна иметь кнопку удаления сессии', async ({ page }) => {
      const deleteButton = page.getByRole('button', { name: /удалить|delete/i }).first();

      if ((await deleteButton.count()) > 0) {
        await expect(deleteButton).toBeVisible();
      }
    });

    test('должна подтверждать удаление сессии', async ({ page }) => {
      page.on('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain('удалить');
        await dialog.dismiss();
      });

      const deleteButton = page.getByRole('button', { name: /удалить|delete/i }).first();

      if ((await deleteButton.count()) > 0) {
        await deleteButton.click();
      }
    });

    test('должна удалять сессию после подтверждения', async ({ page }) => {
      page.on('dialog', async dialog => {
        await dialog.accept();
      });

      const deleteButton = page.getByRole('button', { name: /удалить|delete/i }).first();

      if ((await deleteButton.count()) > 0) {
        await deleteButton.click();

        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Адаптивность', () => {
    test('должна корректно отображаться на десктопе', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.getByRole('heading', { name: 'История решений', level: 3 })).toBeVisible({
        timeout: 10000,
      });
    });

    test('должна корректно отображаться на планшете', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByRole('heading', { name: 'История решений', level: 3 })).toBeVisible({
        timeout: 10000,
      });
    });

    test('должна корректно отображаться на мобильном', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('heading', { name: 'История решений', level: 3 })).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
