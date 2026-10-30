import { motion } from 'framer-motion';
import { Check, HeartHandshake, Lock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LensPill } from '@/components/LensPill';
import { Avatar, Button, Card, Confetti, Dialog, cx } from '@/components/ui';
import { DAY_MS, formatDayTime } from '@/lib/clock';
import { hasAnswered, revealedPicks } from '@/lib/rules/meetAgain';
import type { FeltSafe, Plan, UserId } from '@/lib/types';
import { useDemo } from '@/store';
import { usePhone } from '@/features/shell/phone';
import { ReportSheet } from '@/features/safety/ReportSheet';

const SAFE: { value: FeltSafe; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'mostly', label: 'Mostly' },
  { value: 'no', label: 'No' },
];

/** After the meetup: private picks, felt-safe, then a mutual-only reveal and the next plan. */
export function MeetAgain({ plan }: { plan: Plan }) {
  const { world, me, act } = usePhone();
  const navigate = useNavigate();
  const [picks, setPicks] = useState<UserId[]>([]);
  const [report, setReport] = useState<UserId | null>(null);
  const [confirmNext, setConfirmNext] = useState(false);
  const others = plan.attended.filter((id) => id !== me);
  const first = (id: UserId) => world.users[id].name.split(' ')[0];

  if (!hasAnswered(plan, me))
    return (
      <Card className="p-4" data-testid="meet-again">
        <h2 className="font-display text-lg font-semibold">Who would you meet again?</h2>
        <p className="mb-3 text-sm text-ink-muted">Private. Pick anyone, or no one.</p>
        <div className="grid grid-cols-3 gap-2">
          {others.map((id) => {
            const on = picks.includes(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                data-testid={`pick-${id}`}
                onClick={() => setPicks((p) => (on ? p.filter((x) => x !== id) : [...p, id]))}
                className={cx(
                  'relative flex flex-col items-center gap-1 rounded-card border-2 p-2 transition-colors',
                  on ? 'border-teal bg-teal-50' : 'border-hairline bg-white',
                )}
              >
                <Avatar seed={world.users[id].avatar} name={world.users[id].name} size={56} />
                <span className="text-sm font-semibold">{first(id)}</span>
                {on && (
                  <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-teal text-white">
                    <Check className="h-4 w-4" aria-hidden />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 flex items-start gap-2 text-sm text-ink-soft">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
          Only mutual picks are shown. If they didn't pick you, they'll never know you picked them.
        </p>
        <Button
          block
          className="mt-3"
          onClick={() => act({ type: 'meetAgain', planId: plan.id, picks })}
          data-testid="save-picks"
        >
          {picks.length
            ? `Save ${picks.length} private pick${picks.length > 1 ? 's' : ''}`
            : 'Skip, no picks'}
        </Button>
      </Card>
    );

  const safe = plan.feltSafe[me];
  if (!safe)
    return (
      <Card className="p-4" data-testid="felt-safe">
        <h2 className="font-display text-lg font-semibold">Did you feel safe?</h2>
        <p className="mb-3 text-sm text-ink-muted">Only our safety team sees this.</p>
        <div className="grid grid-cols-3 gap-2">
          {SAFE.map((s) => (
            <Button
              key={s.value}
              variant={s.value === 'no' ? 'secondary' : 'primary'}
              onClick={() => act({ type: 'feltSafe', planId: plan.id, answer: s.value })}
              data-testid={`safe-${s.value}`}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </Card>
    );

  const mutual = revealedPicks(plan, me);
  const nextStart = plan.start + 7 * DAY_MS;
  const joinedNext = world.plans.find(
    (p) => p.title === plan.title && p.start === nextStart && p.members.includes(me),
  );

  return (
    <div className="flex flex-col gap-3">
      {safe === 'no' && (
        <Card className="border-coral-700 p-4" data-testid="unsafe-support">
          <h2 className="font-display text-lg font-semibold text-coral-700">
            We're sorry. Thank you for telling us.
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            You did the right thing. If someone made you uncomfortable, report them privately. They will never
            know it was you.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {others.map((id) => (
              <Button key={id} size="sm" variant="secondary" onClick={() => setReport(id)}>
                Report {first(id)}
              </Button>
            ))}
          </div>
        </Card>
      )}
      <LensPill framework="Peak-end rule" why="the meetup ends on a high" />
      {mutual.length > 0 ? (
        <Card tone="teal" className="relative overflow-hidden p-5 text-center" data-testid="reveal">
          <Confetti />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-3 flex justify-center -space-x-3">
              <Avatar
                seed={world.users[me].avatar}
                name={world.users[me].name}
                size={64}
                className="ring-4 ring-teal-50"
              />
              {mutual.map((id) => (
                <Avatar
                  key={id}
                  seed={world.users[id].avatar}
                  name={world.users[id].name}
                  size={64}
                  className="ring-4 ring-teal-50"
                />
              ))}
            </div>
            <HeartHandshake className="mx-auto mb-1 h-6 w-6 text-teal" aria-hidden />
            <p className="font-display text-xl font-semibold">
              You and {mutual.map(first).join(' and ')} both want to meet again.
            </p>
            <p className="mt-1 text-sm text-ink-soft">Only mutual picks are ever shown.</p>
          </motion.div>
        </Card>
      ) : (
        <Card tone="mist" className="p-4 text-center" data-testid="reveal-none">
          <p className="font-semibold">No mutual picks this time.</p>
          <p className="text-sm text-ink-muted">
            That's normal. Friendships take a few meetups. Your picks stay private.
          </p>
        </Card>
      )}
      {mutual.length > 0 && (
        <Card className="p-4" data-testid="next-plan">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Toli suggests</p>
          <p className="font-display text-lg font-semibold">{plan.title}, next week</p>
          <p className="text-sm text-ink-muted">
            {formatDayTime(nextStart)} · same place · with {mutual.map(first).join(', ')}
          </p>
          {joinedNext ? (
            <Button
              variant="secondary"
              block
              className="mt-3"
              onClick={() => navigate(`/plan/${joinedNext.id}`)}
            >
              You're in · open plan
            </Button>
          ) : (
            <Button
              variant="accent"
              block
              className="mt-3"
              onClick={() => setConfirmNext(true)}
              data-testid="join-next"
            >
              Join next week
            </Button>
          )}
        </Card>
      )}
      <Dialog
        open={confirmNext}
        title="Join next week's plan?"
        body="Your attendance will be shared with this group. You can leave any time."
        confirmLabel="Join plan"
        onCancel={() => setConfirmNext(false)}
        onConfirm={() => {
          setConfirmNext(false);
          act({ type: 'joinNextPlan', fromPlanId: plan.id, withIds: mutual });
          const next = useDemo
            .getState()
            .world.plans.find((p) => p.title === plan.title && p.start === nextStart);
          if (next) navigate(`/plan/${next.id}`);
        }}
      />
      <ReportSheet
        userId={report}
        onClose={() => setReport(null)}
        onDone={() => setReport(null)}
        intro="We're sorry this happened. You're safe to tell us; they will never know who reported them."
      />
    </div>
  );
}
