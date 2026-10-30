import { regularVenues } from './regular';
import { ACTIVITY_BY_ID } from '@/data/activities';
import { areaOf } from '@/lib/geo';
import type { Activity, UserId, World } from '@/lib/types';

export const ACTIVITY_LABEL = Object.fromEntries(
  Object.entries(ACTIVITY_BY_ID).map(([id, m]) => [id, m.tag]),
) as Record<Activity, string>;

/**
 * What other people may see about someone's routine: activity + neighbourhood + Regular tag.
 * Never the exact venue, days or times.
 */
export function publicTags(w: World, userId: UserId): string[] {
  const user = w.users[userId];
  if (!user) return [];
  const regular = new Set(regularVenues(w, userId));
  const tags = user.routines.map((r) => {
    const sector = areaOf(w.venues[r.venueId]);
    return regular.has(r.venueId)
      ? `Regular · ${ACTIVITY_LABEL[r.activity]} · ${sector}`
      : `${ACTIVITY_LABEL[r.activity]} · ${sector}`;
  });
  return [...new Set(tags)].sort((a, b) => Number(b.startsWith('Regular')) - Number(a.startsWith('Regular')));
}

export function publicTagFor(w: World, venueId: string, activity: Activity): string {
  return `Regular · ${ACTIVITY_LABEL[activity]} · ${areaOf(w.venues[venueId])}`;
}

/** "badminton" -> "Badminton" for the start of a line. */
export const capitalise = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
