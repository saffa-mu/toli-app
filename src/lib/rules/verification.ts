import { totalVisits } from './regular';
import type { UserId, World } from '@/lib/types';

/**
 * Verification score, 0 to 100, shown as a ring around the profile photo.
 * These weights and thresholds are proposed values; the 2,000-user pilot is meant to test them.
 */
export type StepKey = 'phone' | 'selfie' | 'profile' | 'checkins' | 'moments' | 'govId';

export interface ScoreStep {
  key: StepKey;
  label: string;
  max: number;
  earned: number;
  how: string;
  /** What the user can tap to progress, if it is something the app can start. */
  action?: 'moment' | 'govId' | 'checkin' | 'profile';
}

export const CHECKINS_NEEDED = 2;
export const MOMENTS_NEEDED = 2;

export type LevelKey = 'starting' | 'verified' | 'trusted' | 'full';
export interface Level {
  key: LevelKey;
  label: string;
  min: number;
  unlocks: string;
}

export const LEVELS: Level[] = [
  {
    key: 'starting',
    label: 'Getting started',
    min: 0,
    unlocks: 'Browse open tolis and connect with people at a similar score.',
  },
  {
    key: 'verified',
    label: 'Verified',
    min: 50,
    unlocks: 'Crossed paths, and connect with people at 50% or more.',
  },
  {
    key: 'trusted',
    label: 'Trusted',
    min: 75,
    unlocks: 'Fellow regulars, and join suggested tolis.',
  },
  {
    key: 'full',
    label: 'Fully verified',
    min: 100,
    unlocks: 'Your kind of people across the city, host tolis, and appear in everyone’s suggestions.',
  },
];

export const LEVEL_COLOUR: Record<LevelKey, string> = {
  starting: '#94A3B8',
  verified: '#14B8A6',
  trusted: '#0F766E',
  full: '#D97706',
};

export function levelOf(score: number): Level {
  return [...LEVELS].reverse().find((l) => score >= l.min) ?? LEVELS[0];
}

export const LENS_MIN = { crossed: 50, regulars: 75, kind: 100 } as const;
export const JOIN_TOLI_MIN = 75;
export const HOST_MIN = 100;
/** People are shown to you if their score is at most this far above yours ("similar or lower"). */
export const SIMILAR_BAND = 10;

export interface Score {
  total: number;
  level: Level;
  steps: ScoreStep[];
  /** The next step that would add the most, for the guided checklist. */
  next?: ScoreStep;
}

export function verificationScore(w: World, userId: UserId): Score {
  const u = w.users[userId];
  if (!u) return { total: 0, level: LEVELS[0], steps: [] };
  const v = u.verification;
  const visits = Math.min(totalVisits(w, userId), CHECKINS_NEEDED);
  const moments = Math.min(v.moments, MOMENTS_NEEDED);
  const profileDone = u.interests.length > 0 && u.quiz.length === 4;

  const steps: ScoreStep[] = [
    {
      key: 'phone',
      label: 'Phone number',
      max: 10,
      earned: v.otp ? 10 : 0,
      how: 'One-time code by SMS',
    },
    {
      key: 'selfie',
      label: 'Live selfie',
      max: 20,
      earned: v.selfie ? 20 : 0,
      how: 'Liveness check matched to your profile photos',
    },
    {
      key: 'profile',
      label: 'Complete profile',
      max: 10,
      earned: profileDone ? 10 : 0,
      how: 'Interests, who you want to meet and the vibe quiz',
      action: 'profile',
    },
    {
      key: 'checkins',
      label: 'Location-verified check-ins',
      max: 25,
      earned: Math.round((25 * visits) / CHECKINS_NEEDED),
      how: `${CHECKINS_NEEDED} check-ins confirmed by your phone’s location (${visits} of ${CHECKINS_NEEDED})`,
      action: 'checkin',
    },
    {
      key: 'moments',
      label: 'Location-verified moments',
      max: 10,
      earned: Math.round((10 * moments) / MOMENTS_NEEDED),
      how: `${MOMENTS_NEEDED} photos taken at a place you checked in at (${moments} of ${MOMENTS_NEEDED}). A photo with no location data adds almost nothing.`,
      action: 'moment',
    },
    {
      key: 'govId',
      label: 'Government ID',
      max: 25,
      earned: v.govId ? 25 : 0,
      how: 'DigiLocker check. Your ID is never shown or stored.',
      action: 'govId',
    },
  ];
  const total = Math.min(
    100,
    steps.reduce((s, x) => s + x.earned, 0),
  );
  const next = steps
    .filter((s) => s.earned < s.max)
    .sort((a, b) => b.max - b.earned - (a.max - a.earned))[0];
  return { total, level: levelOf(total), steps, next };
}

export const scoreOf = (w: World, userId: UserId) => verificationScore(w, userId).total;

/** Can `viewer` see `other`? You see people at a similar score or lower. */
export function canSee(w: World, viewer: UserId, other: UserId): boolean {
  return scoreOf(w, other) <= scoreOf(w, viewer) + SIMILAR_BAND;
}

/** Below 50% you connect with people at a similar score; from 50% you connect with anyone at 50% or more. */
export function canConnect(w: World, from: UserId, to: UserId): boolean {
  const a = scoreOf(w, from);
  const b = scoreOf(w, to);
  return a < LENS_MIN.crossed ? Math.abs(a - b) <= 15 : b >= LENS_MIN.crossed;
}

export function connectBlockedReason(w: World, from: UserId, to: UserId): string | null {
  if (canConnect(w, from, to)) return null;
  const a = scoreOf(w, from);
  return a < LENS_MIN.crossed
    ? 'Below 50% you can connect with people at a similar score. Verify more to reach everyone.'
    : 'They are still getting verified. You can connect with people at 50% or more.';
}

export const canJoinSuggested = (w: World, userId: UserId) => scoreOf(w, userId) >= JOIN_TOLI_MIN;
export const canHost = (w: World, userId: UserId) => scoreOf(w, userId) >= HOST_MIN;
