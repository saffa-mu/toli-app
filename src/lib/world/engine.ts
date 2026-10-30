import type { World } from '@/lib/types';
import type { Action } from './actions';
import { botReactions, type BotContext } from './bots';
import { applyAction } from './reducer';

/**
 * Apply an action and every bot reaction it triggers, immediately and in delay order.
 * Used to replay beats; the live store schedules the same reactions with timers instead.
 */
export function applyInstant(w: World, action: Action, ctx: BotContext, depth = 0): World {
  const next = applyAction(w, action);
  if (depth > 8) return next;
  const reactions = botReactions(w, next, action, ctx)
    .map((r, i) => ({ ...r, i }))
    .sort((a, b) => a.delayMs - b.delayMs || a.i - b.i);
  return reactions.reduce((acc, r) => applyInstant(acc, r.action, ctx, depth + 1), next);
}
