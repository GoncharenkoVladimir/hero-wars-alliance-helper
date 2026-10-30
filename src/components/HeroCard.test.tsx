import { render, screen } from '@testing-library/react';
import { makeHero } from '@/test-utils/makeHero';
import { DICT } from '@/lib/i18n';
import { HeroCard } from './HeroCard';

const hero = makeHero({
  id: 54,
  name: 'Айрис',
  nameEn: 'Iris',
  color: 16,
  star: 6,
  power: 178699,
  level: 120,
  xp: 2948945,
  skills: { '2': 120, '3': 120 },
  hero_runes: { '1': 10, '2': 5 },
  skins: { '1': 7 },
  titanGiftLevel: 30,
  artifacts: [{ artifactType: 'weapon', level: 100, star: 5 }],
  talisman: { id: 110, level: 50, traitIds: [1, 2, 3, 4] },
});

test('shows the English name, rank, power and stats', () => {
  render(<HeroCard hero={hero} dict={DICT.en} lang="en" />);
  expect(screen.getByText('Iris')).toBeInTheDocument();
  expect(screen.getByText('#54')).toBeInTheDocument();
  expect(screen.getByText('Mythic')).toBeInTheDocument();
  expect(screen.getByText('178,699')).toBeInTheDocument();
  expect(screen.getByText('2,948,945')).toBeInTheDocument();
  expect(screen.getByText('15')).toBeInTheDocument(); // hero runes sum
  expect(screen.getByText('★★★★★★')).toBeInTheDocument();
});

test('lists artifacts and the talisman', () => {
  render(<HeroCard hero={hero} dict={DICT.en} lang="en" />);
  expect(screen.getByText('Weapon')).toBeInTheDocument();
  expect(screen.getByText('Lv100 ★5')).toBeInTheDocument();
  expect(screen.getByText(/Talisman #110 · lvl\. 50 · 4 traits/)).toBeInTheDocument();
});

test('uses the Ukrainian name and labels in ua', () => {
  render(<HeroCard hero={hero} dict={DICT.ua} lang="ua" />);
  expect(screen.getByText('Айрис')).toBeInTheDocument();
  expect(screen.getByText('Зброя')).toBeInTheDocument();
});

test('falls back to an initial when the hero has no image', () => {
  render(<HeroCard hero={hero} dict={DICT.en} lang="en" />);
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getByText('I')).toBeInTheDocument();
});

test('renders the image when present', () => {
  render(<HeroCard hero={{ ...hero, img: 'https://example.test/a.webp' }} dict={DICT.en} lang="en" />);
  expect(screen.getByRole('img', { name: 'Iris' })).toHaveAttribute('src', 'https://example.test/a.webp');
});
