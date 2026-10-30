import { Fragment, useEffect } from 'react';
import { Link } from 'react-router';
import { HeroAvatar } from '@/components/HeroAvatar';
import { LangSwitch } from '@/components/LangSwitch';
import { Badge } from '@/components/ui/badge';
import { getHeroCounters, type CounterRef } from '@/lib/heroCounters';
import { colorMeta, heroName, stars, type Hero, type Lang } from '@/lib/heroes';
import type { Dict } from '@/lib/i18n';

interface Props {
  heroId: number;
  heroes: Hero[];
  dict: Dict;
  lang: Lang;
  onLang: (lang: Lang) => void;
}

const chip =
  'inline-flex items-center gap-1.5 rounded-lg border border-hw-border bg-hw-panel-2 py-1 pr-2.5 pl-1 text-[13px]';

function HeroChip({ id, fallback, byId, lang }: { id: number | null; fallback: string; byId: Map<number, Hero>; lang: Lang }) {
  const hero = id === null ? undefined : byId.get(id);
  if (!hero) return <span className={`${chip} pl-2.5 text-hw-dim`}>{fallback}</span>;
  const name = heroName(hero, lang);
  return (
    <Link to={`/hero/${hero.id}`} className={`${chip} font-semibold hover:border-hw-accent`}>
      <HeroAvatar hero={hero} name={name} className="size-7 rounded-md" />
      {name}
    </Link>
  );
}

function Combo({ refs, byId, lang }: { refs: CounterRef[]; byId: Map<number, Hero>; lang: Lang }) {
  return (
    <li className="flex flex-wrap items-center gap-1.5">
      {refs.map((r, i) => (
        <Fragment key={`${r.name}-${i}`}>
          {i > 0 && <span className="text-hw-dim">+</span>}
          <HeroChip id={r.id} fallback={r.name} byId={byId} lang={lang} />
        </Fragment>
      ))}
    </li>
  );
}

export function HeroPage({ heroId, heroes, dict, lang, onLang }: Props) {
  const byId = new Map(heroes.map((h) => [h.id, h]));
  const hero = byId.get(heroId);
  const data = getHeroCounters(heroId);
  const how = data?.howToCounter ?? null;

  useEffect(() => {
    // Navigating between hero pages keeps the scroll position otherwise; jsdom has no scrollTo.
    window.scrollTo?.(0, 0);
  }, [heroId]);

  return (
    <div className="min-h-screen bg-hw-bg font-sans text-hw-text">
      <header className="flex items-center justify-between gap-4 border-b border-hw-border bg-linear-to-br from-[#1d2130] to-[#14161c] px-8 py-4">
        <Link to="/" className="text-sm font-semibold text-hw-accent hover:underline">
          {dict.backToCollection}
        </Link>
        <LangSwitch lang={lang} onChange={onLang} />
      </header>
      <main className="mx-auto max-w-3xl px-8 py-6">
        {!hero ? (
          <p className="p-10 text-center text-hw-dim">{dict.heroNotFound}</p>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-4">
              <HeroAvatar hero={hero} name={heroName(hero, lang)} className="size-20 rounded-xl" />
              <div>
                <h1 className="text-2xl font-semibold">{heroName(hero, lang)}</h1>
                <div className="text-sm tracking-wide text-hw-accent">{stars(hero.star)}</div>
                <Badge className="mt-1 text-[11px] font-bold text-[#111]" style={{ backgroundColor: colorMeta(hero.color).hex }}>
                  {colorMeta(hero.color).name}
                </Badge>
              </div>
            </div>

            <section className="mb-8">
              <h2 className="mb-1 text-lg font-semibold">{dict.countersTitle}</h2>
              {data && data.counters.length > 0 ? (
                <>
                  <p className="mb-3 text-xs text-hw-dim">{dict.countersHint}</p>
                  <ul className="flex flex-col gap-2">
                    {data.counters.map((refs, i) => (
                      <Combo key={i} refs={refs} byId={byId} lang={lang} />
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-hw-dim">{dict.noCounters}</p>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">{dict.howToTitle}</h2>
              {how && how.entries.length > 0 ? (
                <>
                  <ul className="flex flex-col gap-3">
                    {how.entries.map((e, i) => (
                      <li key={i} className="rounded-xl border border-hw-border bg-hw-panel p-3.5">
                        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                          {e.labelId !== null ? (
                            <HeroChip id={e.labelId} fallback={e.label ?? ''} byId={byId} lang={lang} />
                          ) : (
                            <>
                              {e.label && <strong className="text-sm">{e.label}</strong>}
                              {e.mentionedIds.map((id) => (
                                <HeroChip key={id} id={id} fallback={String(id)} byId={byId} lang={lang} />
                              ))}
                            </>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-hw-text">{e.text}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-hw-dim">
                    {dict.sourceNote}
                    {how.detailsUrl && (
                      <>
                        {' '}
                        <a href={how.detailsUrl} target="_blank" rel="noreferrer" className="text-hw-accent hover:underline">
                          {dict.moreDetails} ↗
                        </a>
                      </>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-sm text-hw-dim">{dict.noHowTo}</p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
