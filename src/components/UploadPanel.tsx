import type { Dict } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export type UploadStatus = { kind: 'ok' | 'err'; text: string };

interface Props {
  dict: Dict;
  status: UploadStatus | null;
  onProfile: (file: File) => void;
  onConfig: (file: File) => void;
}

function FileField({
  id,
  label,
  onFile,
}: {
  id: string;
  label: string;
  onFile: (file: File) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-hw-dim">
        {label}
      </label>
      <input
        id={id}
        type="file"
        accept="application/json,.json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
        className="max-w-65 text-xs text-hw-dim"
      />
    </div>
  );
}

export function UploadPanel({ dict, status, onProfile, onConfig }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-5 border-b border-hw-border bg-hw-panel-2 px-8 py-3">
      <FileField id="upload-profile" label={dict.uploadProfile} onFile={onProfile} />
      <FileField id="upload-config" label={dict.uploadConfig} onFile={onConfig} />
      {status && (
        <div
          role="status"
          className={cn('text-[12.5px]', status.kind === 'ok' ? 'text-[#4caf50]' : 'text-[#e74c3c]')}
        >
          {status.text}
        </div>
      )}
    </div>
  );
}
