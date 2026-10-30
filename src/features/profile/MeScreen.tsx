import { ChevronRight, Info, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LensPill } from '@/components/LensPill';
import { StageChip } from '@/components/StageChip';
import { Avatar, Button, Card, Chip, Dialog, RegularBadge, SectionTitle, Sheet } from '@/components/ui';
import { PROTOTYPE_NOTICE } from '@/lib/constants';
import { publicTags } from '@/lib/rules/publicTag';
import { regularVenues, totalVisits } from '@/lib/rules/regular';
import { meetupCount, repeatPeople, stageOf } from '@/lib/rules/stages';
import type { Consents } from '@/lib/types';
import type { PrefsPatch } from '@/lib/world/actions';
import { verificationScore } from '@/lib/rules/verification';
import { usePhone } from '@/features/shell/phone';
import { DAY_MS, HOUR, formatDayTime, ist } from '@/lib/clock';
import { useDemo } from '@/store';

const SATURDAY_0630 = ist(2026, 10, 31, 6, 30);
const SATURDAY_0800 = ist(2026, 10, 31, 8, 0);

function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
  testId,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  testId?: string;
}) {
  return (
    <label className="flex min-h-[56px] cursor-pointer items-center justify-between gap-3 py-2">
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        <span className="block text-sm text-ink-muted">{hint}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        className="h-6 w-6 shrink-0 accent-[#0F766E]"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        data-testid={testId}
      />
    </label>
  );
}

const CONSENTS: { key: keyof Consents; label: string; hint: string }[] = [
  {
    key: 'location',
    label: 'Use my location for check-in prompts',
    hint: 'Only on your phone, only at your places',
  },
  {
    key: 'photos',
    label: 'Use my photos for my profile',
    hint: 'Location data is stripped from every photo',
  },
  { key: 'quiz', label: 'Use my quiz answers for matching', hint: 'Answers are never shown on your profile' },
];

export function MeScreen() {
  const { world, me, user, act } = usePhone();
  const navigate = useNavigate();
  const [about, setAbout] = useState(false);
  const [tools, setTools] = useState(false);
  // The founder page lives on the outer router; each phone has its own isolated one.
  const nav = (path: string) => {
    window.location.hash = path;
  };
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (prefs: PrefsPatch) => act({ type: 'setPrefs', prefs });
  const blocked = world.blocks.filter((b) => b.by === me);
  const regular = regularVenues(world, me);

  return (
    <div className="px-4 pb-8 pt-3">
      <header className="mb-5 flex items-center gap-4">
        <Avatar seed={user.avatar} name={user.name} size={80} score={verificationScore(world, me).total} />
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold">{user.name}</h1>
          <p className="text-sm text-ink-muted">
            {user.age} · from {user.hometown} · {user.city}
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <StageChip stage={stageOf(world, me)} />
            {regular.length > 0 && <RegularBadge />}
          </div>
        </div>
      </header>

      <div className="mb-5 grid grid-cols-3 gap-2">
        {[
          { n: totalVisits(world, me), label: 'Visits (30 days)' },
          { n: meetupCount(world, me), label: 'Meetups' },
          { n: repeatPeople(world, me).length, label: 'Repeat meetups' },
        ].map((s) => (
          <Card key={s.label} tone="mist" className="p-3 text-center">
            <p className="font-display text-2xl font-semibold tabular-nums">{s.n}</p>
            <p className="text-xs text-ink-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      <SectionTitle>What others see</SectionTitle>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {publicTags(world, me).map((t) => (
          <Chip key={t} tone="teal">
            {t}
          </Chip>
        ))}
        {publicTags(world, me).length === 0 && <p className="text-sm text-ink-muted">Nothing yet.</p>}
      </div>

      <SectionTitle>Privacy and safety</SectionTitle>
      <LensPill framework="Kano: basic need" why="non-negotiable privacy controls" />
      <Card className="mb-3 divide-y divide-hairline px-4">
        <Toggle
          label="Smart check-in"
          hint="Ask me at my places. Off means nothing is read in the background."
          checked={user.prefs.smartCheckin}
          onChange={(v) => set({ smartCheckin: v })}
        />
        <Toggle
          label="Coarse location only"
          hint="Others only ever see your neighbourhood. Always on."
          checked
          disabled
        />
        {user.gender === 'F' && (
          <Toggle
            label="Women-only mode"
            hint={user.verification.govId ? 'See only women; hidden from men; women-only plans' : 'Needs ID verification (Home > Boost)'}
            disabled={!user.verification.govId}
            checked={user.prefs.womenOnly}
            onChange={(v) => set({ womenOnly: v })}
            testId="women-only-toggle"
          />
        )}
        <Toggle
          label="Plan reminders"
          hint="One reminder before each plan. No other notifications."
          checked={user.prefs.notifications}
          onChange={(v) => set({ notifications: v })}
        />
      </Card>
      <h3 className="mb-1 mt-4 font-display text-md font-semibold">Your data, your call</h3>
      <p className="mb-2 text-sm text-ink-muted">
        All off by default. Toli still works with every one of these off.
      </p>
      <Card className="mb-3 divide-y divide-hairline px-4" data-testid="consents">
        {CONSENTS.map((c) => (
          <Toggle
            key={c.key}
            label={c.label}
            hint={c.hint}
            checked={user.prefs.consents[c.key]}
            onChange={(v) => set({ consents: { [c.key]: v } })}
          />
        ))}
      </Card>

      <button
        type="button"
        onClick={() => navigate('/safety')}
        className="mb-3 flex h-14 w-full items-center gap-3 rounded-card bg-teal-50 px-4 text-left font-semibold text-teal-900"
      >
        <ShieldCheck className="h-5 w-5" aria-hidden />
        <span className="flex-1">Safety center</span>
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>

      <SectionTitle>Blocked</SectionTitle>
      <Card className="mb-5 px-4 py-2" data-testid="blocked-list">
        {blocked.length === 0 ? (
          <p className="py-2 text-sm text-ink-muted">You haven't blocked anyone.</p>
        ) : (
          blocked.map((b) => (
            <div key={b.against} className="flex items-center gap-3 py-2">
              <Avatar seed={world.users[b.against].avatar} name={world.users[b.against].name} size={36} />
              <span className="flex-1 font-medium">{world.users[b.against].name}</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => act({ type: 'unblock', against: b.against })}
              >
                Unblock
              </Button>
            </div>
          ))
        )}
      </Card>

      <div className="flex flex-col gap-2">
        <Button variant="secondary" block onClick={() => navigate('/verify')}>
          My verification
        </Button>
        <Button variant="secondary" block onClick={() => navigate('/recommend')}>
          Recommended for me
        </Button>
        <Button variant="secondary" block onClick={() => nav('/founder')} data-testid="open-founder">
          Founder dashboard
        </Button>
        <Button variant="secondary" block onClick={() => setTools(true)} data-testid="open-tools">
          Time and testing tools
        </Button>
        <Button
          variant="secondary"
          block
          icon={<Info className="h-4 w-4" aria-hidden />}
          onClick={() => setAbout(true)}
        >
          About this prototype
        </Button>
        <Button
          variant="ghost"
          block
          className="text-coral-700"
          icon={<Trash2 className="h-4 w-4" aria-hidden />}
          onClick={() => setConfirmDelete(true)}
        >
          Delete my data
        </Button>
      </div>

      <Sheet open={tools} onClose={() => setTools(false)} title="Time and testing tools">
        <p className="mb-3 text-sm text-ink-muted">
          Toli runs on a simulated clock and simulated neighbours, so you can try things that normally take
          days. Now: <strong>{formatDayTime(world.clock)}</strong>
        </p>
        <div className="flex flex-col gap-2">
          {[
            ['Skip ahead 1 hour', world.clock + HOUR],
            ['Skip ahead 1 day', world.clock + DAY_MS],
            ['Jump to Saturday 6:30 am', SATURDAY_0630],
            ['Jump to Saturday 8:00 am (plans end)', SATURDAY_0800],
          ].map(([label, to]) => (
            <Button
              key={label as string}
              variant="secondary"
              block
              disabled={(to as number) <= world.clock}
              onClick={() => act({ type: 'setClock', to: to as number })}
            >
              {label as string}
            </Button>
          ))}
          <Button variant="danger" block onClick={() => { setTools(false); useDemo.getState().reset(); }}>
            Reset the app and start from sign-up
          </Button>
        </div>
      </Sheet>
      <Sheet open={about} onClose={() => setAbout(false)} title="About this prototype">
        <p className="text-base text-ink">{PROTOTYPE_NOTICE}</p>
        <p className="mt-3 text-sm text-ink-muted">
          Built for the Product Management Challenge on combating loneliness. Matching is simple weighted
          rules you can inspect in "Why this match?".
        </p>
      </Sheet>
      <Dialog
        open={confirmDelete}
        title="Delete your data?"
        body="Your visits, chats, plans and preferences will be removed. In this demo, Shift+R twice restores everything."
        confirmLabel="Delete my data"
        tone="danger"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          act({ type: 'deleteMyData' });
          navigate('/');
        }}
      />
    </div>
  );
}
