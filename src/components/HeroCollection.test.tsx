import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeHero } from '@/test-utils/makeHero';
import { HeroCollection } from './HeroCollection';

test('renders every hero, sorted by power', () => {
  render(<HeroCollection />);
  expect(screen.getAllByRole('article')).toHaveLength(82);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Колекція героїв — Kragen');
});

test('search narrows the grid by name and by id', () => {
  render(<HeroCollection />);
  const search = screen.getByRole('textbox');

  userEvent.type(search, 'Айрис');
  expect(screen.getAllByRole('article')).toHaveLength(1);

  userEvent.clear(search);
  userEvent.type(search, '54');
  expect(screen.getAllByRole('article')).toHaveLength(1);
  expect(screen.getByText('#54')).toBeInTheDocument();
});

test('shows a message when nothing matches', () => {
  render(<HeroCollection />);
  userEvent.type(screen.getByRole('textbox'), 'zzzzzz');
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
  expect(screen.getByText('Героїв не знайдено за заданими фільтрами.')).toBeInTheDocument();
});

test('the faction filter narrows the grid', async () => {
  // jsdom lacks these pointer APIs, which Radix Select calls when opening.
  Object.assign(Element.prototype, {
    hasPointerCapture: () => false,
    releasePointerCapture: () => {},
    scrollIntoView: () => {},
  });
  render(<HeroCollection />);
  userEvent.click(screen.getByRole('combobox', { name: 'Фракція' }));
  userEvent.click(await screen.findByRole('option', { name: 'Нежить' }));
  // undead (factionId 1) in configs/hero.json: 3, 6, 10, 16, 41, 54, 60, 65, 71, 73, 501, 502
  expect(screen.getAllByRole('article')).toHaveLength(12);
});

test('the language switch retranslates the screen', () => {
  render(<HeroCollection />);
  userEvent.click(screen.getByRole('button', { name: 'EN' }));
  expect(screen.getByPlaceholderText(/Name or ID/)).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hero Collection — Kragen');
  expect(document.documentElement.lang).toBe('en');
});

test('uploading a profile dump replaces the roster and the player', async () => {
  render(<HeroCollection />);
  const dump = {
    results: [
      {
        ident: 'userGetInfo',
        result: { response: { name: 'Tester', accountId: '1', serverId: 1175, level: 99 } },
      },
      { ident: 'heroGetAll', result: { response: { '54': makeHero({ id: 54, power: 123 }) } } },
    ],
  };
  const file = new File([JSON.stringify(dump)], 'new.json', { type: 'application/json' });

  userEvent.upload(screen.getByLabelText(/new\.json/), file);

  expect(await screen.findByText('Оновлено: 1 героїв · гравець Tester.')).toBeInTheDocument();
  expect(screen.getAllByRole('article')).toHaveLength(1);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Колекція героїв — Tester');
});

test('uploading something that is not JSON shows an error', async () => {
  render(<HeroCollection />);
  const file = new File(['not json'], 'new.json', { type: 'application/json' });

  userEvent.upload(screen.getByLabelText(/new\.json/), file);

  expect(await screen.findByText('Не вдалося прочитати файл — це не коректний JSON.')).toBeInTheDocument();
  expect(screen.getAllByRole('article')).toHaveLength(82);
});
