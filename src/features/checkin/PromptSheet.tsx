import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LensPill } from '@/components/LensPill';
import { Button, Sheet } from '@/components/ui';
import { isVerifiedRegular } from '@/lib/rules/regular';
import { usePhone } from '@/features/shell/phone';

/** The smart prompt: Toli asks, it never assumes. "Not now" stores nothing. */
export function PromptSheet() {
  const { world, me, act, surface } = usePhone();
  const navigate = useNavigate();
  const prompt = world.prompt?.userId === me && surface === 'phone' ? world.prompt : null;
  const venue = prompt ? world.venues[prompt.venueId] : undefined;

  const yes = () => {
    if (!prompt) return;
    const was = isVerifiedRegular(world, me, prompt.venueId);
    act({ type: 'logVisit', venueId: prompt.venueId });
    navigate(was ? '/checkin' : `/celebrate/${prompt.venueId}`);
  };

  return (
    <Sheet
      open={!!prompt}
      onClose={() => act({ type: 'dismissPrompt' })}
      title="Log this visit?"
      testId="prompt-sheet"
      footer={
        <div className="flex flex-col gap-2">
          <Button variant="accent" block onClick={yes} data-testid="prompt-yes">
            Yes, log it
          </Button>
          <Button variant="ghost" block onClick={() => act({ type: 'dismissPrompt' })}>
            Not now
          </Button>
        </div>
      }
    >
      {venue && prompt && (
        <div>
          <div className="flex items-center gap-3 rounded-card bg-teal-50 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal text-white">
              <MapPin className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-base text-ink">
              You've been at <strong>{venue.short}</strong> for {prompt.minutes} minutes.
            </p>
          </div>
          <LensPill framework="Win-Win" why="less friction for you and more privacy" />
          <p className="mt-3 text-sm text-ink-muted">
            Nothing is logged without your yes. "Not now" stores nothing, and we never track you in the
            background.
          </p>
        </div>
      )}
    </Sheet>
  );
}
