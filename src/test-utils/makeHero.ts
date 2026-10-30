import type { Hero } from '@/lib/heroes';

export function makeHero(o: Partial<Hero> & { id: number }): Hero {
  return {
    xp: 0,
    level: 1,
    color: 7,
    slots: [0, 0, 0, 0],
    skills: {},
    power: 0,
    star: 1,
    runes: [0, 0, 0, 0, 0],
    hero_runes: {},
    skins: {},
    currentSkin: 1,
    titanGiftLevel: 0,
    titanCoinsSpent: {},
    artifacts: [],
    baseSkinId: 1,
    skinsInfo: [],
    currentSkinRank: 0,
    patronLevel: 0,
    upgradedSkills: [],
    name: `Hero ${o.id}`,
    nameEn: `Hero ${o.id}`,
    ...o,
  };
}
