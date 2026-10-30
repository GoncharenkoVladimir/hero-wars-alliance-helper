import type { Lang } from '@/lib/heroes';
import { cn } from '@/lib/utils';

const LANGS: Lang[] = ['ua', 'en'];

export function LangSwitch({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-lg border border-hw-border">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => onChange(l)}
          className={cn(
            'cursor-pointer px-4 py-2 text-[13px] font-bold',
            lang === l ? 'bg-hw-accent text-[#1a1500]' : 'bg-hw-panel text-hw-dim',
          )}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
