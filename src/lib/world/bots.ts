import { MEET_AGAIN_SKIPS } from '@/data/bots';
import { canSeePlan, planEnd } from '@/lib/rules/plans';
import { isFlagged, isHiddenBetween } from '@/lib/rules/safety';
import { isVerified } from '@/lib/rules/stages';
import type { UserId, World } from '@/lib/types';
import type { Action } from './actions';

export interface Reaction {
  delayMs: number;
  action: Action;
}

export interface BotContext {
  autopilot: boolean;
  /** Users currently shown in a phone. They never auto-accept requests. */
  controlled: UserId[];
  /** The main (left) phone user. Never replies on its own. */
  primary: UserId;
}

/** Deterministic "human" delay between 1.2s and 2.5s. */
function typingDelay(seed: number): number {
  return 1200 + ((seed * 7919) % 1300);
}

/** What the simulated people do in response to an action. Pure and deterministic. */
export function botReactions(prev: World, next: World, action: Action, ctx: BotContext): Reaction[] {
  if (!ctx.autopilot) return [];
  const isBot = (id: UserId) => !ctx.controlled.includes(id);
  const out: Reaction[] = [];

  switch (action.type) {
    case 'sendConnect': {
      const created = next.connections.length > prev.connections.length;
      if (created && isBot(action.to))
        out.push({
          delayMs: 1500,
          action: { type: 'respondConnect', actAs: action.to, from: action.actAs, accept: true },
        });
      break;
    }
    case 'sendMessage': {
      if (!ctx.controlled.includes(action.actAs)) break;
      const conv = next.conversations.find((c) => c.id === action.convId);
      if (!conv) break;
      const responders = conv.members.filter((m) => m !== action.actAs && m !== ctx.primary);
      if (!responders.length) break;
      const responder = responders[conv.messages.length % responders.length];
      out.push({ delayMs: 300, action: { type: 'typing', actAs: responder, convId: conv.id, on: true } });
      out.push({
        delayMs: 300 + typingDelay(conv.messages.length),
        action: { type: 'botReply', actAs: responder, convId: conv.id },
      });
      break;
    }
    case 'acceptToli': {
      const before = prev.tolis.find((t) => t.id === action.toliId);
      const toli = next.tolis.find((t) => t.id === action.toliId);
      if (!toli || !before || !toli.planId) break;
      if (before.status !== 'formed' && toli.status === 'formed') {
        toli.members
          .filter((m) => m.state === 'accepted' && m.userId !== action.actAs && isBot(m.userId))
          .forEach((m, i) =>
            out.push({
              delayMs: 400 + i * 500,
              action: { type: 'joinPlan', actAs: m.userId, planId: toli.planId! },
            }),
          );
        toli.members
          .filter((m) => m.state === 'pending' && isBot(m.userId))
          .forEach((m, i) =>
            out.push({
              delayMs: 8000 + i * 1500,
              action: { type: 'acceptToli', actAs: m.userId, toliId: toli.id },
            }),
          );
      } else if (before.status === 'formed' && isBot(action.actAs)) {
        out.push({ delayMs: 600, action: { type: 'joinPlan', actAs: action.actAs, planId: toli.planId } });
      }
      break;
    }
    case 'imHere': {
      if (!ctx.controlled.includes(action.actAs)) break;
      const plan = next.plans.find((p) => p.id === action.planId);
      if (!plan || !plan.attended.includes(action.actAs)) break;
      plan.members
        .filter((m) => isBot(m) && !plan.attended.includes(m))
        .forEach((m, i) =>
          out.push({ delayMs: 900 + i * 800, action: { type: 'imHere', actAs: m, planId: plan.id } }),
        );
      break;
    }
    case 'setClock': {
      for (const plan of next.plans) {
        const end = planEnd(plan);
        if (end <= prev.clock || end > next.clock || plan.attended.length < 2) continue;
        for (const id of plan.attended.filter(isBot)) {
          const skip = MEET_AGAIN_SKIPS[id] ?? [];
          const picks = plan.attended.filter((o) => o !== id && !skip.includes(o));
          out.push({ delayMs: 0, action: { type: 'meetAgain', actAs: id, planId: plan.id, picks } });
          out.push({ delayMs: 0, action: { type: 'feltSafe', actAs: id, planId: plan.id, answer: 'yes' } });
        }
      }
      break;
    }
    case 'hostPlan': {
      const plan = next.plans.length > prev.plans.length ? next.plans[next.plans.length - 1] : undefined;
      if (!plan) break;
      Object.values(next.users)
        .filter(
          (u) =>
            u.id !== action.actAs &&
            isBot(u.id) &&
            isVerified(next, u.id) &&
            !isFlagged(next, u.id) &&
            u.routines.some((r) => r.activity === plan.activity) &&
            canSeePlan(next, plan, u.id) &&
            !isHiddenBetween(next, u.id, action.actAs),
        )
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, 2)
        .forEach((u, i) =>
          out.push({ delayMs: 2500 + i * 2500, action: { type: 'joinPlan', actAs: u.id, planId: plan.id } }),
        );
      break;
    }
    default:
      break;
  }
  return out;
}
