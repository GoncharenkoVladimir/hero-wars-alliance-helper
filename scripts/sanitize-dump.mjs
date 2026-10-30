// Usage: node scripts/sanitize-dump.mjs [raw=src/data/dame-data.json] [out=src/data/game-data.sanitized.json]
// Keeps only a whitelist of blocks (found by content signature, because `ident` hashes and block order
// differ between dumps), drops credentials and shop data, and pseudonymises user/clan ids.
import fs from 'node:fs';

const [, , rawPath = 'src/data/dame-data.json', outPath = 'src/data/game-data.sanitized.json'] = process.argv;
const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const vals = (o) => Object.values(o);

const SIGNATURES = {
  configIndex: (r) => isObj(r) && isObj(r.index?.configs),
  profile: (r) => isObj(r) && typeof r.name === 'string' && 'accountId' in r && 'serverId' in r,
  inventory: (r) => isObj(r) && 'consumable' in r && 'gear' in r && 'fragmentHero' in r,
  heroes: (r) => isObj(r) && vals(r).length > 0 && vals(r).every((v) => isObj(v) && 'power' in v && 'artifacts' in v && v.id < 4000),
  titans: (r) => isObj(r) && vals(r).length > 0 && vals(r).every((v) => isObj(v) && 'power' in v && v.id >= 4000),
  missions: (r) => Array.isArray(r) && r.length > 0 && r.every((v) => isObj(v) && 'stars' in v && 'triesSpent' in v),
  teams: (r) => isObj(r) && 'arena' in r && 'grand' in r && 'boss_fight' in r,
  arena: (r) => isObj(r) && 'arenaPlace' in r && 'grandPlace' in r,
  clan: (r) => isObj(r) && isObj(r.clanData?.clan),
  expeditions: (r) => isObj(r) && vals(r).length > 0 && vals(r).every((v) => isObj(v) && 'slotId' in v && 'storyId' in v),
};

const pseudo = new Map();
const alias = (prefix, id) => {
  if (id === undefined || id === null) return id;
  const key = `${prefix}:${id}`;
  if (!pseudo.has(key)) pseudo.set(key, `${prefix}${pseudo.size + 1}`);
  return pseudo.get(key);
};

const CLEANERS = {
  profile: (r) => {
    const { offerWallId, ...rest } = r;
    // accountId is only used as a "this is a profile" marker by src/lib/profileImport.ts.
    return { ...rest, id: alias('user', r.id), accountId: 'sanitized', clanId: alias('clan', r.clanId) };
  },
  arena: (r) => ({ ...r, userId: alias('user', r.userId) }),
  clan: (r) => {
    const { clan, membersStat, ...rest } = r.clanData;
    // Other players' nicknames/account ids/blacklists are personal data: members are keyed and named by alias.
    const { members, blackList, warriors, ...clanRest } = clan;
    const cleanMembers = Object.fromEntries(
      Object.values(members).map((m) => {
        const { accountId, ...mRest } = m;
        const id = alias('user', m.id);
        return [id, { ...mRest, id, name: id, clanId: alias('clan', m.clanId) }];
      }),
    );
    return {
      ...r,
      clanData: {
        ...rest,
        clan: { ...clanRest, id: alias('clan', clan.id), ownerId: alias('user', clan.ownerId), members: cleanMembers },
        membersStat: membersStat.map((m) => ({ ...m, userId: alias('user', m.userId) })),
      },
    };
  },
};

const kept = [];
const found = {};
for (const entry of raw.results) {
  const response = entry.result?.response;
  const kind = Object.keys(SIGNATURES).find((k) => SIGNATURES[k](response));
  if (!kind || found[kind]) continue;
  found[kind] = true;
  kept.push({ ident: kind, result: { response: CLEANERS[kind] ? CLEANERS[kind](response) : response } });
}

const missing = Object.keys(SIGNATURES).filter((k) => !found[k]);
if (missing.length) console.warn('WARNING: blocks not found in dump:', missing.join(', '));

fs.writeFileSync(outPath, JSON.stringify({ results: kept, date: raw.date }, null, 1) + '\n');
console.log(`wrote ${outPath}: ${kept.map((k) => k.ident).join(', ')}`);

// Safety net: no secret or credential-like key may survive in the output.
const out = fs.readFileSync(outPath, 'utf8');
const bad = [];
(function walk(n, path) {
  if (Array.isArray(n)) n.forEach((v, i) => walk(v, `${path}[${i}]`));
  else if (isObj(n)) for (const [k, v] of Object.entries(n)) {
    if (/token|session|auth|secret|password|supportLink|offerWall/i.test(k)) bad.push(`${path}.${k}`);
    walk(v, `${path}.${k}`);
  }
})(JSON.parse(out), '$');
const secrets = [];
(function collect(n, k) {
  if (Array.isArray(n)) n.forEach((v) => collect(v, k));
  else if (isObj(n)) for (const [kk, v] of Object.entries(n)) collect(v, kk);
  else if (typeof n === 'string' && /^(sessionId|token|authToken|accountId|offerWallId)$/.test(k) && n.length > 5) secrets.push(n);
})(raw, '');
// Ids and nicknames that must not survive either (own ids, clan id, every member id/name).
(function collectIds(n, k) {
  if (Array.isArray(n)) n.forEach((v) => collectIds(v, k));
  else if (isObj(n)) for (const [kk, v] of Object.entries(n)) {
    if (kk === 'members' && isObj(v)) for (const m of Object.values(v)) { secrets.push(String(m.id), m.name); }
    collectIds(v, kk);
  }
  else if ((k === 'userId' || k === 'ownerId' || k === 'clanId') && String(n).length > 5) secrets.push(String(n));
})(raw, '');
// The user's own nickname is kept on purpose (shown in the app header via the profile block).
const ownName = kept.find((k) => k.ident === 'profile').result.response.name;
const leaked = secrets.filter((s) => s !== ownName && out.includes(s));
if (bad.length || leaked.length) {
  console.error('LEAK DETECTED', { keys: bad, values: leaked.length });
  process.exit(1);
}
console.log(`verified: ${secrets.length} secret values checked, none present in output`);
