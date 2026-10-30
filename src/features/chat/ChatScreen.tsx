import { ArrowLeft, MoreVertical, Send, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, IconButton, cx } from '@/components/ui';
import { ICEBREAKERS } from '@/data/bots';
import { formatTime } from '@/lib/clock';
import type { Message } from '@/lib/types';
import { usePhone } from '@/features/shell/phone';
import { ReportSheet } from '@/features/safety/ReportSheet';
import { PlanCard } from '@/features/tolis/PlanCard';
import { conversationTitle } from './ChatsScreen';

function TypingBubble({ name }: { name: string }) {
  return (
    <div className="flex items-end gap-2 animate-fade-up" aria-live="polite" data-testid="typing">
      <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-soft">
        <span className="sr-only">{name} is typing</span>
        <span className="flex gap-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="typing-dot h-2 w-2 rounded-full bg-ink-muted"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

export function ChatScreen() {
  const { convId = '' } = useParams();
  const { world, me, act } = usePhone();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const conv = world.conversations.find((c) => c.id === convId && c.members.includes(me));
  const count = conv?.messages.length ?? 0;
  const typingId = world.typing[convId];

  useEffect(() => {
    if (conv && (conv.readUpTo[me] ?? 0) < conv.messages.length) act({ type: 'markRead', convId });
  }, [conv, me, act, convId]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [count, typingId]);

  if (!conv)
    return (
      <div className="p-6 text-center">
        <p className="mb-4">This chat is no longer available.</p>
        <Button onClick={() => navigate('/chats')}>Back to chats</Button>
      </div>
    );

  const other = conv.kind === 'dm' ? conv.members.find((m) => m !== me) : undefined;
  const otherUser = other ? world.users[other] : undefined;
  const send = (t: string) => {
    if (!t.trim()) return;
    act({ type: 'sendMessage', convId, text: t });
    setText('');
  };
  const last = conv.messages.at(-1);
  const seenByOther =
    conv.kind === 'dm' && last?.authorId === me && other
      ? (conv.readUpTo[other] ?? 0) >= conv.messages.length
      : false;
  const showIcebreakers = !conv.messages.some((m) => m.authorId === me && m.kind === 'text');

  const renderMessage = (m: Message) => {
    if (m.kind === 'plan') {
      const plan = world.plans.find((p) => p.id === m.planId);
      return plan ? (
        <div key={m.id} className="animate-fade-up">
          <PlanCard plan={plan} />
        </div>
      ) : null;
    }
    if (m.kind === 'system')
      return (
        <p
          key={m.id}
          className="my-1 animate-fade-up text-center text-xs font-medium text-ink-muted"
          data-testid="system-msg"
        >
          {m.text}
        </p>
      );
    const mine = m.authorId === me;
    const author = world.users[m.authorId];
    return (
      <div key={m.id} className={cx('flex animate-fade-up items-end gap-2', mine && 'justify-end')}>
        {!mine && conv.kind === 'group' && author && (
          <Avatar seed={author.avatar} name={author.name} size={28} />
        )}
        <div
          className={cx(
            'max-w-[78%] rounded-2xl px-3.5 py-2 shadow-soft',
            mine ? 'rounded-br-md bg-teal text-white' : 'rounded-bl-md bg-white text-ink',
          )}
        >
          {!mine && conv.kind === 'group' && author && (
            <p className="text-xs font-semibold text-teal-800">{author.name.split(' ')[0]}</p>
          )}
          <p className="text-base">{m.text}</p>
          <p className={cx('mt-0.5 text-right text-[11px]', mine ? 'text-teal-50' : 'text-ink-muted')}>
            {formatTime(m.at)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col" data-testid="chat-screen">
      <header className="flex shrink-0 items-center gap-2 border-b border-hairline bg-white px-2 py-2">
        <IconButton label="Back to chats" onClick={() => navigate('/chats')}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        {otherUser ? (
          <Avatar seed={otherUser.avatar} name={otherUser.name} size={36} />
        ) : (
          <span className="flex -space-x-2">
            {conv.members.slice(0, 4).map((id) => (
              <Avatar
                key={id}
                seed={world.users[id].avatar}
                name={world.users[id].name}
                size={28}
                className="ring-2 ring-white"
              />
            ))}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{conversationTitle(world, conv, me)}</p>
          <p className="text-xs text-ink-muted">
            {conv.kind === 'group'
              ? `${conv.members.length} members`
              : typingId === other
                ? 'typing…'
                : 'Connected on Toli'}
          </p>
        </div>
        {otherUser && (
          <div className="relative">
            <IconButton label="Chat options" onClick={() => setMenu((v) => !v)} aria-expanded={menu}>
              <MoreVertical className="h-5 w-5" />
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
        )}
        {!otherUser && <Users className="mr-3 h-5 w-5 text-ink-muted" aria-hidden />}
      </header>
      <div className="flex shrink-0 items-center gap-2 bg-teal-50 px-4 py-2 text-sm text-teal-900">
        <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
        <span className="flex-1">First meetups are in groups, in public places.</span>
        {conv.kind === 'dm' && (
          <button
            type="button"
            className="h-9 shrink-0 font-semibold underline"
            onClick={() => navigate('/tolis?tab=host')}
          >
            Suggest a toli
          </button>
        )}
      </div>
      <div
        className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-3"
        data-testid="messages"
      >
        {conv.messages.map(renderMessage)}
        {seenByOther && <p className="text-right text-xs text-ink-muted">Seen</p>}
        {typingId && typingId !== me && <TypingBubble name={world.users[typingId]?.name ?? ''} />}
        <div ref={bottom} />
      </div>
      <div className="shrink-0 border-t border-hairline bg-white px-3 pb-3 pt-2">
        {showIcebreakers && (
          <div className="mb-2 flex flex-wrap gap-2" aria-label="Icebreakers">
            {ICEBREAKERS.map((ib) => (
              <button
                key={ib}
                type="button"
                onClick={() => send(ib)}
                className="h-11 rounded-full border border-teal-200 bg-teal-50 px-3.5 text-sm font-medium text-teal-800 hover:bg-teal-100"
              >
                {ib}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <label className="sr-only" htmlFor={`msg-${convId}`}>
            Message
          </label>
          <input
            id={`msg-${convId}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message"
            autoComplete="off"
            className="h-12 min-w-0 flex-1 rounded-full border border-hairline bg-paper px-4 text-base"
          />
          <button
            type="submit"
            aria-label="Send"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal text-white disabled:bg-teal-200"
            disabled={!text.trim()}
          >
            <Send className="h-5 w-5" aria-hidden />
          </button>
        </form>
      </div>
      <ReportSheet
        userId={report ? (other ?? null) : null}
        onClose={() => setReport(false)}
        onDone={() => navigate('/chats')}
      />
    </div>
  );
}
