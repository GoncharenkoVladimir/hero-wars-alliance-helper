import type { Hero, PlayerInfo } from '@/lib/heroes';

export type RawHero = Omit<Hero, 'name' | 'nameEn' | 'img'>;

export interface RawPlayer {
  name: string;
  level: unknown;
  serverId: unknown;
  accountId: unknown;
}

type Obj = Record<string, unknown>;

const ROOT_KEY = '__root__';

const isPlainObject = (v: unknown): v is Obj =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

function looksLikePlayerInfo(o: Obj): o is Obj & RawPlayer {
  return (
    typeof o.name === 'string' &&
    o.accountId !== undefined &&
    o.serverId !== undefined &&
    o.level !== undefined
  );
}

function looksLikeHeroesDict(o: Obj): o is Record<string, RawHero> {
  const values = Object.values(o);
  return (
    values.length > 0 && values.every((v) => isPlainObject(v) && 'power' in v && 'artifacts' in v)
  );
}

function looksLikeWeaponConfigDict(o: Obj): boolean {
  const values = Object.values(o);
  if (values.length === 0) return false;
  const weapons = values.filter(
    (v) => isPlainObject(v) && v.type === 'weapon' && v.id !== undefined && typeof v.label === 'string',
  );
  return weapons.length >= Math.max(1, values.length * 0.3);
}

interface Candidates {
  players: RawPlayer[];
  heroDicts: Record<string, RawHero>[];
  weaponDicts: Obj[];
}

// Walks the whole uploaded JSON tree collecting every node that matches a known
// shape, since dumps nest the payload under varying levels of
// {results:[{ident, result:{response: ...}}]}.
function collectCandidates(node: unknown, parentKey: string, out: Candidates): void {
  if (Array.isArray(node)) {
    node.forEach((item) => collectCandidates(item, parentKey, out));
    return;
  }
  if (!isPlainObject(node)) return;

  const atPayload = parentKey === 'response' || parentKey === ROOT_KEY;
  if (atPayload && looksLikePlayerInfo(node)) out.players.push(node);
  if (atPayload && looksLikeHeroesDict(node)) out.heroDicts.push(node);
  if (looksLikeWeaponConfigDict(node)) out.weaponDicts.push(node);

  Object.entries(node).forEach(([key, value]) => collectCandidates(value, key, out));
}

function collect(json: unknown): Candidates {
  const out: Candidates = { players: [], heroDicts: [], weaponDicts: [] };
  collectCandidates(json, ROOT_KEY, out);
  return out;
}

const largest = <T extends object>(dicts: T[]): T | null =>
  [...dicts].sort((a, b) => Object.keys(b).length - Object.keys(a).length)[0] ?? null;

export function extractFromProfileDump(json: unknown): {
  player: RawPlayer | null;
  heroDict: Record<string, RawHero> | null;
} {
  const { players, heroDicts } = collect(json);
  return { player: players[0] ?? null, heroDict: largest(heroDicts) };
}

export function extractNameMapFromConfig(json: unknown): Record<number, string> | null {
  const dict = largest(collect(json).weaponDicts);
  if (!dict) return null;
  const map: Record<number, string> = {};
  Object.values(dict).forEach((entry) => {
    if (
      isPlainObject(entry) &&
      entry.type === 'weapon' &&
      typeof entry.id === 'number' &&
      typeof entry.label === 'string'
    ) {
      map[entry.id - 1000] = entry.label;
    }
  });
  return map;
}

export function mergeHeroes(
  existing: Hero[],
  heroDict: Record<string, RawHero> | null,
  nameMap: Record<number, string> | null,
): Hero[] {
  const byId = new Map(existing.map((h) => [h.id, h]));
  const ids = heroDict ? Object.keys(heroDict).map(Number) : existing.map((h) => h.id);

  const merged = ids.flatMap((id) => {
    const prev = byId.get(id);
    const raw = heroDict ? heroDict[id] : prev;
    if (!raw) return [];
    const name = nameMap?.[id] || prev?.name || `Hero ${id}`;
    const hero: Hero = { ...raw, id, name, nameEn: prev?.nameEn || name };
    if (prev?.img) hero.img = prev.img;
    return [hero];
  });
  return merged.sort((a, b) => a.id - b.id);
}

export function toPlayerInfo(p: RawPlayer, today: string): PlayerInfo {
  return {
    name: p.name,
    level: Number(p.level),
    serverId: Number(p.serverId),
    dumpDate: today,
  };
}
