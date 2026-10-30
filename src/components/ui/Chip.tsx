import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

type Tone = 'teal' | 'neutral' | 'marigold' | 'coral' | 'outline';

const TONES: Record<Tone, string> = {
  teal: 'bg-teal-50 text-teal-800 border-teal-100',
  neutral: 'bg-mist text-ink border-transparent',
  marigold: 'bg-marigold-50 text-marigold-600 border-marigold-100',
  coral: 'bg-coral-50 text-coral-700 border-coral-50',
  outline: 'bg-white text-ink-soft border-hairline',
};

export function Chip({
  tone = 'teal',
  icon,
  className,
  children,
}: {
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** A selectable chip for forms and pickers (44px tall tap target). */
export function ToggleChip({
  selected,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        'inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors duration-fast',
        selected ? 'border-teal bg-teal text-white' : 'border-hairline bg-white text-ink hover:bg-teal-50',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
