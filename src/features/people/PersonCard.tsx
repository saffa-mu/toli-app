import { Sparkles } from 'lucide-react';
import { StageChip } from '@/components/StageChip';
import { Avatar, Card, Chip } from '@/components/ui';
import type { Match } from '@/lib/matching/score';
import { publicTags } from '@/lib/rules/publicTag';
import { scoreOf } from '@/lib/rules/verification';
import { stageOf } from '@/lib/rules/stages';
import { usePhone } from '@/features/shell/phone';
import { ConnectButton } from './ConnectButton';

export function PersonCard({
  match,
  onOpen,
  onWhy,
}: {
  match: Match;
  onOpen: () => void;
  onWhy: () => void;
}) {
  const { world } = usePhone();
  const u = world.users[match.userId];
  const tag = publicTags(world, u.id)[0];
  return (
    <Card className="p-4" data-testid={`person-card-${u.id}`}>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3 text-left"
        aria-label={`Open ${u.name}'s profile`}
      >
        <Avatar seed={u.avatar} name={u.name} size={68} score={scoreOf(world, u.id)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-display text-lg font-semibold">
              {u.name.split(' ')[0]}, {u.age}
            </span>
            <StageChip stage={stageOf(world, u.id)} />
          </div>
          {tag && <p className="mt-0.5 text-sm font-medium text-teal-800">{tag}</p>}
        </div>
      </button>
      <p className="mt-3 text-base text-ink">{match.reason}</p>
      <button
        type="button"
        onClick={onWhy}
        className="mt-1 inline-flex h-11 items-center gap-1.5 text-sm font-semibold text-teal-800"
      >
        <Sparkles className="h-4 w-4" aria-hidden /> Why this match?
      </button>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {u.monthsInCity < 24 && <Chip tone="outline">New to the city</Chip>}
        {u.languages.slice(0, 2).map((l) => (
          <Chip key={l} tone="outline">
            {l}
          </Chip>
        ))}
      </div>
      <ConnectButton userId={u.id} />
    </Card>
  );
}
