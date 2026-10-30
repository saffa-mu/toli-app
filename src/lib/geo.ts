import type { Geo, UserId, VenueId, World } from '@/lib/types';

/** Nobody is shown places or people further than this from home. Other cities fall away. */
export const MAX_RADIUS_KM = 100;

export function distanceKm(a: Geo, b: Geo): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function venueDistance(w: World, userId: UserId, venueId: VenueId): number {
  const u = w.users[userId];
  const v = w.venues[venueId];
  return u && v ? distanceKm(u.geo, v.geo) : Infinity;
}

export const venueInRadius = (w: World, userId: UserId, venueId: VenueId) =>
  venueDistance(w, userId, venueId) <= MAX_RADIUS_KM;

export function userInRadius(w: World, viewerId: UserId, otherId: UserId): boolean {
  const a = w.users[viewerId];
  const b = w.users[otherId];
  return !!a && !!b && distanceKm(a.geo, b.geo) <= MAX_RADIUS_KM;
}

/** Area label: "Sector 56" in Gurugram, otherwise the city. */
export const areaOf = (v: { city: string; sector: number }) => (v.sector > 0 ? `Sector ${v.sector}` : v.city);
