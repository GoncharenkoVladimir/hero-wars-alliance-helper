import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '@/test-utils/renderWithRouter';
import { HeroCollection } from './HeroCollection';

beforeAll(() => {
  window.scrollTo = () => {};
});

test('lists every hero without any player stats', () => {
  renderWithRouter(<HeroCollection />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('All heroes');
  expect(screen.getAllByRole('listitem')).toHaveLength(82);
  expect(screen.getByText('82 heroes')).toBeInTheDocument();
  expect(screen.queryByText(/Power/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Level/i)).not.toBeInTheDocument();
});

test('search narrows the list and a card opens the hero page', () => {
  renderWithRouter(<HeroCollection />);
  userEvent.type(screen.getByRole('textbox'), 'Iris');
  const items = screen.getAllByRole('listitem');
  expect(items).toHaveLength(1);
  userEvent.click(within(items[0]).getByRole('link', { name: 'Iris' }));
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Iris');
  expect(screen.getByRole('heading', { name: 'Best counters' })).toBeInTheDocument();
});

test('the list and my heroes link to each other, and list filters survive a hero visit', () => {
  renderWithRouter(<HeroCollection />);
  userEvent.type(screen.getByRole('textbox'), 'Iris');
  userEvent.click(within(screen.getByRole('listitem')).getByRole('link'));
  userEvent.click(screen.getByRole('link', { name: '← Back' }));
  expect(screen.getAllByRole('listitem')).toHaveLength(1);

  userEvent.click(screen.getByRole('link', { name: 'My heroes' }));
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hero Collection — Kragen');
  userEvent.click(screen.getByRole('link', { name: 'All heroes' }));
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('All heroes');
});
