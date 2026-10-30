import { isRegularAnywhere, totalVisits } from './regular';
import type { Stage, UserId, World } from '@/lib/types';

export const STAGES: Stage[] = ['New', 'Exploring', 'Regular', 'In a toli'];

export function isVerified(w: World, userId: UserId): boolean {
  const v = w.users[userId]?.verification;
  return !!v && v.otp && v.selfie && v.adult;
}

/** How many plans each other person attended together with this user. */
export function coAttendance(w: World, userId: UserId): Record<UserId, number> {
  const counts: Record<UserId, number> = {};
  for (const p of w.plans) {
    if (!p.attended.includes(userId) || p.start > w.clock) continue;
    for (const other of p.attended) if (other !== userId) counts[other] = (counts[other] ?? 0) + 1;
  }
  return counts;
}

export function repeatPeople(w: World, userId: UserId): UserId[] {
  return Object.entries(coAttendance(w, userId))
    .filter(([, n]) => n >= 2)
    .map(([id]) => id);
}

export function meetupCount(w: World, userId: UserId): number {
  return w.plans.filter((p) => p.attended.includes(userId) && p.attended.length >= 2 && p.start <= w.clock)
    .length;
}

export function stageOf(w: World, userId: UserId): Stage {
  if (!isVerified(w, userId)) return 'New';
  if (repeatPeople(w, userId).length > 0) return 'In a toli';
  if (isRegularAnywhere(w, userId)) return 'Regular';
  return totalVisits(w, userId) > 0 ? 'Exploring' : 'New';
}
