import heroesJson from '@/data/heroes.json';

export type Lang = 'ua' | 'en';

export interface PlayerInfo {
  name: string;
  level: number;
  serverId: number;
  dumpDate: string;
}

export interface Artifact {
  level: number;
  star: number;
  artifactType: string;
}

export interface Talisman {
  id: number;
  level: number;
  traitIds: number[];
}

/** The game dumps use either an object keyed by id or a plain array for these. */
type Counts = Record<string, number> | number[];

export interface Hero {
  id: number;
  xp: number;
  level: number;
  color: number;
  slots: number[];
  skills: Record<string, number>;
  power: number;
  star: number;
  runes: number[];
  hero_runes: Counts;
  skins: Counts;
  currentSkin: number;
  titanGiftLevel: number;
  titanCoinsSpent: unknown;
  artifacts: Artifact[];
  baseSkinId: number;
  skinsInfo: unknown[];
  currentSkinRank: number;
  patronLevel: number;
  upgradedSkills: unknown[];
  name: string;
  nameEn: string;
  img?: string;
  talisman?: Talisman;
}

export const HEROES = heroesJson as unknown as Hero[];

// Rank/color legend inferred from the "color" field (hero rarity tier).
export const COLOR_META: Record<number, { name: string; hex: string }> = {
  5: { name: 'Common', hex: '#8a8f98' },
  7: { name: 'Uncommon', hex: '#5fa8d3' },
  8: { name: 'Rare', hex: '#4caf50' },
  9: { name: 'Rare+', hex: '#3ba55c' },
  10: { name: 'Epic', hex: '#9b59b6' },
  13: { name: 'Epic+', hex: '#b06fd6' },
  14: { name: 'Legendary', hex: '#e67e22' },
  15: { name: 'Legendary+', hex: '#e8942b' },
  16: { name: 'Mythic', hex: '#f2c34d' },
};

export function colorMeta(c: number): { name: string; hex: string } {
  return COLOR_META[c] ?? { name: `Rank ${c}`, hex: '#666' };
}

export function stars(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(Math.max(0, 6 - n));
}

export function heroName(h: Hero, lang: Lang): string {
  return (lang === 'ua' ? h.name : h.nameEn) || h.name || `Hero ${h.id}`;
}

export function runeSum(h: Hero): number {
  const values = Array.isArray(h.hero_runes) ? h.hero_runes : Object.values(h.hero_runes ?? {});
  return values.reduce((a, b) => a + (b || 0), 0);
}

export function skinCount(h: Hero): number {
  return Array.isArray(h.skins) ? h.skins.length : Object.keys(h.skins ?? {}).length;
}

export function skillCount(h: Hero): number {
  return Object.keys(h.skills ?? {}).length;
}
