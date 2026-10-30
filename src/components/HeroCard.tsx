import { useState, type CSSProperties, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  colorMeta,
  heroName,
  runeSum,
  skillCount,
  skinCount,
  stars,
  type Hero,
  type Lang,
} from '@/lib/heroes';
import { formatNumber, type Dict } from '@/lib/i18n';
import { cn } from '@/lib/utils';

function Avatar({ hero, name }: { hero: Hero; name: string }) {
  const [failed, setFailed] = useState(false);
  const box = 'size-12 shrink-0 rounded-[10px] border border-hw-border bg-hw-panel-2';
  if (!hero.img || failed) {
    return (
      <div
        aria-hidden
        className={cn(box, 'flex items-center justify-center text-lg font-bold text-hw-dim')}
      >
        {name.charAt(0)}
      </div>
    );
  }
  return (
    <img
      src={hero.img}
      alt={name}
      onError={() => setFailed(true)}
      className={cn(box, 'object-cover')}
    />
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between border-t border-dashed border-[#2a2d35] py-[3px] text-[12.5px] text-hw-dim">
      <span>{label}</span>
      <span className="font-semibold text-hw-text">{children}</span>
    </div>
  );
}

export function HeroCard({ hero, dict, lang }: { hero: Hero; dict: Dict; lang: Lang }) {
  const meta = colorMeta(hero.color);
  const name = heroName(hero, lang);

  return (
    <article
      style={{ '--rank-color': meta.hex } as CSSProperties}
      className="relative overflow-hidden rounded-xl border border-hw-border bg-hw-panel px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-[#3d4250] before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-(--rank-color)"
    >
      <Badge className="mb-2 text-[11px] font-bold text-[#111]" style={{ backgroundColor: meta.hex }}>
        {meta.name}
      </Badge>
      <div className="mb-2 flex items-center gap-2.5">
        <Avatar hero={hero} name={name} />
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <span className="text-[15px] font-bold">
            {name} <span className="text-[11px] font-normal text-hw-dim">#{hero.id}</span>
          </span>
          <span className="text-[13px] tracking-wide text-hw-accent">{stars(hero.star)}</span>
        </div>
      </div>
      <div className="text-[11px] tracking-wide text-hw-dim uppercase">{dict.power}</div>
      <div className="text-lg font-extrabold text-white">{formatNumber(hero.power, lang)}</div>
      <Row label={dict.level}>{hero.level}</Row>
      <Row label={dict.xp}>{formatNumber(hero.xp, lang)}</Row>
      <Row label={dict.skillsUpgraded}>{skillCount(hero)}</Row>
      <Row label={dict.heroRunes}>{runeSum(hero)}</Row>
      <Row label={dict.skinsCount}>{skinCount(hero)}</Row>
      <Row label={dict.titanGift}>{hero.titanGiftLevel}</Row>
      <div className="mt-2 flex gap-1.5">
        {hero.artifacts.map((a) => (
          <div
            key={a.artifactType}
            className="flex-1 rounded-md border border-hw-border bg-hw-panel-2 px-1.5 py-1 text-center text-[11px]"
          >
            <span className="block text-[10px] text-hw-dim uppercase">
              {dict.artifact[a.artifactType] ?? a.artifactType}
            </span>
            <span className="font-bold">
              Lv{a.level} ★{a.star}
            </span>
          </div>
        ))}
      </div>
      {hero.talisman && (
        <div className="mt-2 rounded-md border border-[#4a3d16] bg-[#2a2410] px-2 py-[5px] text-[11.5px] text-[#e0c878]">
          🔮 {dict.talisman} #{hero.talisman.id} · {dict.rank} {hero.talisman.level} ·{' '}
          {hero.talisman.traitIds.length} {dict.traits}
        </div>
      )}
    </article>
  );
}
