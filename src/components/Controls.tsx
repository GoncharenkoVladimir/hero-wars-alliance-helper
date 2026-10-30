import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ALL, type SortKey } from '@/lib/heroFilters';
import { colorMeta, factionKey, ROLES } from '@/lib/heroes';
import type { Dict } from '@/lib/i18n';

interface Props {
  dict: Dict;
  search: string;
  onSearch: (v: string) => void;
  color: string;
  onColor: (v: string) => void;
  colors: number[];
  star: string;
  onStar: (v: string) => void;
  starOptions: number[];
  faction: string;
  onFaction: (v: string) => void;
  factionOptions: number[];
  role: string;
  onRole: (v: string) => void;
  sortBy: SortKey;
  onSort: (v: SortKey) => void;
}

const fieldClass = 'border-hw-border bg-hw-panel-2 text-hw-text';

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor={htmlFor} className="text-xs text-hw-dim">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Controls(p: Props) {
  const { dict } = p;
  const sorts: [SortKey, string][] = [
    ['power_desc', dict.sortPowerDesc],
    ['power_asc', dict.sortPowerAsc],
    ['star_desc', dict.sortStarDesc],
    ['id_asc', dict.sortIdAsc],
    ['name_asc', dict.sortNameAsc],
  ];

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-hw-border bg-hw-panel px-8 py-4">
      <Field label={dict.lblSearch} htmlFor="hero-search">
        <Input
          id="hero-search"
          type="text"
          value={p.search}
          placeholder={dict.searchPlaceholder}
          onChange={(e) => p.onSearch(e.target.value)}
          className={`w-48 ${fieldClass}`}
        />
      </Field>
      <Field label={dict.lblRank} htmlFor="hero-color">
        <Select value={p.color} onValueChange={p.onColor}>
          <SelectTrigger id="hero-color" className={fieldClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{dict.optAll}</SelectItem>
            {p.colors.map((c) => (
              <SelectItem key={c} value={String(c)}>
                {colorMeta(c).name} ({c})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label={dict.lblStars} htmlFor="hero-star">
        <Select value={p.star} onValueChange={p.onStar}>
          <SelectTrigger id="hero-star" className={fieldClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{dict.optAll}</SelectItem>
            {p.starOptions.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s}★
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label={dict.lblFaction} htmlFor="hero-faction">
        <Select value={p.faction} onValueChange={p.onFaction}>
          <SelectTrigger id="hero-faction" className={fieldClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{dict.optAll}</SelectItem>
            {p.factionOptions.map((id) => (
              <SelectItem key={id} value={String(id)}>
                {dict.faction[factionKey(id)] ?? factionKey(id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label={dict.lblRole} htmlFor="hero-role">
        <Select value={p.role} onValueChange={p.onRole}>
          <SelectTrigger id="hero-role" className={fieldClass}>
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
      </Field>
      <Field label={dict.lblSort} htmlFor="hero-sort">
        <Select value={p.sortBy} onValueChange={(v) => p.onSort(v as SortKey)}>
          <SelectTrigger id="hero-sort" className={fieldClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sorts.map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
