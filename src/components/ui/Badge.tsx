import { BadgeCheck } from 'lucide-react';
import { cx } from './cx';

/** The Verified Regular badge: the one marigold thing on the screen. */
export function RegularBadge({ size = 'sm', className }: { size?: 'sm' | 'lg'; className?: string }) {
  if (size === 'lg')
    return (
      <div className={cx('inline-flex flex-col items-center gap-2', className)}>
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-marigold shadow-lift ring-8 ring-marigold-50">
          <BadgeCheck className="h-12 w-12 text-ink" strokeWidth={2.2} aria-hidden />
        </div>
        <span className="font-display text-xl font-semibold text-ink">Verified Regular</span>
      </div>
    );
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full bg-marigold px-2 py-0.5 text-xs font-semibold text-ink',
        className,
      )}
    >
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
      Verified Regular
    </span>
  );
}
