import { ArrowLeft, Lock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LensPill } from '@/components/LensPill';
import { Button, EmptyState, IconButton } from '@/components/ui';
import { peopleFor } from '@/lib/matching/score';
import { usePhone } from '@/features/shell/phone';
import { PersonCard } from './PersonCard';
import { ProfileSheet } from './ProfileSheet';
import { WhySheet } from './WhySheet';

export function PeopleScreen() {
  const { world, me } = usePhone();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<string | null>(null);
  const [why, setWhy] = useState<string | null>(null);
  const people = peopleFor(world, me);
  const [lensId, setLensId] = useState<string>('regulars');
  const lens = people.lenses.find((l) => l.id === lensId) ?? people.lenses[1];

  return (
    <div className="px-4 pb-6 pt-2">
      <header className="mb-3 flex items-center gap-1">
        <IconButton label="Back" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <div>
          <h1 className="font-display text-2xl font-semibold">People for you</h1>
          <p className="text-sm text-ink-muted">Up to 5 a week, refreshed on Mondays.</p>
        </div>
      </header>
      <div className="mb-3 flex gap-2 overflow-x-auto" role="tablist" data-testid="lenses">
        {people.lenses.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={lens.id === l.id}
            onClick={() => setLensId(l.id)}
            data-testid={`lens-${l.id}`}
            className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold ${
              lens.id === l.id ? 'border-teal bg-teal text-white' : 'border-hairline bg-white'
            }`}
          >
            {!l.unlocked && <Lock className="h-3.5 w-3.5" aria-hidden />}
            {l.label}
          </button>
        ))}
      </div>
      {!lens.unlocked && lens.id !== 'regulars' ? (
        <EmptyState
          icon={<Lock className="h-6 w-6" aria-hidden />}
          title={`${lens.label} unlocks at ${lens.minScore}%`}
          body={`${lens.blurb}. You're at ${people.score}%. Boost your verification to unlock it.`}
          action={<Button onClick={() => navigate('/verify')}>See my checklist</Button>}
        />
      ) : lens.id !== 'regulars' ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-muted">{lens.blurb}.</p>
          {lens.matches.length === 0 && <p className="text-sm text-ink-muted">No one new here yet.</p>}
          {lens.matches.map((m) => (
            <PersonCard key={m.userId} match={m} onOpen={() => setProfile(m.userId)} onWhy={() => setWhy(m.userId)} />
          ))}
        </div>
      ) : people.locked ? (
        <EmptyState
          icon={<Lock className="h-6 w-6" aria-hidden />}
          title="Unlocks when you're a Regular"
          body="Check in 2 times in 30 days at one place and reach 75% verified. We only introduce verified regulars."
          action={<Button onClick={() => navigate('/checkin')}>Go to check in</Button>}
        />
      ) : people.matches.length === 0 ? (
        <EmptyState
          icon={<Lock className="h-6 w-6" aria-hidden />}
          title="That's everyone for this week"
          body="New people arrive on Monday. Meanwhile, see what tolis are on near you."
          action={<Button onClick={() => navigate('/tolis')}>See tolis</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <LensPill framework="Von Restorff" why="one clear primary action per card" />
          {people.matches.map((m) => (
            <PersonCard
              key={m.userId}
              match={m}
              onOpen={() => setProfile(m.userId)}
              onWhy={() => setWhy(m.userId)}
            />
          ))}
          <p className="mt-2 text-center text-sm text-ink-muted">Toli suggests, you decide.</p>
        </div>
      )}
      <ProfileSheet userId={profile} onClose={() => setProfile(null)} />
      <WhySheet userId={why} onClose={() => setWhy(null)} />
    </div>
  );
}
