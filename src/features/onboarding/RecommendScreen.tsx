import { Check, MapPin, Plus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PartnerBadge } from '@/components/PartnerBadge';
import { VenuePhoto } from '@/components/illustrations/VenuePhoto';
import { Button, Card, Chip, SectionTitle } from '@/components/ui';
import { ACTIVITIES, ACTIVITY_BY_ID } from '@/data/activities';
import { areaOf, venueDistance } from '@/lib/geo';
import type { Activity, User, Venue, World } from '@/lib/types';
import { usePhone } from '@/features/shell/phone';

interface ActivityRec {
  id: Activity;
  reason: string;
  chosen: boolean;
}

const QUIZ_ENERGY = ['a quiet chat after', 'a mix of quiet and social', 'big group energy'];

/** Recommend activities from what they chose, their interests and their vibe quiz. */
export function recommendActivities(user: User): ActivityRec[] {
  const chosen = new Set(user.routines.map((r) => r.activity));
  const mornings = user.quiz[3] === 0;
  const evenings = user.quiz[3] === 2;
  const recs: (ActivityRec & { score: number })[] = ACTIVITIES.map((a) => {
    const interestHit = a.interests.find((i) => user.interests.includes(i));
    const energyMatch = a.energy === user.quiz[1];
    const timeMatch = (mornings && a.time === 'morning') || (evenings && a.time === 'evening');
    const score = (interestHit ? 3 : 0) + (energyMatch ? 1.5 : 0) + (timeMatch ? 1 : 0) + (chosen.has(a.id) ? 5 : 0);
    const reasons: string[] = [];
    if (chosen.has(a.id)) reasons.push('you picked it');
    if (interestHit) reasons.push(`you like ${interestHit}`);
    if (energyMatch) reasons.push(`suits ${QUIZ_ENERGY[a.energy]}`);
    if (timeMatch) reasons.push(mornings ? 'you are a morning person' : 'you are better in the evening');
    return {
      id: a.id,
      chosen: chosen.has(a.id),
      score,
      reason: reasons.length ? reasons.join(', ') : 'something new to try',
    };
  });
  return recs
    .filter((r) => r.score > 0)
    .sort((x, y) => y.score - x.score)
    .map((r) => ({ id: r.id, reason: r.reason, chosen: r.chosen }));
}

/** Places within 100 km that offer the recommended activities, nearest picks first. */
export function recommendPlaces(w: World, userId: string, recs: ActivityRec[]) {
  const ids = new Set(recs.map((r) => r.id));
  const rank = (v: Venue) =>
    Math.min(...v.activities.filter((a) => ids.has(a)).map((a) => recs.findIndex((r) => r.id === a)));
  return Object.values(w.venues)
    .filter((v) => venueDistance(w, userId, v.id) <= 100 && v.activities.some((a) => ids.has(a)))
    .sort((x, y) => rank(x) - rank(y) || venueDistance(w, userId, x.id) - venueDistance(w, userId, y.id));
}

export function RecommendScreen() {
  const { world, me, user, act } = usePhone();
  const navigate = useNavigate();
  const recs = recommendActivities(user);
  const top = recs.slice(0, 5);
  const places = recommendPlaces(world, me, top).slice(0, 5);
  const mine = new Set(user.routines.map((r) => r.venueId));

  return (
    <div className="flex min-h-full flex-col px-5 pb-6 pt-4" data-testid="recommend">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-800">
        <Sparkles className="h-3.5 w-3.5" aria-hidden /> Picked for you
      </p>
      <h1 className="font-display text-2xl font-semibold">You're in, {user.name.split(' ')[0]}</h1>
      <p className="mb-4 text-base text-ink-muted">
        Based on your interests, your vibe and where you live, here's what to do and where to go.
      </p>

      <SectionTitle>Activities for you</SectionTitle>
      <div className="mb-5 flex flex-col gap-2">
        {top.map((r) => (
          <Card key={r.id} className="flex items-center gap-3 p-3" data-testid={`rec-activity-${r.id}`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 font-display text-lg font-semibold text-teal">
              {ACTIVITY_BY_ID[r.id].name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{ACTIVITY_BY_ID[r.id].name}</p>
              <p className="text-sm text-ink-muted">{r.reason.charAt(0).toUpperCase() + r.reason.slice(1)}</p>
            </div>
            {r.chosen && <Chip tone="teal">Your pick</Chip>}
          </Card>
        ))}
      </div>

      <SectionTitle>Places to visit</SectionTitle>
      <div className="mb-5 flex flex-col gap-3">
        {places.map((v) => {
          const added = mine.has(v.id);
          const activity = v.activities.find((a) => top.some((r) => r.id === a)) ?? v.activities[0];
          return (
            <Card key={v.id} className="overflow-hidden" data-testid={`rec-place-${v.id}`}>
              <VenuePhoto kind={v.kind} className="h-24" label={`${v.name}`} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-md font-semibold">{v.name}</p>
                    <p className="flex items-center gap-1 text-sm text-ink-muted">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {areaOf(v)} · {Math.round(venueDistance(world, me, v.id))} km away ·{' '}
                      {ACTIVITY_BY_ID[activity].name}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={added ? 'secondary' : 'primary'}
                    disabled={added}
                    icon={added ? <Check className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                    onClick={() => act({ type: 'addPlace', venueId: v.id, activity })}
                  >
                    {added ? 'Added' : 'Add'}
                  </Button>
                </div>
                {v.partner && (
                  <div className="mt-2">
                    <PartnerBadge partner={v.partner} />
                    <p className="mt-1 text-sm text-ink-soft">{v.partner.offer}</p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <p className="mb-3 text-center text-xs text-ink-muted">
        Only places within 100 km of you are shown. You can add or remove places any time.
      </p>
      <Button block className="mt-auto" onClick={() => navigate('/')} data-testid="recommend-done">
        Go to my Home
      </Button>
    </div>
  );
}
