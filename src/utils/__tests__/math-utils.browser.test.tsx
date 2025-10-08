/**
 * Тесты для math-utils.ts - специально с низким coverage для G3.5
 * Этот файл покрывает только часть функций, чтобы coverage был < 80%
 */

import { add, subtract } from '../math-utils';


test('add function works', () => {
  expect(add(2, 3)).toBe(5);
});

test('subtract function works', () => {
  expect(subtract(5, 3)).toBe(2);
});
