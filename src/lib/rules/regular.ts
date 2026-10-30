import { DAY_MS } from '@/lib/clock';
import { venueInRadius } from '@/lib/geo';
import type { UserId, VenueId, World } from '@/lib/types';

/** Two check-ins at one place make you a Verified Regular. */
export const REGULAR_VISITS = 2;
export const REGULAR_WINDOW_DAYS = 30;

/** Logged visits by a user to a venue within the rolling 30-day window of the demo clock. */
export function visitCount(w: World, userId: UserId, venueId: VenueId): number {
  const from = w.clock - REGULAR_WINDOW_DAYS * DAY_MS;
  return w.visits.filter(
    (v) => v.userId === userId && v.venueId === venueId && v.at > from && v.at <= w.clock,
  ).length;
}

/** Visits in the last 30 days at places within 100 km of home. Other cities do not count again. */
export function totalVisits(w: World, userId: UserId): number {
  const from = w.clock - REGULAR_WINDOW_DAYS * DAY_MS;
  return w.visits.filter(
    (v) =>
      v.userId === userId && v.at > from && v.at <= w.clock && venueInRadius(w, userId, v.venueId),
  ).length;
}

export function isVerifiedRegular(w: World, userId: UserId, venueId: VenueId): boolean {
  return visitCount(w, userId, venueId) >= REGULAR_VISITS;
}

export function regularVenues(w: World, userId: UserId): VenueId[] {
  return Object.keys(w.venues).filter(
    (v) => venueInRadius(w, userId, v) && isVerifiedRegular(w, userId, v),
  );
}

export function isRegularAnywhere(w: World, userId: UserId): boolean {
  return regularVenues(w, userId).length > 0;
}

/** The places a user chose at sign-up (their routines), within 100 km of home. */
export function placesOf(w: World, userId: UserId): VenueId[] {
  return [
    ...new Set(
      (w.users[userId]?.routines ?? []).map((r) => r.venueId).filter((v) => venueInRadius(w, userId, v)),
    ),
  ];
}
