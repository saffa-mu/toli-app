import { ArrowLeft, Camera, Check, Circle, Lock, MapPin, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LevelChip } from '@/components/LevelChip';
import { Avatar, Button, Card, IconButton, SectionTitle, cx } from '@/components/ui';
import { placesOf } from '@/lib/rules/regular';
import { LEVELS, verificationScore, type ScoreStep } from '@/lib/rules/verification';
import { usePhone } from '@/features/shell/phone';

/** Guided checklist: always shows the next step and how much it adds. */
export function VerifyScreen() {
  const { world, me, user, act } = usePhone();
  const navigate = useNavigate();
  const score = verificationScore(world, me);
  const visited = placesOf(world, me).filter((v) =>
    world.visits.some((x) => x.userId === me && x.venueId === v),
  );
  const toNext = LEVELS.find((l) => l.min > score.total);

  const action = (s: ScoreStep) => {
    if (s.earned >= s.max) return null;
    switch (s.action) {
      case 'checkin':
        return (
          <Button size="sm" variant="secondary" icon={<MapPin className="h-4 w-4" aria-hidden />} onClick={() => navigate('/checkin')}>
            Check in
          </Button>
        );
      case 'govId':
        return (
          <Button size="sm" onClick={() => act({ type: 'verifyId' })} data-testid="verify-id">
            Verify with DigiLocker
          </Button>
        );
      case 'moment':
        return visited.length === 0 ? (
          <p className="text-xs text-ink-muted">Check in at a place first. A photo needs a location to count.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {visited.slice(0, 2).map((v) => (
              <Button
                key={v}
                size="sm"
                variant="secondary"
                icon={<Camera className="h-4 w-4" aria-hidden />}
                onClick={() => act({ type: 'addMoment', venueId: v })}
                data-testid={`add-moment-${v}`}
              >
                Photo at {world.venues[v].short}
              </Button>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="px-4 pb-8 pt-2" data-testid="verify-screen">
      <header className="mb-3 flex items-center gap-1">
        <IconButton label="Back" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <h1 className="font-display text-2xl font-semibold">Your verification</h1>
      </header>

      <Card className="mb-4 flex items-center gap-4 p-4">
        <Avatar seed={user.avatar} name={user.name} size={84} score={score.total} />
        <div className="min-w-0">
          <p className="font-display text-3xl font-semibold tabular-nums" data-testid="verify-score">
            {score.total}%
          </p>
          <LevelChip score={score.total} />
          <p className="mt-1 text-sm text-ink-muted">
            {toNext ? `${toNext.min - score.total}% to ${toNext.label}` : 'Fully verified'}
          </p>
        </div>
      </Card>

      {score.next && (
        <Card tone="teal" className="mb-4 p-4" data-testid="verify-next">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Next step</p>
          <p className="font-semibold">
            {score.next.label} · adds up to {score.next.max - score.next.earned}%
          </p>
          <p className="text-sm text-ink-soft">{score.next.how}</p>
        </Card>
      )}

      <SectionTitle>Steps to 100%</SectionTitle>
      <Card className="mb-5 divide-y divide-hairline px-4">
        {score.steps.map((s) => {
          const done = s.earned >= s.max;
          return (
            <div key={s.key} className="flex items-start gap-3 py-3" data-testid={`step-${s.key}`}>
              <span
                className={cx(
                  'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  done ? 'bg-teal text-white' : 'border-2 border-hairline text-ink-muted',
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden /> : <Circle className="h-2 w-2" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold">{s.label}</p>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-teal-800">
                    {s.earned}/{s.max}%
                  </p>
                </div>
                <p className="text-sm text-ink-muted">{s.how}</p>
                <div className="mt-2">{action(s)}</div>
              </div>
            </div>
          );
        })}
      </Card>

      <SectionTitle>What each level unlocks</SectionTitle>
      <div className="mb-5 flex flex-col gap-2">
        {LEVELS.map((l) => {
          const reached = score.total >= l.min;
          const current = score.level.key === l.key;
          return (
            <Card
              key={l.key}
              tone={current ? 'teal' : 'white'}
              className={cx('flex items-start gap-3 p-3', !reached && 'opacity-80')}
              data-testid={`level-${l.key}`}
            >
              <span className="mt-0.5 shrink-0 text-teal">
                {reached ? <ShieldCheck className="h-5 w-5" aria-hidden /> : <Lock className="h-5 w-5 text-ink-muted" aria-hidden />}
              </span>
              <div>
                <p className="font-semibold">
                  {l.label} <span className="font-normal text-ink-muted">· {l.min === 0 ? 'below 50%' : `${l.min}%+`}</span>
                </p>
                <p className="text-sm text-ink-soft">{l.unlocks}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card tone="mist" className="p-4 text-sm text-ink-soft">
        <p className="mb-1 font-semibold text-ink">How it keeps you safe</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>You see people at a similar score or lower, so verified members are protected from anonymous ones.</li>
          <li>Your location and ID are used to verify you but are never displayed. Others only see your ring and level.</li>
          <li>Women-only mode needs ID verification.</li>
        </ul>
        <p className="mt-2 text-xs text-ink-muted">
          Percentages and thresholds are proposed values. The 2,000-user pilot is meant to test them.
        </p>
      </Card>
    </div>
  );
}
