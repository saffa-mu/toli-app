import { ChevronRight } from 'lucide-react';
import { StageChip } from '@/components/StageChip';
import { Avatar } from '@/components/ui';
import type { Match } from '@/lib/matching/score';
import { scoreOf } from '@/lib/rules/verification';
import { stageOf } from '@/lib/rules/stages';
import { usePhone } from '@/features/shell/phone';

/** Compact person row for Home. Tapping opens the profile sheet. */
export function PersonRow({ match, onOpen }: { match: Match; onOpen: () => void }) {
  const { world } = usePhone();
  const u = world.users[match.userId];
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid={`person-row-${u.id}`}
      className="flex w-full items-center gap-3 rounded-card border border-hairline bg-white p-3 text-left shadow-soft transition-colors hover:bg-teal-50"
    >
      <Avatar seed={u.avatar} name={u.name} size={52} score={scoreOf(world, u.id)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {u.name.split(' ')[0]}, {u.age}
          </span>
          <StageChip stage={stageOf(world, u.id)} />
        </div>
        <p className="text-sm text-ink-muted">{match.reason}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
    </button>
  );
}
