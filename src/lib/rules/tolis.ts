import { rankCandidates } from '@/lib/matching/score';
import { regularVenues } from './regular';
import type { Slot, Toli, UserId, VenueId, World } from '@/lib/types';

export const TOLI_FORM_AT = 3;
export const TOLI_MAX = 5;

export interface SuggestedGroup {
  venueId: VenueId;
  slot: Slot;
  members: UserId[];
}

/** Group the viewer's top matches who share a venue and slot into groups of 3-5 (viewer included). */
export function suggestGroups(w: World, viewerId: UserId): SuggestedGroup[] {
  const viewer = w.users[viewerId];
  const top = rankCandidates(w, viewerId).slice(0, 5);
  const groups: SuggestedGroup[] = [];
  for (const venueId of regularVenues(w, viewerId)) {
    for (const routine of viewer.routines.filter((r) => r.venueId === venueId)) {
      const mates = top
        .filter((m) =>
          w.users[m.userId].routines.some(
            (r) =>
              r.venueId === venueId &&
              r.slot === routine.slot &&
              r.days.some((d) => routine.days.includes(d)),
          ),
        )
        .map((m) => m.userId)
        .slice(0, TOLI_MAX - 1);
      if (mates.length + 1 >= TOLI_FORM_AT)
        groups.push({ venueId, slot: routine.slot, members: [viewerId, ...mates] });
    }
  }
  return groups;
}

export function acceptedCount(toli: Toli): number {
  return toli.members.filter((m) => m.state === 'accepted').length;
}

/** A suggested toli forms the moment 3 members have accepted. */
export function shouldForm(toli: Toli): boolean {
  return (toli.status === 'suggested' || toli.status === 'forming') && acceptedCount(toli) >= TOLI_FORM_AT;
}
