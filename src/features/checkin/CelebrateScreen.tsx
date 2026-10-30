import { Eye } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { LensPill } from '@/components/LensPill';
import { Button, Card, Confetti, RegularBadge } from '@/components/ui';
import { REGULAR_VISITS } from '@/lib/rules/regular';
import { publicTagFor } from '@/lib/rules/publicTag';
import { usePhone } from '@/features/shell/phone';

/** Third visit in 30 days: the Verified Regular moment, and exactly what others will see. */
export function CelebrateScreen() {
  const { venueId = '' } = useParams();
  const { world, user } = usePhone();
  const navigate = useNavigate();
  const venue = world.venues[venueId];
  if (!venue) return null;
  const activity = user.routines.find((r) => r.venueId === venueId)?.activity ?? venue.activities[0];
  return (
    <div
      className="relative flex min-h-full flex-col items-center px-6 pb-8 pt-10 text-center"
      data-testid="celebrate"
    >
      <Confetti />
      <div className="animate-pop">
        <RegularBadge size="lg" />
      </div>
      <p className="mt-3 text-base text-ink-soft">
        {REGULAR_VISITS} visits to {venue.short} in 30 days. You're officially one of its regulars.
      </p>
      <LensPill framework="Kano" why="delighter: a badge you earn by showing up" />
      <Card className="mt-6 w-full p-4 text-left">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-muted">
          <Eye className="h-4 w-4" aria-hidden /> What others see
        </p>
        <div className="flex items-center gap-3">
          <span
            className="rounded-full bg-teal-50 px-3 py-1.5 font-semibold text-teal-800"
            data-testid="public-tag"
          >
            {publicTagFor(world, venueId, activity)}
          </span>
        </div>
        <p className="mt-3 text-sm text-ink-muted">
          Never the court's name, your days or your times. The exact venue is shown only inside a plan you've
          joined.
        </p>
      </Card>
      <div className="mt-auto w-full pt-6">
        <Button variant="primary" block onClick={() => navigate('/')}>
          See who plays here
        </Button>
      </div>
    </div>
  );
}
