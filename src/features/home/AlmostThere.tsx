import { Check, Circle } from 'lucide-react';
import { Card, cx } from '@/components/ui';
import { STAGES, stageOf } from '@/lib/rules/stages';
import { totalVisits } from '@/lib/rules/regular';
import { usePhone } from '@/features/shell/phone';

/** For people who are not verified yet: what's left, and the ladder ahead. */
export function AlmostThere() {
  const { world, me, user } = usePhone();
  const stage = stageOf(world, me);
  const steps = [
    { label: 'Phone number verified', done: user.verification.otp },
    {
      label: 'Live selfie check',
      done: user.verification.selfie,
      note: 'Pending review, usually under an hour',
    },
    { label: '18+ confirmed', done: user.verification.adult },
    { label: 'First check-in at your place', done: totalVisits(world, me) > 0 },
  ];
  return (
    <div data-testid="almost-there">
      <Card className="mb-4 p-4">
        <h2 className="font-display text-lg font-semibold">Almost there</h2>
        <p className="mb-3 text-sm text-ink-muted">
          Everyone on Toli is verified, so you only meet real people.
        </p>
        <ul className="flex flex-col gap-2">
          {steps.map((s) => (
            <li key={s.label} className="flex items-start gap-3">
              <span
                className={cx(
                  'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  s.done ? 'bg-teal text-white' : 'border-2 border-hairline text-ink-muted',
                )}
              >
                {s.done ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  <Circle className="h-2 w-2" aria-hidden />
                )}
              </span>
              <span>
                <span className={cx('block', s.done ? 'text-ink' : 'font-semibold text-ink')}>{s.label}</span>
                {!s.done && s.note && <span className="block text-sm text-ink-muted">{s.note}</span>}
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <Card tone="mist" className="mb-6 p-4">
        <h3 className="mb-3 font-display text-md font-semibold">Your ladder</h3>
        <ol className="flex items-center justify-between gap-1">
          {STAGES.map((s, i) => (
            <li key={s} className="flex flex-1 flex-col items-center gap-1 text-center">
              <span
                className={cx(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                  s === stage ? 'bg-teal text-white' : 'bg-white text-ink-muted',
                )}
              >
                {i + 1}
              </span>
              <span className={cx('text-xs', s === stage ? 'font-semibold text-ink' : 'text-ink-muted')}>
                {s}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-ink-soft">
          Check in 2 times in 30 days at the same place to become a Verified Regular and unlock people and
          tolis.
        </p>
      </Card>
    </div>
  );
}
