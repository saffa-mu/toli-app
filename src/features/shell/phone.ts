import { createContext, useCallback, useContext } from 'react';
import { useDemo } from '@/store';
import type { UserId } from '@/lib/types';
import type { Action } from '@/lib/world/actions';

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type PhoneAction = DistributiveOmit<Action, 'actAs'>;

export interface PhoneCtx {
  idx: 0 | 1;
  me: UserId;
  /** 'phone' for the mobile app, 'web' for the wide web layout. */
  surface: 'phone' | 'web';
  /** Web mode only: room for the right-hand preview column. */
  wide?: boolean;
}

export const PhoneContext = createContext<PhoneCtx>({ idx: 0, me: 'rohan', surface: 'phone' });

/** Everything a screen needs: who "I" am on this phone, the world, and an act() bound to me. */
export function usePhone() {
  const ctx = useContext(PhoneContext);
  const world = useDemo((s) => s.world);
  const dispatch = useDemo((s) => s.dispatch);
  const act = useCallback(
    (a: PhoneAction) => dispatch({ ...a, actAs: ctx.me } as Action),
    [dispatch, ctx.me],
  );
  return { ...ctx, world, act, user: world.users[ctx.me] };
}
