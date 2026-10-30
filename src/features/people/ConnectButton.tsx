import { Check, Clock, MessageCircle, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { connectState } from '@/lib/rules/connections';
import type { UserId } from '@/lib/types';
import { usePhone } from '@/features/shell/phone';

/** The one primary action on a person: Connect, with its state always visible. */
export function ConnectButton({ userId, block = true }: { userId: UserId; block?: boolean }) {
  const { world, me, act } = usePhone();
  const navigate = useNavigate();
  const state = connectState(world, me, userId);
  const first = world.users[userId]?.name.split(' ')[0];

  if (state === 'sent')
    return (
      <Button variant="secondary" block={block} disabled icon={<Clock className="h-4 w-4" aria-hidden />}>
        Request sent
      </Button>
    );
  if (state === 'received')
    return (
      <Button
        block={block}
        icon={<Check className="h-4 w-4" aria-hidden />}
        onClick={() => act({ type: 'respondConnect', from: userId, accept: true })}
      >
        Accept {first}
      </Button>
    );
  if (state === 'connected') {
    const conv = world.conversations.find(
      (c) => c.kind === 'dm' && c.members.includes(me) && c.members.includes(userId),
    );
    return (
      <Button
        variant="secondary"
        block={block}
        icon={<MessageCircle className="h-4 w-4" aria-hidden />}
        onClick={() => conv && navigate(`/chat/${conv.id}`)}
      >
        Open chat
      </Button>
    );
  }
  return (
    <Button
      block={block}
      icon={<UserPlus className="h-4 w-4" aria-hidden />}
      onClick={() => act({ type: 'sendConnect', to: userId })}
      data-testid={`connect-${userId}`}
    >
      Connect
    </Button>
  );
}
