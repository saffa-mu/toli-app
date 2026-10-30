import { CalendarDays, ChevronRight, Lock, MapPin, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LensPill } from '@/components/LensPill';
import { StageChip } from '@/components/StageChip';
import { Avatar, Button, Card, Chip, ProgressRing, RegularBadge, SectionTitle } from '@/components/ui';
import { formatDayTime } from '@/lib/clock';
import { peopleFor } from '@/lib/matching/score';
import { myUpcomingPlans } from '@/lib/rules/plans';
import { publicTagFor } from '@/lib/rules/publicTag';
import { REGULAR_VISITS, placesOf, visitCount } from '@/lib/rules/regular';
import { isVerified, stageOf } from '@/lib/rules/stages';
import { verificationScore } from '@/lib/rules/verification';
import { LevelChip } from '@/components/LevelChip';
import { usePhone } from '@/features/shell/phone';
import { PersonRow } from '@/features/people/PersonRow';
import { ProfileSheet } from '@/features/people/ProfileSheet';
import { AlmostThere } from './AlmostThere';
import { SuggestedToliCard } from '@/features/tolis/SuggestedToliCard';

function greeting(clock: number): string {
  const hour = new Date(clock + 330 * 60_000).getUTCHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

export function HomeScreen() {
  const { world, me, user } = usePhone();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<string | null>(null);
  if (!user) return null;

  const stage = stageOf(world, me);
  const score = verificationScore(world, me);
  const people = peopleFor(world, me);
  const places = placesOf(world, me);
  const upcoming = myUpcomingPlans(world, me);
  const suggested = world.tolis.filter(
    (t) =>
      !people.locked &&
      t.members.some((m) => m.userId === me) &&
      (t.status === 'forming' || t.status === 'suggested'),
  );
  const bestPlace = places.reduce<{ venueId: string; n: number } | null>((best, v) => {
    const n = visitCount(world, me, v);
    return !best || n > best.n ? { venueId: v, n } : best;
  }, null);
  const visitsLeft = bestPlace ? Math.max(1, REGULAR_VISITS - bestPlace.n) : REGULAR_VISITS;

  return (
    <div className="px-4 pb-6 pt-3">
      <header className="mb-4">
        <p className="text-sm text-ink-muted">
          {greeting(world.clock)}, {user.name.split(' ')[0]}
        </p>
        <h1 className="font-display text-2xl font-semibold">Your Location</h1>
        <p className="flex items-center gap-1 text-sm text-ink-muted">
          <MapPin className="h-3.5 w-3.5" aria-hidden /> {user.city} · places within 100 km
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <StageChip stage={stage} />
          {user.prefs.womenOnly && (
            <Chip tone="teal" icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden />}>
              Women-only on
            </Chip>
          )}
        </div>
      </header>

      <Card className="mb-4 flex items-center gap-3 p-3" data-testid="verify-card">
        <Avatar seed={user.avatar} name={user.name} size={56} score={score.total} />
        <div className="min-w-0 flex-1">
          <LevelChip score={score.total} />
          {score.next && (
            <p className="mt-1 text-sm text-ink-muted">
              Next: {score.next.label} (+{score.next.max - score.next.earned}%)
            </p>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={() => navigate('/verify')} data-testid="open-verify">
          Boost
        </Button>
      </Card>

      {!isVerified(world, me) ? (
        <AlmostThere />
      ) : (
        <>
          <LensPill framework="LATCH" why="location first, then time, then people" />
          <section aria-labelledby="places-h" className="mb-6">
            <SectionTitle>
              <span id="places-h">Your places</span>
            </SectionTitle>
            {places.length === 0 ? (
              <Card tone="mist" className="p-4 text-sm text-ink-soft">
                No places yet. Check in at your court, park or studio to start.
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {places.map((venueId) => {
                  const v = world.venues[venueId];
                  const n = visitCount(world, me, venueId);
                  const routine = user.routines.find((r) => r.venueId === venueId);
                  const activity = routine?.activity ?? v.activities[0];
                  const regular = n >= REGULAR_VISITS;
                  return (
                    <Card
                      key={venueId}
                      className="flex items-center gap-3 p-4"
                      data-testid={`place-${venueId}`}
                    >
                      <ProgressRing value={n} max={REGULAR_VISITS} label={`${Math.min(n, REGULAR_VISITS)} of ${REGULAR_VISITS} visits`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-md font-semibold">{v.name}</p>
                        <p className="text-sm text-ink-muted">
                          {activity} · Sector {v.sector}
                        </p>
                        {regular ? (
                          <div className="mt-1 flex flex-col items-start gap-1">
                            <RegularBadge />
                            <span className="text-xs text-ink-muted">
                              Others see: {publicTagFor(world, venueId, activity)}
                            </span>
                          </div>
                        ) : (
                          <p className="mt-1 text-sm font-medium text-teal-800">
                            {n} of {REGULAR_VISITS} visits to Verified Regular
                          </p>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          <section aria-labelledby="people-h" className="mb-6">
            <SectionTitle
              action={
                !people.locked && people.matches.length > 0 ? (
                  <Link
                    to="/people"
                    className="flex h-11 items-center gap-1 text-sm font-semibold text-teal-800"
                  >
                    See all <ChevronRight className="h-4 w-4" aria-hidden />
                  </Link>
                ) : undefined
              }
            >
              <span id="people-h">People for you</span>
            </SectionTitle>
            {people.locked ? (
              <Card tone="teal" className="p-4" data-testid="people-teaser">
                <div className="mb-3 flex -space-x-3" aria-hidden>
                  {Array.from({ length: Math.max(3, people.teaserCount) }).map((_, i) => (
                    <Avatar
                      key={i}
                      seed={{
                        skin: (i * 2) % 5,
                        hair: (i * 3) % 6,
                        beard: i % 3 === 0,
                        glasses: i % 2 === 1,
                        shirt: i,
                      }}
                      name="Hidden"
                      blurred
                      size={44}
                      className="ring-2 ring-teal-50"
                    />
                  ))}
                </div>
                <p className="flex items-start gap-2 font-medium text-ink">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
                  {people.teaserCount} regulars
                  {bestPlace ? ` from ${world.venues[bestPlace.venueId].short}` : ''} are waiting.{' '}
                  {score.total < 75
                    ? `Reach Trusted (75%) to meet them. You're at ${score.total}%.`
                    : visitsLeft === 1
                      ? 'One more visit unlocks them.'
                      : `${visitsLeft} more visits unlock them.`}
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  We only introduce verified regulars, so everyone here is real.
                </p>
              </Card>
            ) : people.matches.length === 0 ? (
              <Card tone="mist" className="p-4 text-sm text-ink-soft">
                No new people this week. Fresh suggestions arrive on Monday.
              </Card>
            ) : (
              <div className="flex flex-col gap-2">
                {people.matches.slice(0, 3).map((m) => (
                  <PersonRow key={m.userId} match={m} onOpen={() => setProfile(m.userId)} />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="tolis-h" className="mb-6">
            <SectionTitle>
              <span id="tolis-h">Tolis this week</span>
            </SectionTitle>
            <div className="flex flex-col gap-3">
              {upcoming.map((p) => (
                <Card key={p.id} className="flex items-center gap-3 p-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 text-teal">
                    <CalendarDays className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-sm text-ink-muted">{formatDayTime(p.start)}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/plan/${p.id}`)}>
                    Open
                  </Button>
                </Card>
              ))}
              {suggested.map((t) => (
                <SuggestedToliCard key={t.id} toli={t} compact />
              ))}
              {upcoming.length === 0 && suggested.length === 0 && (
                <Card tone="mist" className="flex items-center gap-3 p-4">
                  <MapPin className="h-5 w-5 shrink-0 text-teal" aria-hidden />
                  <p className="flex-1 text-sm text-ink-soft">
                    Small plans near you, 3 to 6 people, in public places.
                  </p>
                  <Button size="sm" variant="secondary" onClick={() => navigate('/tolis')}>
                    Explore
                  </Button>
                </Card>
              )}
            </div>
          </section>
        </>
      )}
      <p className="text-center text-sm text-ink-muted">Toli suggests, you decide.</p>
      <ProfileSheet userId={profile} onClose={() => setProfile(null)} />
    </div>
  );
}
