import type { Lang, PlayerInfo } from '@/lib/heroes';

export interface Dict {
  htmlLang: string;
  locale: string;
  title: (p: PlayerInfo) => string;
  subtitle: (p: PlayerInfo) => string;
  statHeroes: string;
  statTotalPower: string;
  statStrongest: string;
  statMaxStars: string;
  statMythic: string;
  lblSearch: string;
  searchPlaceholder: string;
  lblRank: string;
  lblStars: string;
  lblSort: string;
  optAll: string;
  sortPowerDesc: string;
  sortPowerAsc: string;
  sortStarDesc: string;
  sortIdAsc: string;
  sortNameAsc: string;
  power: string;
  level: string;
  xp: string;
  skillsUpgraded: string;
  heroRunes: string;
  skinsCount: string;
  titanGift: string;
  talisman: string;
  rank: string;
  traits: string;
  emptyMsg: string;
  artifact: Record<string, string>;
  uploadProfile: string;
  uploadConfig: string;
  uploadNoHeroes: string;
  uploadBadJson: string;
  uploadOk: (count: number, player: string) => string;
}

export const DICT: Record<Lang, Dict> = {
  ua: {
    htmlLang: 'uk',
    locale: 'uk-UA',
    title: (p) => `Колекція героїв — ${p.name}`,
    subtitle: (p) =>
      `Рівень гравця ${p.level} · сервер ${p.serverId} · дамп даних станом на ${p.dumpDate}`,
    statHeroes: 'Героїв',
    statTotalPower: 'Сумарна сила',
    statStrongest: 'Найсильніший',
    statMaxStars: 'Макс. зірок',
    statMythic: 'Mythic героїв',
    lblSearch: 'Пошук',
    searchPlaceholder: "Ім'я або ID, напр. Айрис",
    lblRank: 'Ранг (колір)',
    lblStars: 'Зірки',
    lblSort: 'Сортувати за',
    optAll: 'Всі',
    sortPowerDesc: 'Сила (спад)',
    sortPowerAsc: 'Сила (зрост)',
    sortStarDesc: 'Зірки (спад)',
    sortIdAsc: 'ID (зрост)',
    sortNameAsc: "Ім'я (А-Я)",
    power: 'Сила',
    level: 'Рівень',
    xp: 'Досвід',
    skillsUpgraded: 'Навичок прокачано',
    heroRunes: 'Руни героя (сума)',
    skinsCount: 'Скінів у колекції',
    titanGift: 'Рівень дару титана',
    talisman: 'Талісман',
    rank: 'рів.',
    traits: 'рис',
    emptyMsg: 'Героїв не знайдено за заданими фільтрами.',
    artifact: { weapon: 'Зброя', book: 'Книга', ring: 'Кільце' },
    uploadProfile: 'Дамп профілю гравця (new.json)',
    uploadConfig: 'Конфіг гри — назви героїв (artifact/*.json)',
    uploadNoHeroes: 'У завантаженому профілі не знайдено даних героїв.',
    uploadBadJson: 'Не вдалося прочитати файл — це не коректний JSON.',
    uploadOk: (n, p) => `Оновлено: ${n} героїв${p ? ' · гравець ' + p : ''}.`,
  },
  en: {
    htmlLang: 'en',
    locale: 'en-US',
    title: (p) => `Hero Collection — ${p.name}`,
    subtitle: (p) =>
      `Player level ${p.level} · server ${p.serverId} · data snapshot as of ${p.dumpDate}`,
    statHeroes: 'Heroes',
    statTotalPower: 'Total Power',
    statStrongest: 'Strongest',
    statMaxStars: 'Max Stars',
    statMythic: 'Mythic Heroes',
    lblSearch: 'Search',
    searchPlaceholder: 'Name or ID, e.g. Iris',
    lblRank: 'Rank (color)',
    lblStars: 'Stars',
    lblSort: 'Sort by',
    optAll: 'All',
    sortPowerDesc: 'Power (desc)',
    sortPowerAsc: 'Power (asc)',
    sortStarDesc: 'Stars (desc)',
    sortIdAsc: 'ID (asc)',
    sortNameAsc: 'Name (A-Z)',
    power: 'Power',
    level: 'Level',
    xp: 'XP',
    skillsUpgraded: 'Skills Upgraded',
    heroRunes: 'Hero Runes (sum)',
    skinsCount: 'Skins Owned',
    titanGift: 'Titan Gift Level',
    talisman: 'Talisman',
    rank: 'lvl.',
    traits: 'traits',
    emptyMsg: 'No heroes match the current filters.',
    artifact: { weapon: 'Weapon', book: 'Book', ring: 'Ring' },
    uploadProfile: 'Player profile dump (new.json)',
    uploadConfig: 'Game config — hero names (artifact/*.json)',
    uploadNoHeroes: 'No hero data found in the uploaded profile.',
    uploadBadJson: 'Could not read the file — not valid JSON.',
    uploadOk: (n, p) => `Updated: ${n} heroes${p ? ' · player ' + p : ''}.`,
  },
};

export function formatNumber(n: number, lang: Lang): string {
  return n.toLocaleString(DICT[lang].locale);
}
