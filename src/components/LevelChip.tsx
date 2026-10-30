import { ShieldCheck } from 'lucide-react';
import { LEVEL_COLOUR, levelOf } from '@/lib/rules/verification';
import { cx } from '@/components/ui/cx';

/** "Trusted · 75%": the verification level, never the reason behind it. */
export function LevelChip({ score, className }: { score: number; className?: string }) {
  const level = levelOf(score);
  const colour = LEVEL_COLOUR[level.key];
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
        className,
      )}
      style={{ borderColor: colour, color: level.key === 'starting' ? '#475569' : colour }}
      data-testid="level-chip"
    >
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
      {level.label} · {score}%
    </span>
  );
}
