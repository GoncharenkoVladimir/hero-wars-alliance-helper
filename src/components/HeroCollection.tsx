import { useEffect, useMemo, useState } from 'react';
import { INITIAL_PLAYER } from '@/data/player';
import { ALL, computeStats, filterHeroes, sortHeroes, type SortKey } from '@/lib/heroFilters';
import { HEROES, type Lang, type PlayerInfo } from '@/lib/heroes';
import { DICT } from '@/lib/i18n';
import {
  extractFromProfileDump,
  extractNameMapFromConfig,
  mergeHeroes,
  toPlayerInfo,
  type RawHero,
} from '@/lib/profileImport';
import { readJsonFile } from '@/lib/readJsonFile';
import { Controls } from './Controls';
import { HeroCard } from './HeroCard';
import { LangSwitch } from './LangSwitch';
import { StatsBar } from './StatsBar';
import { UploadPanel, type UploadStatus } from './UploadPanel';

interface Uploads {
  heroDict: Record<string, RawHero> | null;
  nameMap: Record<number, string> | null;
  player: PlayerInfo | null;
}

export function HeroCollection() {
  const [lang, setLang] = useState<Lang>('ua');
  const [search, setSearch] = useState('');
  const [color, setColor] = useState(ALL);
  const [star, setStar] = useState(ALL);
  const [sortBy, setSortBy] = useState<SortKey>('power_desc');
  const [uploads, setUploads] = useState<Uploads>({ heroDict: null, nameMap: null, player: null });
  const [status, setStatus] = useState<UploadStatus | null>(null);

  const dict = DICT[lang];
  const player = uploads.player ?? INITIAL_PLAYER;

  const heroes = useMemo(
    () => mergeHeroes(HEROES, uploads.heroDict, uploads.nameMap),
    [uploads.heroDict, uploads.nameMap],
  );
  const visible = useMemo(
    () => sortHeroes(filterHeroes(heroes, { search, color, star }, lang), sortBy, lang),
    [heroes, search, color, star, sortBy, lang],
  );
  const stats = useMemo(() => computeStats(heroes), [heroes]);
  const colors = useMemo(() => [...new Set(heroes.map((h) => h.color))].sort((a, b) => a - b), [heroes]);
  const starOptions = useMemo(
    () => [...new Set(heroes.map((h) => h.star))].sort((a, b) => b - a),
    [heroes],
  );

  useEffect(() => {
    document.documentElement.lang = dict.htmlLang;
    document.title = dict.title(player);
  }, [dict, player]);

  async function importProfile(file: File) {
    try {
      const { player: rawPlayer, heroDict } = extractFromProfileDump(await readJsonFile(file));
      if (!heroDict) {
        setStatus({ kind: 'err', text: dict.uploadNoHeroes });
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      const nextPlayer = rawPlayer ? toPlayerInfo(rawPlayer, today) : null;
      setUploads((prev) => ({ ...prev, heroDict, player: nextPlayer ?? prev.player }));
      setStatus({
        kind: 'ok',
        text: dict.uploadOk(Object.keys(heroDict).length, (nextPlayer ?? uploads.player)?.name ?? ''),
      });
    } catch {
      setStatus({ kind: 'err', text: dict.uploadBadJson });
    }
  }

  async function importConfig(file: File) {
    try {
      const nameMap = extractNameMapFromConfig(await readJsonFile(file));
      if (!nameMap) {
        setStatus({ kind: 'err', text: dict.uploadBadJson });
        return;
      }
      setUploads((prev) => ({ ...prev, nameMap }));
      const count = mergeHeroes(HEROES, uploads.heroDict, nameMap).length;
      setStatus({ kind: 'ok', text: dict.uploadOk(count, uploads.player?.name ?? '') });
    } catch {
      setStatus({ kind: 'err', text: dict.uploadBadJson });
    }
  }

  return (
    <div className="min-h-screen bg-hw-bg font-sans text-hw-text">
      <header className="border-b border-hw-border bg-linear-to-br from-[#1d2130] to-[#14161c] px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-1.5 text-2xl font-semibold">⚔ {dict.title(player)}</h1>
            <p className="text-sm text-hw-dim">{dict.subtitle(player)}</p>
          </div>
          <LangSwitch lang={lang} onChange={setLang} />
        </div>
        <StatsBar stats={stats} dict={dict} lang={lang} />
      </header>
      <Controls
        dict={dict}
        search={search}
        onSearch={setSearch}
        color={color}
        onColor={setColor}
        colors={colors}
        star={star}
        onStar={setStar}
        starOptions={starOptions}
        sortBy={sortBy}
        onSort={setSortBy}
      />
      <UploadPanel dict={dict} status={status} onProfile={importProfile} onConfig={importConfig} />
      <main className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5 px-8 py-6">
        {visible.length === 0 ? (
          <p className="col-span-full p-10 text-center text-hw-dim">{dict.emptyMsg}</p>
        ) : (
          visible.map((hero) => <HeroCard key={hero.id} hero={hero} dict={dict} lang={lang} />)
        )}
      </main>
    </div>
  );
}
