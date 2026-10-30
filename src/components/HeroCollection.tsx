import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Link, Navigate, Route, Routes, useParams } from 'react-router';
import { INITIAL_PLAYER } from '@/data/player';
import {
  ALL,
  computeStats,
  filterHeroes,
  INITIAL_LIST_FILTERS,
  sortHeroes,
  type ListFilters,
  type SortKey,
} from '@/lib/heroFilters';
import { FACTION_IDS, heroFaction, HEROES, type Lang } from '@/lib/heroes';
import { DICT } from '@/lib/i18n';
import { Controls } from './Controls';
import { HeroCard } from './HeroCard';
import { HeroList } from './HeroList';
import { HeroPage } from './HeroPage';
import { LangSwitch } from './LangSwitch';
import { StatsBar } from './StatsBar';

export function HeroCollection() {
  const [lang, setLang] = useState<Lang>('en');
  const [listFilters, setListFilters] = useState<ListFilters>(INITIAL_LIST_FILTERS);
  const [search, setSearch] = useState('');
  const [color, setColor] = useState(ALL);
  const [star, setStar] = useState(ALL);
  const [faction, setFaction] = useState(ALL);
  const [role, setRole] = useState(ALL);
  const [sortBy, setSortBy] = useState<SortKey>('power_desc');

  const dict = DICT[lang];
  const player = INITIAL_PLAYER;

  const heroes = HEROES;
  const visible = useMemo(
    () => sortHeroes(filterHeroes(heroes, { search, color, star, faction, role }, lang), sortBy, lang),
    [heroes, search, color, star, faction, role, sortBy, lang],
  );
  const stats = useMemo(() => computeStats(heroes), [heroes]);
  const colors = useMemo(() => [...new Set(heroes.map((h) => h.color))].sort((a, b) => a - b), [heroes]);
  const starOptions = useMemo(
    () => [...new Set(heroes.map((h) => h.star))].sort((a, b) => b - a),
    [heroes],
  );

  // Only factions present in the current roster, in config order.
  const factionOptions = useMemo(() => {
    const present = new Set(heroes.map((h) => heroFaction(h.id)));
    return FACTION_IDS.filter((id) => present.has(id));
  }, [heroes]);

  useEffect(() => {
    document.documentElement.lang = dict.htmlLang;
    document.title = dict.title(player);
  }, [dict, player]);

  // Filters live in this component, so they survive a visit to a hero page.
  const collection = (
    <div className="min-h-screen bg-hw-bg font-sans text-hw-text">
      <header className="border-b border-hw-border bg-linear-to-br from-[#1d2130] to-[#14161c] px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-1.5 text-2xl font-semibold">⚔ {dict.title(player)}</h1>
            <p className="text-sm text-hw-dim">{dict.subtitle(player)}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm font-semibold text-hw-accent hover:underline">
              {dict.navAllHeroes}
            </Link>
            <LangSwitch lang={lang} onChange={setLang} />
          </div>
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
        faction={faction}
        onFaction={setFaction}
        factionOptions={factionOptions}
        role={role}
        onRole={setRole}
        sortBy={sortBy}
        onSort={setSortBy}
      />
      <main className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5 px-8 py-6">
        {visible.length === 0 ? (
          <p className="col-span-full p-10 text-center text-hw-dim">{dict.emptyMsg}</p>
        ) : (
          visible.map((hero) => <HeroCard key={hero.id} hero={hero} dict={dict} lang={lang} />)
        )}
      </main>
    </div>
  );

  return (
    <Routes>
      <Route
        path="/hero/:id"
        element={<HeroRoute heroes={heroes} dict={dict} lang={lang} onLang={setLang} />}
      />
      <Route path="/my-heroes" element={collection} />
      <Route
        path="/"
        element={
          <HeroList
            heroes={heroes}
            filters={listFilters}
            onFilters={setListFilters}
            dict={dict}
            lang={lang}
            onLang={setLang}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function HeroRoute(props: Omit<ComponentProps<typeof HeroPage>, 'heroId'>) {
  return <HeroPage heroId={Number(useParams().id)} {...props} />;
}
