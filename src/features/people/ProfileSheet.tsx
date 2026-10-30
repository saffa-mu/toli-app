import { MoreHorizontal, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { LensPill } from '@/components/LensPill';
import { StageChip } from '@/components/StageChip';
import { Avatar, Chip, IconButton, Sheet } from '@/components/ui';
import { sharedInterests, isNewToCity } from '@/lib/matching/score';
import { publicTags } from '@/lib/rules/publicTag';
import { LevelChip } from '@/components/LevelChip';
import { scoreOf } from '@/lib/rules/verification';
import { stageOf } from '@/lib/rules/stages';
import type { UserId } from '@/lib/types';
import { usePhone } from '@/features/shell/phone';
import { ReportSheet } from '@/features/safety/ReportSheet';
import { ConnectButton } from './ConnectButton';
import { WhySheet } from './WhySheet';

const VIBES = [
  ['Planner', 'Go with the flow', 'Spontaneous'],
  ['Quiet chats', 'Bit of both', 'Big group energy'],
  ['Chai', 'Either', 'Coffee'],
  ['Mornings', 'Any time', 'Evenings'],
];

/** Profile: public tags only. Never the exact venue, days or times. */
export function ProfileSheet({ userId, onClose }: { userId: UserId | null; onClose: () => void }) {
  const { world, me, user: viewer } = usePhone();
  const [why, setWhy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const u = userId ? world.users[userId] : undefined;

  return (
    <>
      <Sheet
        open={!!u && !why && !report}
        onClose={onClose}
        title={u ? u.name.split(' ')[0] : ''}
        testId="profile-sheet"
        footer={u ? <ConnectButton userId={u.id} /> : undefined}
      >
        {u && (
          <div>
            <div className="flex items-start gap-4">
              <Avatar seed={u.avatar} name={u.name} size={88} score={scoreOf(world, u.id)} />
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-semibold">
                  {u.name}, {u.age}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <StageChip stage={stageOf(world, u.id)} />
                  <LevelChip score={scoreOf(world, u.id)} />
                  {isNewToCity(u) && <Chip tone="outline">New to the city</Chip>}
                </div>
              </div>
              <div className="relative">
                <IconButton label="More options" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
                  <MoreHorizontal className="h-5 w-5" />
                </IconButton>
                {menu && (
                  <div className="absolute right-0 top-12 z-10 w-44 overflow-hidden rounded-btn border border-hairline bg-white shadow-lift">
                    <button
                      type="button"
                      className="block h-11 w-full px-4 text-left text-sm font-semibold text-coral-700 hover:bg-coral-50"
                      onClick={() => {
                        setMenu(false);
                        setReport(true);
                      }}
                    >
                      Report or block
                    </button>
                  </div>
                )}
              </div>
            </div>
            <LensPill framework="Kano: basic need" why="report and block are always one tap away" />
            <p className="mt-3 text-base text-ink">{u.bio}</p>
            <h3 className="mb-1.5 mt-4 text-sm font-semibold text-ink-muted">Where you might see them</h3>
            <div className="flex flex-wrap gap-1.5">
              {publicTags(world, u.id).map((t) => (
                <Chip key={t} tone="teal">
                  {t}
                </Chip>
              ))}
            </div>
            <h3 className="mb-1.5 mt-4 text-sm font-semibold text-ink-muted">Speaks</h3>
            <p className="text-base">{u.languages.join(', ')}</p>
            <h3 className="mb-1.5 mt-4 text-sm font-semibold text-ink-muted">Vibe</h3>
            <div className="flex flex-wrap gap-1.5">
              {u.quiz.map((a, i) => (
                <Chip key={i} tone="neutral">
                  {VIBES[i][a]}
                </Chip>
              ))}
            </div>
            {u.id !== me && viewer && (
              <>
                <h3 className="mb-1.5 mt-4 text-sm font-semibold text-ink-muted">You both</h3>
                <div className="flex flex-wrap gap-1.5">
                  {sharedInterests(viewer, u).map((i) => (
                    <Chip key={i} tone="outline">
                      {i}
                    </Chip>
                  ))}
                  {viewer.hometown === u.hometown && <Chip tone="outline">From {u.hometown}</Chip>}
                  {u.languages
                    .filter((l) => viewer.languages.includes(l))
                    .map((l) => (
                      <Chip key={l} tone="outline">
                        {l}
                      </Chip>
                    ))}
                </div>
                <button
                  type="button"
                  onClick={() => setWhy(true)}
                  className="mt-3 inline-flex h-11 items-center gap-1.5 text-sm font-semibold text-teal-800"
                  data-testid="open-why"
                >
                  <Sparkles className="h-4 w-4" aria-hidden /> Why this match?
                </button>
              </>
            )}
            <p className="mt-3 text-xs text-ink-muted">
              Toli never shows exact places, days or times on profiles. Photos are stripped of location data.
            </p>
          </div>
        )}
      </Sheet>
      <WhySheet userId={why ? userId : null} onClose={() => setWhy(false)} />
      <ReportSheet
        userId={report ? userId : null}
        onClose={() => setReport(false)}
        onDone={() => {
          setReport(false);
          onClose();
        }}
      />
    </>
  );
}
