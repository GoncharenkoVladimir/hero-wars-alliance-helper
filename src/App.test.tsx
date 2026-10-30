import { screen } from '@testing-library/react';
import { renderWithRouter } from '@/test-utils/renderWithRouter';
import App from './App';

test('the landing page is the full hero list', () => {
  renderWithRouter(<App />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('All heroes');
});

test('the player collection lives at /my-heroes', () => {
  renderWithRouter(<App />, '/my-heroes');
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hero Collection — Kragen');
});
