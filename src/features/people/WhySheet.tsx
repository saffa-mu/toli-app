import { LensPill } from '@/components/LensPill';
import { Sheet } from '@/components/ui';
import { scorePair } from '@/lib/matching/score';
import { COMPONENT_LABELS, COMPONENT_ORDER, WEIGHTS } from '@/lib/matching/weights';
import type { UserId } from '@/lib/types';
import { usePhone } from '@/features/shell/phone';

/** The real weighted-rules breakdown for this pair, straight from the matching function. */
export function WhySheet({ userId, onClose }: { userId: UserId | null; onClose: () => void }) {
  const { world, me } = usePhone();
  const other = userId ? world.users[userId] : undefined;
  const match = userId ? scorePair(world, me, userId) : undefined;
  return (
    <Sheet open={!!other && !!match} onClose={onClose} title="Why this match?" testId="why-sheet">
      {other && match && (
        <div>
          <LensPill framework="Workflow → algorithm" why="inputs, logic, output, metric" />
          <p className="mb-4 text-base text-ink-soft">{match.reason}</p>
          <ul className="flex flex-col gap-3" aria-label="Score breakdown">
            {COMPONENT_ORDER.map((k) => {
              const value = match.components[k];
              const contribution = value * WEIGHTS[k];
              return (
                <li key={k} data-testid={`why-bar-${k}`}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-semibold text-ink">{COMPONENT_LABELS[k]}</span>
                    <span className="tabular-nums text-ink-muted">
                      {value.toFixed(2)} × {WEIGHTS[k].toFixed(2)} ={' '}
                      <strong className="text-ink">{contribution.toFixed(3)}</strong>
                    </span>
                  </div>
                  <div
                    className="h-3 overflow-hidden rounded-full bg-teal-50"
                    role="img"
                    aria-label={`${Math.round(value * 100)} percent`}
                  >
                    <div
                      className="h-full rounded-full bg-teal transition-[width] duration-slow ease-out"
                      style={{ width: `${Math.round(value * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex items-center justify-between rounded-btn bg-mist px-4 py-3">
            <span className="font-semibold">Match score</span>
            <span
              className="font-display text-2xl font-semibold tabular-nums text-teal-800"
              data-testid="why-total"
            >
              {match.total.toFixed(2)}
            </span>
          </div>
          <p className="mt-4 text-sm text-ink-muted">
            Rules, not a black box. We'll move to machine-learning ranking once we have "meet again" data.
          </p>
        </div>
      )}
    </Sheet>
  );
}
