import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

export function Card({
  tone = 'white',
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { tone?: 'white' | 'mist' | 'teal'; children: ReactNode }) {
  return (
    <div
      className={cx(
        'rounded-card',
        tone === 'white' && 'border border-hairline bg-white shadow-soft',
        tone === 'mist' && 'bg-mist',
        tone === 'teal' && 'border border-teal-100 bg-teal-50',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex min-h-[44px] items-center justify-between gap-2">
      <h2 className="font-display text-lg font-semibold text-ink">{children}</h2>
      {action}
    </div>
  );
}
