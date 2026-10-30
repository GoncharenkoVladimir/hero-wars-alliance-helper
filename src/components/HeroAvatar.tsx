import { useState } from 'react';
import type { Hero } from '@/lib/heroes';
import { cn } from '@/lib/utils';

export function HeroAvatar({
  hero,
  name,
  className = 'size-12 rounded-[10px]',
}: {
  hero: Pick<Hero, 'img'>;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const box = cn('shrink-0 border border-hw-border bg-hw-panel-2', className);
  if (!hero.img || failed) {
    return (
      <div
        aria-hidden
        className={cn(box, 'flex items-center justify-center font-bold text-hw-dim')}
      >
        {name.charAt(0)}
      </div>
    );
  }
  return (
    <img src={hero.img} alt={name} onError={() => setFailed(true)} className={cn(box, 'object-cover')} />
  );
}
