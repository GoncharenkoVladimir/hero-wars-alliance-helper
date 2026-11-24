// Usage: node scripts/sync-heroes.mjs [dump=src/data/game-data.sanitized.json] [heroesJson=src/data/heroes.json] [heroConfig=src/data/configs/hero.json]
// Rebuilds heroes.json from the sanitized dump (run sanitize-dump.mjs and fetch-configs.mjs first).
// - Heroes in the dump take their game state from the dump; name/nameEn/img are kept from the existing heroes.json
//   (mirrors `mergeHeroes` in src/lib/profileImport.ts).
// - Heroes that exist in configs/hero.json but not in the dump (the player does not own them yet) are added as
//   zero-state stubs, so new heroes show up in the roster as soon as the client config has them.
// - Heroes only present in the old heroes.json are kept untouched.
import fs from 'node:fs';

const [
  dumpPath = 'src/data/game-data.sanitized.json',
  heroesPath = 'src/data/heroes.json',
  configPath = 'src/data/configs/hero.json',
] = process.argv.slice(2);

// The configs only carry Russian labels; English names for heroes that have no existing entry go here.
const NAMES_EN = { 66: 'Ninja Turtles' };

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
// Same signature as the `heroes` block in sanitize-dump.mjs (idents are not stable between dumps).
const isHeroesBlock = (r) =>
  isObj(r) && Object.values(r).length > 0 &&
  Object.values(r).every((v) => isObj(v) && 'power' in v && 'artifacts' in v && v.id < 4000);

const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
const dumpHeroes = dump.results.map((r) => r.result?.response).find(isHeroesBlock);
if (!dumpHeroes) throw new Error(`heroes block not found in ${dumpPath}`);

const existing = JSON.parse(fs.readFileSync(heroesPath, 'utf8'));
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const prevById = new Map(existing.map((h) => [h.id, h]));

const stub = (id, label) => ({
  id, xp: 0, level: 0, color: 1, slots: [0, 0, 0, 0], skills: {}, power: 0, star: 0,
  runes: [0, 0, 0, 0, 0], hero_runes: [], skins: {}, currentSkin: 0, titanGiftLevel: 0,
  titanCoinsSpent: {}, artifacts: [], baseSkinId: 0, skinsInfo: [], currentSkinRank: 0,
  patronLevel: 0, upgradedSkills: [], name: label, nameEn: NAMES_EN[id] ?? label,
});

const merged = new Map();
const added = [];
const stubbed = [];

for (const [key, raw] of Object.entries(dumpHeroes)) {
  const id = Number(key);
  const prev = prevById.get(id);
  const name = prev?.name || config[id]?.label || `Hero ${id}`;
  const hero = { ...raw, id, name, nameEn: prev?.nameEn || NAMES_EN[id] || name };
  if (prev?.img) hero.img = prev.img;
  // Keep the previous key order so the git diff only shows real changes.
  const order = prev ? Object.keys(prev) : [];
  const keys = [...order.filter((k) => k in hero), ...Object.keys(hero).filter((k) => !order.includes(k))];
  merged.set(id, Object.fromEntries(keys.map((k) => [k, hero[k]])));
  if (!prev) added.push(id);
}

for (const [key, cfg] of Object.entries(config)) {
  const id = Number(key);
  if (merged.has(id)) continue;
  const prev = prevById.get(id);
  if (prev) {
    merged.set(id, prev);
  } else {
    merged.set(id, stub(id, cfg.label));
    stubbed.push(id);
  }
}
for (const prev of existing) if (!merged.has(prev.id)) merged.set(prev.id, prev);

const out = [...merged.values()].sort((a, b) => a.id - b.id);
fs.writeFileSync(heroesPath, JSON.stringify(out, null, 4));
console.log(
  `heroes.json: ${out.length} heroes (${Object.keys(dumpHeroes).length} from dump, ` +
    `added from dump: [${added}], stubs from config: [${stubbed}])`,
);
const noImg = out.filter((h) => !h.img).map((h) => h.id);
if (noImg.length) console.warn(`WARNING: no img for hero ids: ${noImg.join(', ')}`);
