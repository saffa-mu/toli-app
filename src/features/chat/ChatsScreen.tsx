import { ChevronDown, MessageCircle, ShieldCheck, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, EmptyState, SectionTitle, cx } from '@/components/ui';
import { formatRelative } from '@/lib/clock';
import { incomingRequests } from '@/lib/rules/connections';
import { scoreOf } from '@/lib/rules/verification';
import { isHiddenBetween } from '@/lib/rules/safety';
import type { Conversation, UserId, World } from '@/lib/types';
import { useDemo } from '@/store';
import { usePhone } from '@/features/shell/phone';
import { ProfileSheet } from '@/features/people/ProfileSheet';
import { ReportSheet } from '@/features/safety/ReportSheet';

export function visibleConversations(w: World, me: UserId): Conversation[] {
  return w.conversations
    .filter((c) => c.members.includes(me))
    .filter((c) => c.kind === 'group' || !c.members.some((m) => m !== me && isHiddenBetween(w, me, m)))
    .sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0));
}

export function unreadCount(c: Conversation, me: UserId): number {
  return c.messages.slice(c.readUpTo[me] ?? 0).filter((m) => m.authorId !== me).length;
}

export function unreadTotal(w: World, me: UserId): number {
  const visible = visibleConversations(w, me).reduce((s, c) => s + unreadCount(c, me), 0);
  return visible + incomingRequests(w, me).filter((r) => !isHiddenBetween(w, me, r.from)).length;
}

export function conversationTitle(w: World, c: Conversation, me: UserId): string {
  if (c.kind === 'group') return c.title ?? 'Group';
  const other = c.members.find((m) => m !== me);
  return other ? w.users[other].name : 'Chat';
}

interface RequestCardProps {
  from: UserId;
  note?: string;
  /** Filtered by women-only mode: offer report and profile instead of accept. */
  muted?: boolean;
  onProfile: () => void;
  onReport: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

function RequestCard({ from, note, muted, onProfile, onReport, onAccept, onDecline }: RequestCardProps) {
  const { world } = usePhone();
  const u = world.users[from];
  return (
    <Card className={cx('p-4', muted && 'border-dashed')} data-testid={`request-${from}`}>
      <button type="button" className="flex w-full items-center gap-3 text-left" onClick={onProfile}>
        <Avatar seed={u.avatar} name={u.name} size={48} score={scoreOf(world, from)} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{u.name.split(' ')[0]} wants to connect</p>
          <p className="text-sm text-ink-muted">Tap to see their profile</p>
        </div>
      </button>
      {note && <p className="mt-3 rounded-btn bg-mist p-3 text-sm text-ink">"{note}"</p>}
      <div className="mt-3 flex gap-2">
        {muted ? (
          <>
            <Button
              variant="danger"
              size="sm"
              className="flex-1"
              onClick={onReport}
              data-testid={`report-${from}`}
            >
              Report or block
            </Button>
            <Button variant="secondary" size="sm" className="flex-1" onClick={onProfile}>
              View profile
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" className="flex-1" onClick={onAccept} data-testid={`accept-${from}`}>
              Accept
            </Button>
            <Button size="sm" variant="secondary" className="flex-1" onClick={onDecline}>
              Decline
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

export function ChatsScreen() {
  const { world, me, user, act } = usePhone();
  const navigate = useNavigate();
  const [showFiltered, setShowFiltered] = useState(false);
  const [profile, setProfile] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);

  const requests = incomingRequests(world, me).filter((r) => !isHiddenBetween(world, me, r.from));
  const filteredOut = (from: UserId) => user.prefs.womenOnly && world.users[from].gender !== 'F';
  const shown = requests.filter((r) => !filteredOut(r.from));
  const filtered = requests.filter((r) => filteredOut(r.from));
  const convs = visibleConversations(world, me);
  const sent = world.connections.filter((c) => c.from === me && c.status === 'pending');

  const accept = (from: UserId) => {
    act({ type: 'respondConnect', from, accept: true });
    // Dispatch is synchronous, so the new chat already exists in the store.
    const conv = useDemo
      .getState()
      .world.conversations.find((c) => c.kind === 'dm' && c.members.includes(me) && c.members.includes(from));
    if (conv) navigate(`/chat/${conv.id}`);
  };

  return (
    <div className="px-4 pb-6 pt-3">
      <h1 className="mb-3 font-display text-2xl font-semibold">Chats</h1>
      <section className="mb-5" aria-labelledby="req-h" data-testid="pending-requests">
        <SectionTitle>
          <span id="req-h">Pending connection requests</span>
        </SectionTitle>
        {shown.length === 0 && filtered.length === 0 && sent.length === 0 && (
          <Card tone="mist" className="p-3 text-sm text-ink-muted">
            No pending requests. When someone asks to connect, or you ask someone, it shows here.
          </Card>
        )}
        {sent.length > 0 && (
          <div className="mb-3 flex flex-col gap-2" data-testid="sent-requests">
            <p className="text-sm font-semibold text-ink-muted">Sent by you · waiting</p>
            {sent.map((r) => (
              <Card key={r.id} className="flex items-center gap-3 p-3">
                <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setProfile(r.to)}>
                  <Avatar seed={world.users[r.to].avatar} name={world.users[r.to].name} size={44} score={scoreOf(world, r.to)} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{world.users[r.to].name}</span>
                    <span className="block text-sm text-ink-muted">Waiting for them to accept</span>
                  </span>
                </button>
                <Button size="sm" variant="secondary" onClick={() => act({ type: 'cancelConnect', to: r.to })}>
                  Withdraw
                </Button>
              </Card>
            ))}
          </div>
        )}
        {(shown.length > 0 || filtered.length > 0) && <p className="mb-2 text-sm font-semibold text-ink-muted">Waiting for you</p>}
        {(shown.length > 0 || filtered.length > 0) && (
          <div className="flex flex-col gap-3">
            {shown.map((r) => (
              <RequestCard
                key={r.id}
                from={r.from}
                note={r.note}
                onProfile={() => setProfile(r.from)}
                onReport={() => setReport(r.from)}
                onAccept={() => accept(r.from)}
                onDecline={() => act({ type: 'respondConnect', from: r.from, accept: false })}
              />
            ))}
            {filtered.length > 0 && (
              <div>
                <button
                  type="button"
                  className="flex h-12 w-full items-center gap-2 rounded-btn bg-teal-50 px-4 text-left text-sm font-semibold text-teal-800"
                  onClick={() => setShowFiltered((v) => !v)}
                  aria-expanded={showFiltered}
                  data-testid="filtered-requests"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  <span className="flex-1">Filtered by women-only mode · {filtered.length}</span>
                  <ChevronDown
                    className={cx('h-4 w-4 transition-transform', showFiltered && 'rotate-180')}
                    aria-hidden
                  />
                </button>
                {showFiltered && (
                  <div className="mt-2 flex flex-col gap-2">
                    <p className="px-1 text-sm text-ink-muted">
                      These came from men before you turned on women-only mode. They can't see you now.
                    </p>
                    {filtered.map((r) => (
                      <RequestCard
                        key={r.id}
                        from={r.from}
                        note={r.note}
                        muted
                        onProfile={() => setProfile(r.from)}
                        onReport={() => setReport(r.from)}
                        onAccept={() => accept(r.from)}
                        onDecline={() => act({ type: 'respondConnect', from: r.from, accept: false })}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
      {convs.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-6 w-6" aria-hidden />}
          title="No chats yet, and that's okay"
          body="Chats open when you and someone both say yes, or when a toli forms. Start with a check-in at your place."
          action={<Button onClick={() => navigate('/checkin')}>Go to check in</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {convs.map((c) => {
            const last = c.messages.at(-1);
            const unread = unreadCount(c, me);
            const other = c.kind === 'dm' ? world.users[c.members.find((m) => m !== me) ?? ''] : undefined;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/chat/${c.id}`)}
                  className="flex w-full items-center gap-3 rounded-card bg-white p-3 text-left shadow-soft hover:bg-teal-50"
                  data-testid={`conv-${c.id}`}
                >
                  {other ? (
                    <Avatar seed={other.avatar} name={other.name} size={48} />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal">
                      <Users className="h-5 w-5" aria-hidden />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold">{conversationTitle(world, c, me)}</span>
                      {last && (
                        <span className="shrink-0 text-xs text-ink-muted">
                          {formatRelative(last.at, world.clock)}
                        </span>
                      )}
                    </div>
                    <p
                      className={cx('truncate text-sm', unread ? 'font-semibold text-ink' : 'text-ink-muted')}
                    >
                      {last ? (last.kind === 'plan' ? `Plan: ${last.text}` : last.text) : 'Say hi'}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="min-w-[22px] rounded-full bg-teal px-1.5 text-center text-xs font-semibold leading-[22px] text-white">
                      {unread}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <ProfileSheet userId={profile} onClose={() => setProfile(null)} />
      <ReportSheet userId={report} onClose={() => setReport(null)} onDone={() => setReport(null)} />
    </div>
  );
}
