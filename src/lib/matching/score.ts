import { ACTIVITY_BY_ID } from '@/data/activities';
import { DAY_NAMES } from '@/lib/clock';
import { userInRadius } from '@/lib/geo';
import { LENS_MIN, canSee, scoreOf } from '@/lib/rules/verification';
import { isRegularAnywhere, isVerifiedRegular } from '@/lib/rules/regular';
import { isFlagged, isHiddenBetween, womenOnlyAllows } from '@/lib/rules/safety';
import { isVerified } from '@/lib/rules/stages';
import type { Day, Routine, Slot, User, UserId, World } from '@/lib/types';
import {
  COMPONENT_ORDER,
  NEIGHBOUR_SECTOR_GAP,
  NEW_TO_CITY_MONTHS,
  WEEKLY_LIMIT,
  WEIGHTS,
  type Component,
} from './weights';

export type Components = Record<Component, number>;

export interface Match {
  userId: UserId;
  total: number;
  components: Components;
  reason: string;
}

const SLOTS: Slot[] = ['early', 'morning', 'afternoon', 'evening'];
const SLOT_WORD: Record<Slot, string> = {
  early: 'morning',
  morning: 'late-morning',
  afternoon: 'afternoon',
  evening: 'evening',
};
/** Weekend days first: a shared Saturday reads better than a shared Monday. */
const DAY_PREFERENCE: Day[] = [6, 0, 5, 1, 2, 3, 4];

const sharedDays = (a: Routine, b: Routine) =>
  DAY_PREFERENCE.filter((d) => a.days.includes(d) && b.days.includes(d));
const adjacent = (a: Slot, b: Slot) => Math.abs(SLOTS.indexOf(a) - SLOTS.indexOf(b)) === 1;

interface PlaceResult {
  value: number;
  routine?: Routine;
}

function placeScore(w: World, a: User, b: User): PlaceResult {
  let best: PlaceResult = { value: 0 };
  for (const ra of a.routines) {
    for (const rb of b.routines) {
      let value = 0;
      if (ra.venueId === rb.venueId) {
        const bothRegular = isVerifiedRegular(w, a.id, ra.venueId) && isVerifiedRegular(w, b.id, rb.venueId);
        value = bothRegular ? 1 : 0.6;
      } else if (ra.activity === rb.activity) {
        const gap = Math.abs(w.venues[ra.venueId].sector - w.venues[rb.venueId].sector);
        value = gap <= NEIGHBOUR_SECTOR_GAP ? 0.3 : 0;
      }
      if (value > best.value) best = { value, routine: ra };
    }
  }
  return best;
}

interface TimeResult {
  value: number;
  day?: Day;
  slot?: Slot;
}

function timeScore(a: User, b: User): TimeResult {
  let best: TimeResult = { value: 0 };
  for (const ra of a.routines) {
    for (const rb of b.routines) {
      const days = sharedDays(ra, rb);
      let r: TimeResult = { value: 0 };
      if (days.length && ra.slot === rb.slot) r = { value: 1, day: days[0], slot: ra.slot };
      else if (ra.slot === rb.slot) r = { value: 0.5, slot: ra.slot };
      else if (days.length && adjacent(ra.slot, rb.slot)) r = { value: 0.5, day: days[0], slot: ra.slot };
      if (r.value > best.value) best = r;
    }
  }
  return best;
}

export const isNewToCity = (u: User) => u.monthsInCity < NEW_TO_CITY_MONTHS;

function lifeStageScore(a: User, b: User): number {
  const n = Number(isNewToCity(a)) + Number(isNewToCity(b));
  return n === 2 ? 1 : n === 1 ? 0.5 : 0.2;
}

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a.map((x) => x.toLowerCase()));
  const B = new Set(b.map((x) => x.toLowerCase()));
  const inter = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  return union === 0 ? 0 : inter / union;
}

export function sharedInterests(a: User, b: User): string[] {
  const B = new Set(b.interests.map((x) => x.toLowerCase()));
  return a.interests.filter((x) => B.has(x.toLowerCase()));
}

function interestsScore(a: User, b: User): number {
  const hometown = a.hometown === b.hometown ? 0.3 : a.region === b.region ? 0.15 : 0;
  return Math.min(1, jaccard(a.interests, b.interests) + 0.5 * jaccard(a.languages, b.languages) + hometown);
}

function quizScore(a: User, b: User): number {
  const diffs = a.quiz.map((x, i) => Math.abs(x - b.quiz[i]));
  return 1 - diffs.reduce((s, d) => s + d, 0) / diffs.length / 2;
}

const round = (n: number) => Math.round(n * 1000) / 1000;

function buildReason(
  w: World,
  a: User,
  b: User,
  c: Components,
  place: PlaceResult,
  time: TimeResult,
): string {
  const ranked = COMPONENT_ORDER.filter((k) => c[k] > 0).sort(
    (x, y) => WEIGHTS[y] * c[y] - WEIGHTS[x] * c[x],
  );
  const [first, second] = ranked;
  const venue = place.routine ? w.venues[place.routine.venueId] : undefined;
  const bothNew = c.lifeStage === 1;
  const when = time.day !== undefined && time.slot ? `${DAY_NAMES[time.day]}-${SLOT_WORD[time.slot]}` : '';

  const placeAndTimeLead = new Set([first, second]).has('place') && new Set([first, second]).has('timeSlot');
  if (placeAndTimeLead && venue && place.value >= 0.6 && when) {
    const tail = bothNew ? ', and new to the city' : '';
    return `You're both ${when} regulars at a ${venue.kind} in Sector ${venue.sector}${tail}.`;
  }

  const phrase = (k: Component): string => {
    switch (k) {
      case 'place': {
        const verb = ACTIVITY_BY_ID[place.routine!.activity].verb;
        return venue && place.value >= 0.6
          ? `you both ${verb} at a ${venue.kind} in Sector ${venue.sector}`
          : `you both ${verb} in neighbouring sectors`;
      }
      case 'timeSlot':
        return time.day !== undefined && time.slot
          ? `you're both out on ${DAY_NAMES[time.day]} ${SLOT_WORD[time.slot]}s`
          : `you both keep ${SLOT_WORD[time.slot ?? 'early']} hours`;
      case 'lifeStage':
        return bothNew ? "you're both new to the city" : 'one of you knows the city well';
      case 'interests': {
        if (a.hometown === b.hometown) return `you're both from ${a.hometown}`;
        const shared = sharedInterests(a, b).slice(0, 2);
        return shared.length ? `you both like ${shared.join(' and ')}` : 'you speak the same languages';
      }
      case 'quiz':
        return 'your vibe quiz answers line up';
    }
  };

  if (!first) return 'You live in the same city.';
  const text = second ? `${phrase(first)}, and ${phrase(second)}` : phrase(first);
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

/** Score one pair. Pure: depends only on the world and the two user ids. */
export function scorePair(w: World, viewerId: UserId, otherId: UserId): Match {
  const a = w.users[viewerId];
  const b = w.users[otherId];
  const place = placeScore(w, a, b);
  const time = timeScore(a, b);
  const components: Components = {
    place: place.value,
    timeSlot: time.value,
    lifeStage: lifeStageScore(a, b),
    interests: round(interestsScore(a, b)),
    quiz: round(quizScore(a, b)),
  };
  const total = COMPONENT_ORDER.reduce((s, k) => s + WEIGHTS[k] * components[k], 0);
  return { userId: otherId, total, components, reason: buildReason(w, a, b, components, place, time) };
}

export function isConnected(w: World, a: UserId, b: UserId): boolean {
  return w.connections.some(
    (c) => c.status === 'connected' && ((c.from === a && c.to === b) || (c.from === b && c.to === a)),
  );
}

/** Gender preference both ways: each person's "who I want to meet" must include the other. */
function prefersEachOther(a: User, b: User): boolean {
  const wants = (x: User, y: User) => x.meetGender === 'any' || x.meetGender === y.gender;
  return wants(a, b) && wants(b, a);
}

/** Eligibility filters applied before scoring. */
export function eligibleCandidates(w: World, viewerId: UserId): UserId[] {
  const viewer = w.users[viewerId];
  if (!viewer) return [];
  return Object.keys(w.users)
    .filter(
      (id) =>
        id !== viewerId &&
        isVerified(w, id) &&
        !isHiddenBetween(w, viewerId, id) &&
        !isFlagged(w, id) &&
        !isConnected(w, viewerId, id) &&
        userInRadius(w, viewerId, id) &&
        prefersEachOther(w.users[viewerId], w.users[id]) &&
        canSee(w, viewerId, id) &&
        womenOnlyAllows(w, viewerId, id),
    )
    .sort();
}

export type LensId = 'crossed' | 'regulars' | 'kind';

export interface Lens {
  id: LensId;
  label: string;
  blurb: string;
  minScore: number;
  unlocked: boolean;
  matches: Match[];
}

export interface PeopleResult {
  locked: boolean;
  matches: Match[];
  /** How many people are waiting behind the teaser. */
  teaserCount: number;
  score: number;
  lenses: Lens[];
}

export function rankCandidates(w: World, viewerId: UserId): Match[] {
  return eligibleCandidates(w, viewerId)
    .map((id) => scorePair(w, viewerId, id))
    .sort((x, y) => y.total - x.total || x.userId.localeCompare(y.userId));
}

const LENS_COPY: Record<LensId, { label: string; blurb: string }> = {
  crossed: { label: 'Crossed paths', blurb: 'People who go to the same places as you' },
  regulars: { label: 'Fellow regulars', blurb: 'Verified regulars of your places, matched to you' },
  kind: { label: 'Your kind of people', blurb: 'Like-minded people across the city' },
};

/**
 * People for you. Three lenses unlock with the verification score: Crossed paths (50%),
 * Fellow regulars (75%, and you must be a Verified Regular), Your kind of people (100%).
 * The main list is Fellow regulars, up to 5 a week.
 */
export function peopleFor(w: World, viewerId: UserId): PeopleResult {
  const all = rankCandidates(w, viewerId);
  const score = scoreOf(w, viewerId);
  const viewer = w.users[viewerId];
  const sharesPlace = (id: UserId) =>
    w.users[id].routines.some((r) => viewer.routines.some((v) => v.venueId === r.venueId));
  const unlocked: Record<LensId, boolean> = {
    crossed: score >= LENS_MIN.crossed,
    regulars: score >= LENS_MIN.regulars && isVerified(w, viewerId) && isRegularAnywhere(w, viewerId),
    kind: score >= LENS_MIN.kind,
  };
  const lists: Record<LensId, Match[]> = {
    crossed: all.filter((m) => sharesPlace(m.userId)).slice(0, WEEKLY_LIMIT),
    regulars: all.slice(0, WEEKLY_LIMIT),
    kind: [...all]
      .sort((x, y) => y.components.interests + y.components.quiz - (x.components.interests + x.components.quiz))
      .slice(0, WEEKLY_LIMIT),
  };
  const lenses = (['crossed', 'regulars', 'kind'] as LensId[]).map((id) => ({
    id,
    ...LENS_COPY[id],
    minScore: LENS_MIN[id],
    unlocked: unlocked[id],
    matches: unlocked[id] ? lists[id] : [],
  }));
  const teaserCount = lists.regulars.length;
  if (!unlocked.regulars) return { locked: true, matches: [], teaserCount, score, lenses };
  return { locked: false, matches: lists.regulars, teaserCount, score, lenses };
}
