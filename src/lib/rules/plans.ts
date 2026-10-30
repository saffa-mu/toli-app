import { MINUTE } from '@/lib/clock';
import { isHiddenBetween } from './safety';
import type { Plan, UserId, World } from '@/lib/types';

export const MIN_SPOTS = 3;
export const MAX_SPOTS = 6;
export const HERE_OPENS_MIN = 15;
export const HERE_CLOSES_MIN = 60;

export function canSeeVenue(plan: Plan, userId: UserId): boolean {
  return plan.members.includes(userId);
}

export function imHereOpen(plan: Plan, now: number): boolean {
  return now >= plan.start - HERE_OPENS_MIN * MINUTE && now <= plan.start + HERE_CLOSES_MIN * MINUTE;
}

export function planEnd(plan: Plan): number {
  return plan.start + plan.durationMin * MINUTE;
}

export function hasEnded(plan: Plan, now: number): boolean {
  return now >= planEnd(plan);
}

export function spotsLeft(plan: Plan): number {
  return Math.max(0, plan.spots - plan.members.length);
}

/** Whether a user may see a plan at all (women-only plans are invisible to men). */
export function canSeePlan(w: World, plan: Plan, userId: UserId): boolean {
  const user = w.users[userId];
  if (!user) return false;
  if (plan.members.includes(userId)) return true;
  if (plan.womenOnly && user.gender !== 'F') return false;
  if (user.prefs.womenOnly && !plan.womenOnly && w.users[plan.hostId]?.gender !== 'F') return false;
  return !isHiddenBetween(w, userId, plan.hostId);
}

export function canJoin(w: World, plan: Plan, userId: UserId): boolean {
  return (
    !plan.members.includes(userId) &&
    spotsLeft(plan) > 0 &&
    !hasEnded(plan, w.clock) &&
    canSeePlan(w, plan, userId)
  );
}

/** Upcoming plans a user can see, soonest first. */
export function visiblePlans(w: World, userId: UserId): Plan[] {
  return w.plans
    .filter((p) => !hasEnded(p, w.clock) && canSeePlan(w, p, userId))
    .sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
}

export function myUpcomingPlans(w: World, userId: UserId): Plan[] {
  return visiblePlans(w, userId).filter((p) => p.members.includes(userId));
}

/** Plans this user attended that ended and still await their meet-again answer. */
export function awaitingMeetAgain(w: World, userId: UserId): Plan[] {
  return w.plans.filter(
    (p) =>
      p.attended.includes(userId) &&
      p.attended.length >= 2 &&
      hasEnded(p, w.clock) &&
      w.clock - planEnd(p) < 3 * 24 * 60 * MINUTE,
  );
}
