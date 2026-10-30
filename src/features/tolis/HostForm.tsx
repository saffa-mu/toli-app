import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, IconButton, ToggleChip } from '@/components/ui';
import { DAY_MS, HOUR, MINUTE, formatDay, startOfDay } from '@/lib/clock';
import { venueInRadius } from '@/lib/geo';
import { canHost, scoreOf } from '@/lib/rules/verification';
import { MAX_SPOTS, MIN_SPOTS } from '@/lib/rules/plans';
import { ACTIVITIES as META, HOST_TITLES } from '@/data/activities';
import type { Activity } from '@/lib/types';
import { useDemo } from '@/store';
import { usePhone } from '@/features/shell/phone';

const ACTIVITIES: Activity[] = META.map((m) => m.id);
const TIMES = [
  { label: '6:30 am', h: 6, m: 30 },
  { label: '8:00 am', h: 8, m: 0 },
  { label: '5:30 pm', h: 17, m: 30 },
  { label: '7:30 pm', h: 19, m: 30 },
];
const TITLES = HOST_TITLES;

/** Host a toli: creates a real plan in the world that others can join. */
export function HostForm() {
  const { world, me, user, act } = usePhone();
  const navigate = useNavigate();
  const first = user.routines[0];
  const [activity, setActivity] = useState<Activity>(first?.activity ?? 'badminton');
  const venues = Object.values(world.venues).filter(
    (v) => v.activities.includes(activity) && venueInRadius(world, me, v.id),
  );
  const [venueId, setVenueId] = useState(first?.venueId ?? venues[0].id);
  const [day, setDay] = useState(1);
  const [time, setTime] = useState(0);
  const [spots, setSpots] = useState(4);
  const [womenOnly, setWomenOnly] = useState(false);
  const [title, setTitle] = useState(TITLES[first?.activity ?? 'badminton']);

  const validVenue = venues.some((v) => v.id === venueId) ? venueId : venues[0].id;
  const start = startOfDay(world.clock) + day * DAY_MS + TIMES[time].h * HOUR + TIMES[time].m * MINUTE;

  const create = () => {
    act({ type: 'hostPlan', draft: { title, activity, venueId: validVenue, start, spots, womenOnly } });
    const plans = useDemo.getState().world.plans.filter((p) => p.hostId === me);
    const created = plans[plans.length - 1];
    if (created) navigate(`/plan/${created.id}`);
  };

  if (!canHost(world, me))
    return (
      <Card tone="mist" className="p-4 text-sm" data-testid="host-locked">
        Hosting a toli needs Fully verified (100%). You're at {scoreOf(world, me)}%.
      </Card>
    );

  return (
    <div className="flex flex-col gap-5" data-testid="host-form">
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-ink-muted">Name your toli</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-12 w-full rounded-btn border border-hairline bg-white px-4 text-base"
        />
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink-muted">Activity</legend>
        <div className="flex flex-wrap gap-2">
          {ACTIVITIES.map((a) => (
            <ToggleChip
              key={a}
              selected={activity === a}
              onClick={() => {
                setActivity(a);
                setTitle(TITLES[a]);
              }}
              className="capitalize"
            >
              {a}
            </ToggleChip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink-muted">Place</legend>
        <div className="flex flex-wrap gap-2">
          {venues.map((v) => (
            <ToggleChip key={v.id} selected={validVenue === v.id} onClick={() => setVenueId(v.id)}>
              {v.short} · S{v.sector}
            </ToggleChip>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-ink-muted">Others see only the sector until they join.</p>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink-muted">When</legend>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <ToggleChip key={d} selected={day === d} onClick={() => setDay(d)} className="shrink-0">
              {formatDay(startOfDay(world.clock) + d * DAY_MS).slice(0, 6)}
            </ToggleChip>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {TIMES.map((t, i) => (
            <ToggleChip key={t.label} selected={time === i} onClick={() => setTime(i)}>
              {t.label}
            </ToggleChip>
          ))}
        </div>
      </fieldset>
      <div>
        <span className="mb-2 block text-sm font-semibold text-ink-muted">Spots (3 to 6, including you)</span>
        <Card tone="mist" className="flex items-center justify-between px-2 py-1">
          <IconButton
            label="Fewer spots"
            disabled={spots <= MIN_SPOTS}
            onClick={() => setSpots((s) => s - 1)}
          >
            <Minus className="h-5 w-5" />
          </IconButton>
          <span className="font-display text-xl font-semibold tabular-nums" aria-live="polite">
            {spots} spots
          </span>
          <IconButton label="More spots" disabled={spots >= MAX_SPOTS} onClick={() => setSpots((s) => s + 1)}>
            <Plus className="h-5 w-5" />
          </IconButton>
        </Card>
      </div>
      {user.gender === 'F' && (
        <label className="flex min-h-[48px] cursor-pointer items-center justify-between gap-3 rounded-btn bg-mist px-4">
          <span>
            <span className="block font-medium">Women-only</span>
            <span className="block text-xs text-ink-muted">Invisible to men</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            className="h-6 w-6 accent-[#0F766E]"
            checked={womenOnly}
            onChange={(e) => setWomenOnly(e.target.checked)}
          />
        </label>
      )}
      <Button block onClick={create} disabled={!title.trim()} data-testid="create-plan">
        Create toli
      </Button>
      <p className="-mt-2 text-center text-xs text-ink-muted">
        First meetups are in groups, in public places.
      </p>
    </div>
  );
}
