import { makeHero } from '@/test-utils/makeHero';
import { ALL, computeStats, filterHeroes, sortHeroes, type Filters } from './heroFilters';
import { DICT, formatNumber } from './i18n';

const aurora = makeHero({ id: 1, name: 'Аврора', nameEn: 'Aurora', power: 100, star: 2, color: 7 });
const iris = makeHero({ id: 2, name: 'Айрис', nameEn: 'Iris', power: 300, star: 6, color: 16 });
const keira = makeHero({ id: 3, name: 'Кіра', nameEn: 'Keira', power: 200, star: 6, color: 14 });
const heroes = [aurora, iris, keira];

const none: Filters = { search: '', color: ALL, star: ALL };
const ids = (hs: { id: number }[]) => hs.map((h) => h.id);

describe('filterHeroes', () => {
  test('no filters keeps everyone', () => {
    expect(ids(filterHeroes(heroes, none, 'en'))).toEqual([1, 2, 3]);
  });

  test('search matches the name case-insensitively', () => {
    expect(ids(filterHeroes(heroes, { ...none, search: ' iri ' }, 'en'))).toEqual([2]);
  });

  test('search matches an exact id but not a partial one', () => {
    expect(ids(filterHeroes(heroes, { ...none, search: '3' }, 'en'))).toEqual([3]);
    // id 12 must not match '1': ids match exactly, never partially.
    const withTwelve = [...heroes, makeHero({ id: 12, name: 'Zed', nameEn: 'Zed' })];
    expect(ids(filterHeroes(withTwelve, { ...none, search: '1' }, 'en'))).toEqual([1]);
  });

  test('search uses the name of the current language', () => {
    expect(ids(filterHeroes(heroes, { ...none, search: 'аврора' }, 'ua'))).toEqual([1]);
    expect(ids(filterHeroes(heroes, { ...none, search: 'аврора' }, 'en'))).toEqual([]);
  });

  test('color and star filters combine', () => {
    expect(ids(filterHeroes(heroes, { ...none, color: '16' }, 'en'))).toEqual([2]);
    expect(ids(filterHeroes(heroes, { ...none, star: '6' }, 'en'))).toEqual([2, 3]);
    expect(ids(filterHeroes(heroes, { ...none, star: '6', color: '14' }, 'en'))).toEqual([3]);
  });
});

describe('sortHeroes', () => {
  test.each([
    ['power_desc', [2, 3, 1]],
    ['power_asc', [1, 3, 2]],
    ['star_desc', [2, 3, 1]],
    ['id_asc', [1, 2, 3]],
    ['name_asc', [1, 2, 3]],
  ] as const)('%s', (key, expected) => {
    expect(ids(sortHeroes([keira, aurora, iris], key, 'en'))).toEqual(expected);
  });

  test('does not mutate the input', () => {
    const input = [keira, aurora, iris];
    sortHeroes(input, 'id_asc', 'en');
    expect(ids(input)).toEqual([3, 1, 2]);
  });
});

describe('computeStats', () => {
  test('summarises the collection', () => {
    expect(computeStats(heroes)).toEqual({
      total: 3,
      totalPower: 600,
      strongest: { id: 2, power: 300 },
      maxStar: 6,
      mythicCount: 1,
    });
  });

  test('survives an empty collection', () => {
    expect(computeStats([])).toEqual({
      total: 0,
      totalPower: 0,
      strongest: null,
      maxStar: 0,
      mythicCount: 0,
    });
  });
});

describe('i18n', () => {
  test('formatNumber uses the language locale', () => {
    expect(formatNumber(1234567, 'en')).toBe('1,234,567');
  });

  test('title and subtitle include the player', () => {
    const p = { name: 'Kragen', level: 120, serverId: 1247, dumpDate: '2026-09-25' };
    expect(DICT.en.title(p)).toBe('Hero Collection — Kragen');
    expect(DICT.ua.title(p)).toBe('Колекція героїв — Kragen');
    expect(DICT.en.subtitle(p)).toContain('server 1247');
  });
});
