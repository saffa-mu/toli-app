import type { UserId, World } from '@/lib/types';

export const FLAG_THRESHOLD = 2;

export function openReportsAgainst(w: World, userId: UserId): number {
  return w.reports.filter((r) => r.against === userId && r.open).length;
}

/** A user with 2+ open reports is hidden from discovery until reviewed. */
export function isFlagged(w: World, userId: UserId): boolean {
  return openReportsAgainst(w, userId) >= FLAG_THRESHOLD;
}

export function hasBlocked(w: World, by: UserId, against: UserId): boolean {
  return w.blocks.some((b) => b.by === by && b.against === against);
}

/** Blocking hides people from each other in both directions. */
export function isHiddenBetween(w: World, a: UserId, b: UserId): boolean {
  return hasBlocked(w, a, b) || hasBlocked(w, b, a);
}

/**
 * Women-only visibility between two people: a woman with women-only on sees only women,
 * and is never shown to men.
 */
export function womenOnlyAllows(w: World, viewer: UserId, other: UserId): boolean {
  const v = w.users[viewer];
  const o = w.users[other];
  if (!v || !o) return false;
  if (v.prefs.womenOnly && o.gender !== 'F') return false;
  if (o.prefs.womenOnly && v.gender !== 'F') return false;
  return true;
}
