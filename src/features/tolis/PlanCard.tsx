import { CalendarDays, Lock, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, Chip } from '@/components/ui';
import { formatDayTime } from '@/lib/clock';
import { canSeeVenue, spotsLeft } from '@/lib/rules/plans';
import type { Plan } from '@/lib/types';
import { capitalise } from '@/lib/rules/publicTag';
import { usePhone } from '@/features/shell/phone';

/** A plan as shown in chats and lists. Non-members see only activity, neighbourhood and time. */
export function PlanCard({ plan, cta = 'Open plan' }: { plan: Plan; cta?: string }) {
  const { world, me } = usePhone();
  const navigate = useNavigate();
  const venue = world.venues[plan.venueId];
  const member = canSeeVenue(plan, me);
  const host = world.users[plan.hostId];
  return (
    <Card className="p-4" data-testid={`plan-card-${plan.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-md font-semibold">{plan.title}</p>
          <p className="text-sm text-ink-muted">
            {capitalise(plan.activity)} · hosted by {host?.name.split(' ')[0] ?? 'Toli'}
          </p>
        </div>
        {plan.womenOnly && <Chip tone="teal">Women-only</Chip>}
      </div>
      <ul className="mt-3 flex flex-col gap-1.5 text-sm text-ink">
        <li className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-teal" aria-hidden /> {formatDayTime(plan.start)}
        </li>
        <li className="flex items-center gap-2">
          {member ? (
            <MapPin className="h-4 w-4 text-teal" aria-hidden />
          ) : (
            <Lock className="h-4 w-4 text-teal" aria-hidden />
          )}
          {member
            ? `${venue.name}, Sector ${venue.sector}`
            : `Sector ${venue.sector} · Venue revealed after you join`}
        </li>
        <li className="flex items-center gap-2">
          <Users className="h-4 w-4 text-teal" aria-hidden />
          {plan.members.length} of {plan.spots} spots · {spotsLeft(plan)} left
          <span className="ml-1 flex -space-x-2">
            {plan.members.slice(0, 4).map((id) => (
              <Avatar
                key={id}
                seed={world.users[id].avatar}
                name={world.users[id].name}
                size={24}
                className="ring-2 ring-white"
              />
            ))}
          </span>
        </li>
      </ul>
      <Button
        variant="secondary"
        size="sm"
        block
        className="mt-3"
        onClick={() => navigate(`/plan/${plan.id}`)}
      >
        {cta}
      </Button>
    </Card>
  );
}
