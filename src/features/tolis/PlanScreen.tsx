import { ArrowLeft, CalendarDays, Check, Clock, Lock, MapPin, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { VenueMap } from '@/components/illustrations/VenueMap';
import { PartnerBadge } from '@/components/PartnerBadge';
import { LensPill } from '@/components/LensPill';
import { Avatar, Button, Card, Chip, Dialog, IconButton } from '@/components/ui';
import { formatDayTime, formatTime } from '@/lib/clock';
import { canJoin, canSeeVenue, hasEnded, imHereOpen, spotsLeft } from '@/lib/rules/plans';
import { capitalise } from '@/lib/rules/publicTag';
import { usePhone } from '@/features/shell/phone';
import { MeetAgain } from './MeetAgain';

export function PlanScreen() {
  const { planId = '' } = useParams();
  const { world, me, act } = usePhone();
  const navigate = useNavigate();
  const [confirmJoin, setConfirmJoin] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const plan = world.plans.find((p) => p.id === planId);

  if (!plan)
    return (
      <div className="p-6 text-center">
        <p className="mb-4">This plan isn't available.</p>
        <Button onClick={() => navigate('/tolis')}>See tolis</Button>
      </div>
    );

  const venue = world.venues[plan.venueId];
  const member = plan.members.includes(me);
  const revealed = canSeeVenue(plan, me);
  const booked = world.events.some((e) => e.type === 'partner_booked' && e.userId === me && e.props.planId === plan.id);
  const ended = hasEnded(plan, world.clock);
  const windowOpen = imHereOpen(plan, world.clock);
  const here = plan.attended.includes(me);
  const toli = plan.toliId ? world.tolis.find((t) => t.id === plan.toliId) : undefined;
  const pending = (toli?.members ?? []).map((m) => m.userId).filter((id) => !plan.members.includes(id));
  const joinable = canJoin(world, plan, me);

  return (
    <div className="px-4 pb-8 pt-2" data-testid="plan-screen">
      <header className="mb-2 flex items-center gap-1">
        <IconButton label="Back" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-semibold">{plan.title}</h1>
          <p className="text-sm text-ink-muted">
            {capitalise(plan.activity)} · hosted by {world.users[plan.hostId]?.name.split(' ')[0]}
          </p>
        </div>
        {plan.womenOnly && <Chip tone="teal">Women-only</Chip>}
      </header>

      {ended && here && plan.attended.length >= 2 && (
        <div className="mb-4">
          <MeetAgain plan={plan} />
        </div>
      )}

      <Card className="mb-4 overflow-hidden">
        <VenueMap venue={venue} revealed={revealed} />
        <div className="p-4">
          <p className="flex items-center gap-2 font-semibold">
            <CalendarDays className="h-4 w-4 text-teal" aria-hidden /> {formatDayTime(plan.start)}
          </p>
          {revealed ? (
            <div className="mt-2" data-testid="venue-revealed">
              <p className="flex items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4 text-teal" aria-hidden /> {venue.name}, Sector {venue.sector}
              </p>
              <p className="ml-6 text-sm text-ink-muted">{venue.landmark}</p>
            </div>
          ) : (
            <p className="mt-2 flex items-start gap-2 text-sm text-ink-soft" data-testid="venue-hidden">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
              Sector {venue.sector}. The exact venue is shown only inside a plan you've joined.
            </p>
          )}
          {plan.note && <p className="mt-3 text-sm text-ink-soft">{plan.note}</p>}
          {revealed && venue.partner && (
            <div className="mt-3 rounded-btn bg-teal-50 p-3" data-testid="partner-card">
              <PartnerBadge partner={venue.partner} />
              <p className="mt-1 text-sm text-ink-soft">{venue.partner.offer}</p>
              {booked ? (
                <p className="mt-2 text-sm font-semibold text-teal-800">
                  Booked via {venue.partner.source} · ref TOLI-{plan.id.slice(-4).toUpperCase()}
                </p>
              ) : (
                <Button
                  size="sm"
                  className="mt-2"
                  data-testid="partner-book"
                  onClick={() =>
                    act({ type: 'partnerBook', venueId: venue.id, source: venue.partner!.source, stage: 'booked', planId: plan.id })
                  }
                >
                  Book via {venue.partner.source}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card className="mb-4 p-4">
        <LensPill framework="Visibility of system status" why="who's confirmed and who's here, live" />
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold">Who's coming</h2>
          <span className="text-sm font-semibold text-teal-800" data-testid="confirm-count">
            {plan.attended.length > 0
              ? `${plan.attended.length} of ${plan.members.length} here`
              : `${plan.members.length} of ${plan.members.length + pending.length} confirmed`}
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {plan.members.map((id) => (
            <li key={id} className="flex items-center gap-3">
              <Avatar seed={world.users[id].avatar} name={world.users[id].name} size={36} />
              <span className="flex-1 font-medium">
                {id === me ? 'You' : world.users[id].name.split(' ')[0]}
              </span>
              {plan.attended.includes(id) ? (
                <Chip tone="teal" icon={<MapPin className="h-3.5 w-3.5" aria-hidden />}>
                  Here
                </Chip>
              ) : (
                <Chip tone="outline" icon={<Check className="h-3.5 w-3.5" aria-hidden />}>
                  Confirmed
                </Chip>
              )}
            </li>
          ))}
          {pending.map((id) => (
            <li key={id} className="flex items-center gap-3 opacity-70">
              <Avatar seed={world.users[id].avatar} name={world.users[id].name} size={36} />
              <span className="flex-1 font-medium">
                {id === me ? 'You' : world.users[id].name.split(' ')[0]}
              </span>
              <Chip tone="neutral" icon={<Clock className="h-3.5 w-3.5" aria-hidden />}>
                Pending
              </Chip>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-muted">{spotsLeft(plan)} spots left · 3 to 6 people per plan</p>
      </Card>

      <div className="flex flex-col gap-3">
        {!member && !ended && (
          <>
            <Button block onClick={() => setConfirmJoin(true)} disabled={!joinable} data-testid="join-plan">
              {spotsLeft(plan) === 0 ? 'Plan is full' : 'Join plan'}
            </Button>
            <LensPill framework="Error prevention (Nielsen)" why="joining asks before sharing anything" />
          </>
        )}
        {member && !ended && (
          <>
            {here ? (
              <Card tone="teal" className="flex items-center gap-3 p-4" data-testid="you-are-here">
                <MapPin className="h-5 w-5 text-teal" aria-hidden />
                <span className="font-semibold">
                  You're here · {plan.attended.length} of {plan.members.length} here
                </span>
              </Card>
            ) : (
              <>
                <Button
                  variant="accent"
                  block
                  disabled={!windowOpen}
                  onClick={() => act({ type: 'imHere', planId: plan.id })}
                  data-testid="im-here"
                  icon={<MapPin className="h-4 w-4" aria-hidden />}
                >
                  I'm here
                </Button>
                {!windowOpen && (
                  <p className="-mt-1 text-center text-sm text-ink-muted">
                    Opens at {formatTime(plan.start - 15 * 60_000)}, 15 minutes before the start.
                  </p>
                )}
              </>
            )}
            {plan.chatId && (
              <Button
                variant="secondary"
                block
                icon={<MessageCircle className="h-4 w-4" aria-hidden />}
                onClick={() => navigate(`/chat/${plan.chatId}`)}
              >
                Group chat
              </Button>
            )}
          </>
        )}
        {ended && !here && <p className="text-center text-sm text-ink-muted">This plan has finished.</p>}
        {member && !ended && (
          <>
            <Button variant="ghost" block onClick={() => setConfirmLeave(true)} data-testid="leave-plan">
              {toli ? 'Leave toli' : 'Leave plan'}
            </Button>
            <LensPill framework="User control and freedom" why="you can leave a toli any time" />
          </>
        )}
      </div>

      <Dialog
        open={confirmJoin}
        title="Join this plan?"
        body="Share your attendance with this group and reveal the exact venue?"
        confirmLabel="Join and reveal venue"
        onCancel={() => setConfirmJoin(false)}
        onConfirm={() => {
          setConfirmJoin(false);
          act({ type: 'joinPlan', planId: plan.id });
        }}
      />
      <Dialog
        open={confirmLeave}
        title={toli ? `Leave ${plan.title}?` : 'Leave this plan?'}
        body="You can leave a toli any time. The group will see that you left, but not why."
        confirmLabel={toli ? 'Leave toli' : 'Leave plan'}
        tone="danger"
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false);
          if (toli) act({ type: 'leaveToli', toliId: toli.id });
          else act({ type: 'leavePlan', planId: plan.id });
          navigate('/tolis');
        }}
      />
    </div>
  );
}
