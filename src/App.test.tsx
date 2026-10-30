import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the hero collection', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Колекція героїв — Kragen');
});
