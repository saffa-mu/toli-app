import { ArrowLeft, EyeOff, Flag, MapPin, ShieldCheck, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LensPill } from '@/components/LensPill';
import { Card, Chip, IconButton } from '@/components/ui';
import { usePhone } from '@/features/shell/phone';

function Row({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal">
        {icon}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-ink-soft">{body}</p>
      </div>
    </div>
  );
}

/** Safety center: what Toli does by default, explained plainly. */
export function SafetyScreen() {
  const { user, act } = usePhone();
  const navigate = useNavigate();
  return (
    <div className="px-4 pb-8 pt-2" data-testid="safety-center">
      <header className="mb-3 flex items-center gap-1">
        <IconButton label="Back" onClick={() => navigate('/me')}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <h1 className="font-display text-2xl font-semibold">Safety center</h1>
      </header>
      <LensPill framework="Kano: basic need" why="safety is non-negotiable, not a feature" />

      <Card className="mb-4 p-4" data-testid="coarse-location">
        <h2 className="mb-2 font-display text-lg font-semibold">Your location stays coarse</h2>
        <svg
          viewBox="0 0 300 110"
          className="mb-2 h-auto w-full"
          role="img"
          aria-label="Others see a neighbourhood circle, not your exact spot"
        >
          <rect width="300" height="110" rx="14" fill="#F3F4F6" />
          <circle cx="90" cy="55" r="38" fill="#0F766E" opacity="0.14" />
          <circle cx="90" cy="55" r="38" fill="none" stroke="#0F766E" strokeDasharray="4 5" />
          <text x="90" y="59" textAnchor="middle" fontSize="12" fontFamily="Inter" fill="#0B5C56">
            Sector 56
          </text>
          <text x="90" y="104" textAnchor="middle" fontSize="11" fontFamily="Inter" fill="#5F6B76">
            What others see
          </text>
          <circle cx="215" cy="50" r="9" fill="#0F766E" />
          <circle cx="215" cy="50" r="3.5" fill="#FFFFFF" />
          <text x="215" y="80" textAnchor="middle" fontSize="11" fontFamily="Inter" fill="#5F6B76">
            Exact court
          </text>
          <text x="215" y="96" textAnchor="middle" fontSize="11" fontFamily="Inter" fill="#5F6B76">
            only inside a plan you joined
          </text>
        </svg>
        <p className="text-sm text-ink-soft">
          Profiles show only your activity and neighbourhood, like "Regular · badminton · Sector 56". Never
          your exact venue, days or times. There is no background tracking.
        </p>
      </Card>

      {user.gender === 'F' && (
        <Card tone="teal" className="mb-4 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Women-only mode</h2>
            {user.prefs.womenOnly && <Chip tone="teal">Women-only on</Chip>}
          </div>
          <ul className="mt-2 list-disc pl-5 text-sm text-ink">
            <li>People for you shows only women.</li>
            <li>Your profile is hidden from men.</li>
            <li>You see women-only plans and plans hosted by women.</li>
          </ul>
          <label className="mt-3 flex min-h-[48px] cursor-pointer items-center justify-between rounded-btn bg-white px-4">
            <span className="font-medium">Women-only mode</span>
            <input
              type="checkbox"
              role="switch"
              className="h-6 w-6 accent-[#0F766E]"
              checked={user.prefs.womenOnly}
              onChange={(e) => act({ type: 'setPrefs', prefs: { womenOnly: e.target.checked } })}
            />
          </label>
        </Card>
      )}

      <Card className="divide-y divide-hairline px-4">
        <Row
          icon={<Users className="h-5 w-5" aria-hidden />}
          title="Groups first"
          body="First meetups are in groups, in public places."
        />
        <Row
          icon={<MapPin className="h-5 w-5" aria-hidden />}
          title="Venue only for members"
          body="The exact venue is shown only inside a plan you've joined."
        />
        <Row
          icon={<Flag className="h-5 w-5" aria-hidden />}
          title="Report and block, always one tap away"
          body="Every profile and chat has it. Our team reviews every report within 24 hours. Two open reports hide a person from discovery."
        />
        <Row
          icon={<EyeOff className="h-5 w-5" aria-hidden />}
          title="Private meet-again picks"
          body="Only mutual picks are revealed. Nobody ever learns who didn't pick them."
        />
        <Row
          icon={<ShieldCheck className="h-5 w-5" aria-hidden />}
          title="Everyone is verified"
          body="Phone OTP, a live selfie check and 18+ before anyone can see you."
        />
      </Card>
    </div>
  );
}
