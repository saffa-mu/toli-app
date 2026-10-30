import type { Connection, UserId, World } from '@/lib/types';

export type ConnectState = 'none' | 'sent' | 'received' | 'connected';

export function connectState(w: World, me: UserId, other: UserId): ConnectState {
  const c = w.connections.find(
    (k) =>
      k.status !== 'declined' && ((k.from === me && k.to === other) || (k.from === other && k.to === me)),
  );
  if (!c) return 'none';
  if (c.status === 'connected') return 'connected';
  return c.from === me ? 'sent' : 'received';
}

export function incomingRequests(w: World, me: UserId): Connection[] {
  return w.connections.filter((c) => c.to === me && c.status === 'pending');
}
