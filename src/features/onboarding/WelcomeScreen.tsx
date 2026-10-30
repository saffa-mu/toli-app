import { useNavigate } from 'react-router-dom';
import { WelcomeScene } from '@/components/illustrations/WelcomeScene';
import { Button } from '@/components/ui';
import { TAGLINE } from '@/lib/constants';

export function WelcomeScreen() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-full flex-col px-6 pb-8 pt-6" data-testid="welcome">
      <WelcomeScene />
      <h1 className="mt-6 font-display text-[44px] font-semibold leading-none text-teal">Toli</h1>
      <p className="mt-3 self-start rounded-btn bg-marigold px-3 py-1.5 font-display text-xl font-semibold text-ink">
        {TAGLINE}
      </p>
      <p className="mt-4 text-md text-ink-soft">
        Meet people who share your interests at the places you already go: your regular court, park, pool or
        studio. Toli also introduces you to like-minded strangers who visit the same places, through
        verified profiles, small group plans and safety built in.
      </p>
      <div className="mt-auto pt-6">
        <Button block onClick={() => navigate('/signup/1')} data-testid="get-started">
          Get started
        </Button>
      </div>
    </div>
  );
}
