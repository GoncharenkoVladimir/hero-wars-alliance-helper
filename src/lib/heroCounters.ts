import countersJson from '@/data/hero-counters.json';

export interface CounterRef {
  name: string;
  /** Hero id from heroes.json; null for names that are not in the game data (Elmir, "AoE heroes"...). */
  id: number | null;
}

export interface CounterEntry {
  /** Bold name of the counter (or a team name such as "Way of Eternity"); null for plain paragraphs. */
  label: string | null;
  labelId: number | null;
  text: string;
  mentionedIds: number[];
}

export interface HowToCounter {
  title: string;
  detailsUrl: string | null;
  entries: CounterEntry[];
}

export interface HeroCounters {
  hero: string;
  heroId: number | null;
  /** Each item is one counter option; several refs mean a combo that works together. */
  counters: CounterRef[][];
  howToCounter: HowToCounter | null;
}

const BY_ID = new Map<number, HeroCounters>();
for (const h of (countersJson as { heroes: HeroCounters[] }).heroes) {
  if (h.heroId !== null) BY_ID.set(h.heroId, h);
}

export function getHeroCounters(id: number): HeroCounters | undefined {
  return BY_ID.get(id);
}
