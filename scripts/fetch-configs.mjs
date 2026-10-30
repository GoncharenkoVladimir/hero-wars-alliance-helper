// Usage: node scripts/fetch-configs.mjs [--all] [dump=src/data/game-data.sanitized.json] [outDir=src/data/configs]
// Downloads the configs the app can use (KEEP below) from the dump's config index (public CDN, no auth).
// --all downloads every config in the index (~17 MB, mostly base-building/global-map data we don't use).
// Writes _index.json (index id + per-config hash/url/size) next to the configs; it is not itself a remote config.
// Idempotent: a file is skipped when its content hash (part of the URL) is unchanged.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const all = args.includes('--all');
const [dumpPath = 'src/data/game-data.sanitized.json', outDir = 'src/data/configs'] = args.filter((a) => a !== '--all');

// Keep in sync with the `!src/data/configs/<name>.json` entries in .gitignore and src/data/README.md.
const KEEP = [
  'hero', 'heroFaction', 'heroRole', 'heroClass', 'heroBattleStat',
  'artifact', 'artifactType', 'artifactBattleEffect', 'itemColor',
  'patronSkill', 'squadHeroSkill', 'battleStatHeroClassBonusType',
];
const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
const index = dump.results.map((r) => r.result?.response?.index).find((i) => i?.configs);
if (!index) throw new Error('config index not found in dump');

fs.mkdirSync(outDir, { recursive: true });
const manifestPath = path.join(outDir, '_index.json');
const old = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { configs: {} };

const entries = Object.entries(index.configs).filter(([name]) => all || KEEP.includes(name));
const missing = KEEP.filter((n) => !(n in index.configs));
if (missing.length) console.warn('WARNING: not in index:', missing.join(', '));
const manifest = { indexId: index.id, fetchedFrom: dumpPath, configs: {} };
let downloaded = 0, skipped = 0;

for (let i = 0; i < entries.length; i += 10) {
  await Promise.all(entries.slice(i, i + 10).map(async ([name, { url, preload }]) => {
    const hash = path.basename(url, '.json');
    const file = path.join(outDir, `${name}.json`);
    if (old.configs[name]?.hash === hash && fs.existsSync(file)) {
      manifest.configs[name] = old.configs[name];
      skipped++;
      return;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    const body = await res.text();
    JSON.parse(body); // fail loudly on non-JSON
    fs.writeFileSync(file, body);
    manifest.configs[name] = { hash, url, preload, bytes: Buffer.byteLength(body) };
    downloaded++;
  }));
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1) + '\n');
console.log(`index ${index.id}: downloaded ${downloaded}, unchanged ${skipped}, total ${entries.length}`);
