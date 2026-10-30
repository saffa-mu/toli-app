import type { Plan, UserId } from '@/lib/types';

/** Only mutual picks are ever revealed. Non-mutual picks stay private forever. */
export function revealedPicks(plan: Plan, userId: UserId): UserId[] {
  const mine = plan.meetAgain[userId];
  if (!mine) return [];
  return mine.filter((other) => plan.meetAgain[other]?.includes(userId));
}

export function hasAnswered(plan: Plan, userId: UserId): boolean {
  return userId in plan.meetAgain;
}
