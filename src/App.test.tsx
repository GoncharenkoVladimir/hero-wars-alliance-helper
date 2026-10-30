import { screen } from '@testing-library/react';
import { renderWithRouter } from '@/test-utils/renderWithRouter';
import App from './App';

test('renders the hero collection', () => {
  renderWithRouter(<App />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hero Collection — Kragen');
});
