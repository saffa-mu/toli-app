import { Check, Clock, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileSheet } from '@/features/people/ProfileSheet';
import { canJoinSuggested, scoreOf } from '@/lib/rules/verification';
import { LensPill } from '@/components/LensPill';
import { Avatar, Button, Card, Chip } from '@/components/ui';
import { formatDayTime } from '@/lib/clock';
import { TOLI_FORM_AT, acceptedCount } from '@/lib/rules/tolis';
import type { Toli } from '@/lib/types';
import { useDemo } from '@/store';
import { capitalise } from '@/lib/rules/publicTag';
import { usePhone } from '@/features/shell/phone';

/** A suggested group of 3-5 regulars. Forms the moment 3 accept. */
export function SuggestedToliCard({ toli, compact }: { toli: Toli; compact?: boolean }) {
  const { world, me, act } = usePhone();
  const navigate = useNavigate();
  const venue = world.venues[toli.venueId];
  const mine = toli.members.find((m) => m.userId === me);
  const accepted = acceptedCount(toli);
  const [profile, setProfile] = useState<string | null>(null);
  const trusted = canJoinSuggested(world, me);
  const formed = toli.status === 'formed' || toli.status === 'happened';

  const accept = () => {
    act({ type: 'acceptToli', toliId: toli.id });
    const after = useDemo.getState().world.tolis.find((t) => t.id === toli.id);
    if (after?.chatId) navigate(`/chat/${after.chatId}`);
  };

  return (
    <Card className="p-4" data-testid={`toli-${toli.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-800">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Suggested toli
          </p>
          <p className="font-display text-lg font-semibold">{toli.name}</p>
          <p className="text-sm text-ink-muted">
            {capitalise(toli.activity)} · Sector {venue.sector} · {formatDayTime(toli.proposedStart)}
          </p>
        </div>
        {formed && <Chip tone="teal">Formed</Chip>}
      </div>
      {!compact && (
        <LensPill framework="Visibility of system status" why="everyone can see who has accepted" />
      )}
      <ul className="mt-3 flex flex-col gap-2">
        {toli.members.map((m) => {
          const u = world.users[m.userId];
          return (
            <li key={m.userId}>
              <button
                type="button"
                className="flex w-full items-center gap-3 text-left"
                onClick={() => setProfile(m.userId)}
                data-testid={`toli-member-${m.userId}`}
                aria-label={`View ${u.name}'s profile`}
              >
              <Avatar seed={u.avatar} name={u.name} size={40} score={scoreOf(world, u.id)} />
              <span className="flex-1 font-medium underline decoration-dotted underline-offset-2">{m.userId === me ? 'You' : u.name.split(' ')[0]}</span>
              {m.state === 'accepted' ? (
                <Chip tone="teal" icon={<Check className="h-3.5 w-3.5" aria-hidden />}>
                  Accepted
                </Chip>
              ) : (
                <Chip tone="neutral" icon={<Clock className="h-3.5 w-3.5" aria-hidden />}>
                  Pending
                </Chip>
              )}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-ink-muted" data-testid="toli-progress">
        {formed
          ? `${accepted} of ${toli.members.length} accepted · group chat is open`
          : `${accepted} of ${TOLI_FORM_AT} accepted to form · ${toli.members.length} suggested`}
      </p>
      <div className="mt-3">
        {formed && toli.chatId ? (
          <Button variant="secondary" block onClick={() => navigate(`/chat/${toli.chatId}`)}>
            Open group chat
          </Button>
        ) : mine?.state === 'pending' && !trusted ? (
          <Button variant="secondary" block disabled>
            Reach Trusted (75%) to join suggested tolis
          </Button>
        ) : mine?.state === 'pending' ? (
          <Button block onClick={accept} data-testid="accept-toli">
            Accept toli
          </Button>
        ) : (
          <Button variant="secondary" block disabled>
            You accepted · waiting for {TOLI_FORM_AT - accepted} more
          </Button>
        )}
      </div>
      {!compact && <p className="mt-2 text-center text-xs text-ink-muted">You can leave a toli any time.</p>}
      <ProfileSheet userId={profile} onClose={() => setProfile(null)} />
    </Card>
  );
}
