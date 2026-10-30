import { MapPin, Radar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, ProgressRing, RegularBadge, SectionTitle } from '@/components/ui';
import { MINUTE } from '@/lib/clock';
import { REGULAR_VISITS, isVerifiedRegular, placesOf, visitCount } from '@/lib/rules/regular';
import { usePhone } from '@/features/shell/phone';

/** Check-ins are mobile-only: they need your location. */
export function CheckinScreen() {
  const { world, me, user, act, idx } = usePhone();
  const navigate = useNavigate();

  const places = placesOf(world, me);
  const checkIn = (venueId: string) => {
    const was = isVerifiedRegular(world, me, venueId);
    const recent = world.visits.some(
      (v) => v.userId === me && v.venueId === venueId && world.clock - v.at < 60 * MINUTE,
    );
    act({ type: 'logVisit', venueId });
    if (!was && !recent && visitCount(world, me, venueId) + 1 >= REGULAR_VISITS)
      navigate(`/celebrate/${venueId}`);
  };

  return (
    <div className="px-4 pb-6 pt-3" data-phone={idx}>
      <h1 className="font-display text-2xl font-semibold">Check in</h1>
      <p className="mb-4 text-sm text-ink-muted">
        2 visits in 30 days at one place makes you a Verified Regular.
      </p>
      <SectionTitle>Your places</SectionTitle>
      <div className="mb-6 flex flex-col gap-3">
        {places.map((venueId) => {
          const v = world.venues[venueId];
          const n = visitCount(world, me, venueId);
          const here = world.visits.some(
            (x) => x.userId === me && x.venueId === venueId && world.clock - x.at < 60 * MINUTE,
          );
          return (
            <Card key={venueId} className="flex items-center gap-3 p-4">
              <ProgressRing value={n} max={REGULAR_VISITS} size={56} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{v.name}</p>
                <p className="text-sm text-ink-muted">Sector {v.sector}</p>
                {n >= REGULAR_VISITS && <RegularBadge className="mt-1" />}
              </div>
              <Button
                size="sm"
                variant={here ? 'secondary' : 'primary'}
                disabled={here}
                onClick={() => checkIn(venueId)}
                icon={<MapPin className="h-4 w-4" aria-hidden />}
              >
                {here ? 'Logged' : "I'm here"}
              </Button>
            </Card>
          );
        })}
        {places.length === 0 && (
          <Card tone="mist" className="p-4 text-sm text-ink-soft">
            Add a place from Me to start checking in.
          </Card>
        )}
      </div>
      <SectionTitle>Smart check-in</SectionTitle>
      <Card tone="mist" className="p-4">
        <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3">
          <span className="flex items-center gap-3">
            <Radar className="h-5 w-5 text-teal" aria-hidden />
            <span className="font-semibold">Ask me when I'm at my places</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            className="h-6 w-6 accent-[#0F766E]"
            checked={user.prefs.smartCheckin}
            onChange={(e) => act({ type: 'setPrefs', prefs: { smartCheckin: e.target.checked } })}
          />
        </label>
        <p className="mt-2 text-sm text-ink-soft">
          {user.prefs.smartCheckin
            ? 'When you spend 10 minutes at one of your places, Toli asks "Log this visit?". Nothing is logged without your yes.'
            : 'Smart check-in is off. Nothing is read in the background; use "I\'m here" when you arrive.'}
        </p>
      </Card>
    </div>
  );
}
