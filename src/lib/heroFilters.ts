import { heroFaction, heroName, heroRole, type Hero, type Lang } from '@/lib/heroes';
import { DICT } from '@/lib/i18n';

/** Select sentinel: Radix Select does not allow an empty-string item value. */
export const ALL = 'all';

export type SortKey = 'power_desc' | 'power_asc' | 'star_desc' | 'id_asc' | 'name_asc';

export interface Filters {
  search: string;
  color: string;
  star: string;
  faction: string;
  role: string;
}

export function filterHeroes(heroes: Hero[], f: Filters, lang: Lang): Hero[] {
  const search = f.search.trim();
  const query = search.toLowerCase();
  return heroes.filter((h) => {
    if (search) {
      const idMatch = String(h.id) === search;
      const nameMatch = heroName(h, lang).toLowerCase().includes(query);
      if (!idMatch && !nameMatch) return false;
    }
    if (f.color !== ALL && String(h.color) !== f.color) return false;
    if (f.star !== ALL && String(h.star) !== f.star) return false;
    if (f.faction !== ALL && String(heroFaction(h.id)) !== f.faction) return false;
    if (f.role !== ALL && heroRole(h.id) !== f.role) return false;
    return true;
  });
}

export function sortHeroes(heroes: Hero[], sortBy: SortKey, lang: Lang): Hero[] {
  const locale = DICT[lang].locale;
  return [...heroes].sort((a, b) => {
    switch (sortBy) {
      case 'power_desc':
        return b.power - a.power;
      case 'power_asc':
        return a.power - b.power;
      case 'star_desc':
        return b.star - a.star || b.power - a.power;
      case 'id_asc':
        return a.id - b.id;
      case 'name_asc':
        return heroName(a, lang).localeCompare(heroName(b, lang), locale);
    }
  });
}

export interface Stats {
  total: number;
  totalPower: number;
  strongest: { id: number; power: number } | null;
  maxStar: number;
  mythicCount: number;
}

export function computeStats(heroes: Hero[]): Stats {
  const strongest = heroes.reduce<Hero | null>((a, b) => (a && a.power > b.power ? a : b), null);
  return {
    total: heroes.length,
    totalPower: heroes.reduce((s, h) => s + h.power, 0),
    strongest: strongest && { id: strongest.id, power: strongest.power },
    maxStar: heroes.reduce((m, h) => Math.max(m, h.star), 0),
    mythicCount: heroes.filter((h) => h.color === 16).length,
  };
}
