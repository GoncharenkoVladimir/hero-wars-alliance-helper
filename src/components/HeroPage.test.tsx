import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '@/test-utils/renderWithRouter';
import { HeroCollection } from './HeroCollection';

beforeAll(() => {
  window.scrollTo = () => {};
});

test('the card links to the hero page, which lists the counters', () => {
  renderWithRouter(<HeroCollection />);
  const card = screen.getAllByRole('article').find((a) => within(a).queryByText('#58'))!;
  expect(within(card).getByRole('link')).toHaveAttribute('href', '/hero/58');

  userEvent.click(within(card).getByRole('link'));
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Aidan');
  expect(screen.getByRole('heading', { name: 'Best counters' })).toBeInTheDocument();
  expect(screen.getByText(/blocks Aidan's ability to resurrect Kayla/)).toBeInTheDocument();
});

test('Back returns to the collection with its filters intact', () => {
  renderWithRouter(<HeroCollection />);
  userEvent.type(screen.getByRole('textbox'), 'Iris');
  userEvent.click(within(screen.getByRole('article')).getByRole('link'));
  userEvent.click(screen.getByRole('link', { name: '← Back to collection' }));
  expect(screen.getAllByRole('article')).toHaveLength(1);
});

test('combos are shown joined and unresolved names as plain text', () => {
  renderWithRouter(<HeroCollection />, '/hero/503'); // Alvanor: ... Xesha + Lilith
  expect(screen.getByRole('link', { name: /Xe'Sha/ })).toBeInTheDocument();
});

test('names without an id are plain text', () => {
  renderWithRouter(<HeroCollection />, '/hero/60'); // Octavia: "AoE heroes"
  expect(screen.getByText('AoE heroes')).toBeInTheDocument();
});

test('heroes without guide or counter data show empty states; unknown ids are not found', () => {
  const { unmount } = renderWithRouter(<HeroCollection />, '/hero/76'); // Crow: not in hero-counters.json
  expect(screen.getByText('There is no counter data for this hero.')).toBeInTheDocument();
  expect(screen.getByText('There is no detailed counter guide for this hero.')).toBeInTheDocument();
  unmount();
  renderWithRouter(<HeroCollection />, '/hero/9999');
  expect(screen.getByText('Hero not found.')).toBeInTheDocument();
});
