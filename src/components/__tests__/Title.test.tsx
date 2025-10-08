import { render, screen } from '@testing-library/react';
import Title from '../Title';

test('renders title text', () => {
  render(<Title text="DMath" />);
  expect(screen.getByRole('heading', { name: 'DMath' })).toBeInTheDocument();
});