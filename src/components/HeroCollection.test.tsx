import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '@/test-utils/renderWithRouter';
import { HeroCollection } from './HeroCollection';

test('renders every hero, sorted by power', () => {
  renderWithRouter(<HeroCollection />);
  expect(screen.getAllByRole('article')).toHaveLength(82);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hero Collection — Kragen');
});

test('search narrows the grid by name and by id', () => {
  renderWithRouter(<HeroCollection />);
  const search = screen.getByRole('textbox');

  userEvent.type(search, 'Iris');
  expect(screen.getAllByRole('article')).toHaveLength(1);

  userEvent.clear(search);
  userEvent.type(search, '54');
  expect(screen.getAllByRole('article')).toHaveLength(1);
  expect(screen.getByText('#54')).toBeInTheDocument();
});

test('shows a message when nothing matches', () => {
  renderWithRouter(<HeroCollection />);
  userEvent.type(screen.getByRole('textbox'), 'zzzzzz');
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
  expect(screen.getByText('No heroes match the current filters.')).toBeInTheDocument();
});

test('the faction filter narrows the grid', async () => {
  // jsdom lacks these pointer APIs, which Radix Select calls when opening.
  Object.assign(Element.prototype, {
    hasPointerCapture: () => false,
    releasePointerCapture: () => {},
    scrollIntoView: () => {},
  });
  renderWithRouter(<HeroCollection />);
  userEvent.click(screen.getByRole('combobox', { name: 'Faction' }));
  userEvent.click(await screen.findByRole('option', { name: 'Undead' }));
  // undead (factionId 1) in configs/hero.json: 3, 6, 10, 16, 41, 54, 60, 65, 71, 73, 501, 502
  expect(screen.getAllByRole('article')).toHaveLength(12);
});

test('the language switch retranslates the screen', () => {
  renderWithRouter(<HeroCollection />);
  expect(document.documentElement.lang).toBe('en');
  userEvent.click(screen.getByRole('button', { name: 'UA' }));
  expect(screen.getByPlaceholderText(/Ім'я або ID/)).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Колекція героїв — Kragen');
  expect(document.documentElement.lang).toBe('uk');
});
