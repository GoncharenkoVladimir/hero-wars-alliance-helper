import { makeHero } from '@/test-utils/makeHero';
import { HEROES, colorMeta, heroName, runeSum, skillCount, skinCount, stars } from './heroes';

test('ships the 81 heroes extracted from the saved page', () => {
  expect(HEROES).toHaveLength(81);
});

test('stars pads to six', () => {
  expect(stars(4)).toBe('★★★★☆☆');
  expect(stars(6)).toBe('★★★★★★');
});

test('colorMeta knows tiers and falls back for unknown ones', () => {
  expect(colorMeta(16)).toEqual({ name: 'Mythic', hex: '#f2c34d' });
  expect(colorMeta(99)).toEqual({ name: 'Rank 99', hex: '#666' });
});

test('heroName follows the language and falls back to the id', () => {
  const h = makeHero({ id: 7, name: 'Айрис', nameEn: 'Iris' });
  expect(heroName(h, 'ua')).toBe('Айрис');
  expect(heroName(h, 'en')).toBe('Iris');
  expect(heroName(makeHero({ id: 7, name: '', nameEn: '' }), 'en')).toBe('Hero 7');
});

test('rune, skin and skill counters accept arrays and objects', () => {
  expect(runeSum(makeHero({ id: 1, hero_runes: { '1': 10, '2': 5 } }))).toBe(15);
  expect(runeSum(makeHero({ id: 1, hero_runes: [3, 4] }))).toBe(7);
  expect(skinCount(makeHero({ id: 1, skins: { '1': 7, '154': 1 } }))).toBe(2);
  expect(skinCount(makeHero({ id: 1, skins: [1, 2, 3] }))).toBe(3);
  expect(skillCount(makeHero({ id: 1, skills: { '2': 120, '3': 120 } }))).toBe(2);
});
