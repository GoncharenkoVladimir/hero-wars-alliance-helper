import type { Lang } from '@/lib/heroes';
import type { Stats } from '@/lib/heroFilters';
import { formatNumber, type Dict } from '@/lib/i18n';

export function StatsBar({ stats, dict, lang }: { stats: Stats; dict: Dict; lang: Lang }) {
  const items = [
    { value: String(stats.total), label: dict.statHeroes },
    { value: formatNumber(stats.totalPower, lang), label: dict.statTotalPower },
    {
      value: stats.strongest
        ? `#${stats.strongest.id} (${formatNumber(stats.strongest.power, lang)})`
        : '—',
      label: dict.statStrongest,
    },
    { value: `${stats.maxStar}★`, label: dict.statMaxStars },
    { value: String(stats.mythicCount), label: dict.statMythic },
  ];

  return (
    <div className="mt-3.5 flex flex-wrap gap-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-30 rounded-[10px] border border-hw-border bg-hw-panel px-4 py-2.5"
        >
          <div className="text-xl font-bold text-hw-accent">{item.value}</div>
          <div className="text-xs text-hw-dim">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
