import { useMemo } from 'react';
import { Link } from 'react-router';
import { HeroAvatar } from '@/components/HeroAvatar';
import { LangSwitch } from '@/components/LangSwitch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL, filterHeroes, sortHeroes, type ListFilters } from '@/lib/heroFilters';
import {
  FACTION_IDS,
  factionKey,
  heroFaction,
  heroName,
  heroRole,
  ROLES,
  type Hero,
  type Lang,
} from '@/lib/heroes';
import type { Dict } from '@/lib/i18n';

interface Props {
  heroes: Hero[];
  filters: ListFilters;
  onFilters: (f: ListFilters) => void;
  dict: Dict;
  lang: Lang;
  onLang: (lang: Lang) => void;
}

const fieldClass = 'border-hw-border bg-hw-panel-2 text-hw-text';

/** Static hero info only (name, faction, role): nothing from the player's own roster. */
function CatalogCard({ hero, dict, lang }: { hero: Hero; dict: Dict; lang: Lang }) {
  const name = heroName(hero, lang);
  const factionId = heroFaction(hero.id);
  const role = heroRole(hero.id);
  const details = [
    factionId !== undefined ? dict.faction[factionKey(factionId)] : undefined,
    role ? dict.role[role] : undefined,
  ].filter(Boolean);

  return (
    <li className="relative flex items-center gap-3 rounded-xl border border-hw-border bg-hw-panel px-3.5 py-3 transition hover:border-[#3d4250]">
      <HeroAvatar hero={hero} name={name} className="size-12 rounded-[10px]" />
      <div className="flex min-w-0 flex-col">
        <Link
          to={`/hero/${hero.id}`}
          state={{ from: '/' }}
          className="truncate text-[15px] font-bold outline-none after:absolute after:inset-0 focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-hw-accent"
        >
          {name}
        </Link>
        {details.length > 0 && <span className="text-xs text-hw-dim">{details.join(' · ')}</span>}
      </div>
    </li>
  );
}

export function HeroList({ heroes, filters, onFilters, dict, lang, onLang }: Props) {
  const { search, faction, role } = filters;
  const setSearch = (v: string) => onFilters({ ...filters, search: v });
  const setFaction = (v: string) => onFilters({ ...filters, faction: v });
  const setRole = (v: string) => onFilters({ ...filters, role: v });

  const visible = useMemo(
    () =>
      sortHeroes(
        filterHeroes(heroes, { search, color: ALL, star: ALL, faction, role }, lang),
        'name_asc',
        lang,
      ),
    [heroes, search, faction, role, lang],
  );
  const factionOptions = useMemo(() => {
    const present = new Set(heroes.map((h) => heroFaction(h.id)));
    return FACTION_IDS.filter((id) => present.has(id));
  }, [heroes]);

  return (
    <div className="min-h-screen bg-hw-bg font-sans text-hw-text">
      <header className="flex items-center justify-between gap-4 border-b border-hw-border bg-linear-to-br from-[#1d2130] to-[#14161c] px-8 py-4">
        <div className="flex items-center gap-5">
          <h1 className="text-xl font-semibold">{dict.allHeroesTitle}</h1>
          <span className="text-sm text-hw-dim">{dict.heroesCount(visible.length)}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/my-heroes" className="text-sm font-semibold text-hw-accent hover:underline">
            {dict.myHeroes}
          </Link>
          <LangSwitch lang={lang} onChange={onLang} />
        </div>
      </header>
      <div className="flex flex-wrap items-center gap-3 border-b border-hw-border bg-hw-panel px-8 py-4">
        <label htmlFor="list-search" className="text-xs text-hw-dim">
          {dict.lblSearch}
        </label>
        <Input
          id="list-search"
          type="text"
          value={search}
          placeholder={dict.searchPlaceholder}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-48 ${fieldClass}`}
        />
        <label htmlFor="list-faction" className="text-xs text-hw-dim">
          {dict.lblFaction}
        </label>
        <Select value={faction} onValueChange={setFaction}>
          <SelectTrigger id="list-faction" className={fieldClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{dict.optAll}</SelectItem>
            {factionOptions.map((id) => (
              <SelectItem key={id} value={String(id)}>
                {dict.faction[factionKey(id)]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label htmlFor="list-role" className="text-xs text-hw-dim">
          {dict.lblRole}
        </label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger id="list-role" className={fieldClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{dict.optAll}</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {dict.role[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <main className="px-8 py-6">
        {visible.length === 0 ? (
          <p className="p-10 text-center text-hw-dim">{dict.emptyMsg}</p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
            {visible.map((hero) => (
              <CatalogCard key={hero.id} hero={hero} dict={dict} lang={lang} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
