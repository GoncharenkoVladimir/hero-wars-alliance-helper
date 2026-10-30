import { makeHero } from '@/test-utils/makeHero';
import {
  extractFromProfileDump,
  extractNameMapFromConfig,
  mergeHeroes,
  toPlayerInfo,
} from './profileImport';

const player = { name: 'Tester', accountId: '1', serverId: 1175, level: 120 };

// Real dumps wrap the payload in {results:[{ident, result:{response: ...}}]}.
const dump = {
  results: [
    { ident: 'userGetInfo', result: { response: player } },
    {
      ident: 'heroGetAll',
      result: {
        response: {
          '2': makeHero({ id: 2, power: 999 }),
          '5': makeHero({ id: 5, power: 50 }),
        },
      },
    },
  ],
};

const config = {
  result: {
    response: {
      a: { type: 'weapon', id: 1054, label: 'Iris' },
      b: { type: 'weapon', id: 1049, label: 'Julius' },
      c: { type: 'book', id: 5, label: 'Not a weapon' },
    },
  },
};

describe('extractFromProfileDump', () => {
  test('finds the player and the hero dictionary at any depth', () => {
    const { player: p, heroDict } = extractFromProfileDump(dump);
    expect(p?.name).toBe('Tester');
    expect(Object.keys(heroDict ?? {})).toEqual(['2', '5']);
  });

  test('returns nulls for unrelated JSON', () => {
    expect(extractFromProfileDump({ foo: [1, 2, 3] })).toEqual({ player: null, heroDict: null });
  });

  test('picks the largest hero dictionary', () => {
    const small = { response: { '1': makeHero({ id: 1 }) } };
    const { heroDict } = extractFromProfileDump([small, dump]);
    expect(Object.keys(heroDict ?? {})).toEqual(['2', '5']);
  });
});

describe('extractNameMapFromConfig', () => {
  test('maps weapon id - 1000 to its label', () => {
    expect(extractNameMapFromConfig(config)).toEqual({ 54: 'Iris', 49: 'Julius' });
  });

  test('returns null when there is no weapon config', () => {
    expect(extractNameMapFromConfig({ foo: 1 })).toBeNull();
  });
});

describe('mergeHeroes', () => {
  const base = [
    makeHero({ id: 1, name: 'Аврора', nameEn: 'Aurora', img: 'u1', power: 10 }),
    makeHero({ id: 2, name: 'Айрис', nameEn: 'Iris', img: 'u2', power: 20 }),
  ];

  test('without uploads returns the existing heroes sorted by id', () => {
    expect(mergeHeroes([base[1], base[0]], null, null)).toEqual(base);
  });

  test('a profile replaces the roster but keeps names and images of known heroes', () => {
    const { heroDict } = extractFromProfileDump(dump);
    const merged = mergeHeroes(base, heroDict, null);
    expect(merged.map((h) => h.id)).toEqual([2, 5]);
    expect(merged[0]).toMatchObject({ power: 999, name: 'Айрис', nameEn: 'Iris', img: 'u2' });
  });

  test('heroes unknown to the base get a generated name and no image', () => {
    const { heroDict } = extractFromProfileDump(dump);
    const fresh = mergeHeroes(base, heroDict, null)[1];
    expect(fresh).toMatchObject({ id: 5, name: 'Hero 5', nameEn: 'Hero 5' });
    expect(fresh.img).toBeUndefined();
  });

  test('a name map overrides name but keeps the English name', () => {
    const merged = mergeHeroes(base, null, { 1: 'Aurora X' });
    expect(merged[0]).toMatchObject({ name: 'Aurora X', nameEn: 'Aurora', img: 'u1' });
    expect(merged[1].name).toBe('Айрис');
  });
});

test('toPlayerInfo coerces numbers and stamps the date', () => {
  expect(toPlayerInfo({ ...player, level: '120', serverId: '1175' }, '2026-10-28')).toEqual({
    name: 'Tester',
    level: 120,
    serverId: 1175,
    dumpDate: '2026-10-28',
  });
});
