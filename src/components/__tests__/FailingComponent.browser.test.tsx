import { render, screen } from '@testing-library/react';
import Title from '../Title';

test('failing test for G3.4 demonstration', () => {
  render(<Title text="Test" />);
  expect(screen.getByRole('heading', { name: 'Wrong Text' })).toBeInTheDocument();
});

test('another failing test', () => {
  const result = 2 + 2;
  expect(result).toBe(5);
});

test('test with wrong selector', () => {
  render(<Title text="DMath" />);
  expect(screen.getByText('NonExistentText')).toBeInTheDocument();
});
