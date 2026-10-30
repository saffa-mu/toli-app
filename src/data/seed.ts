import { DAY_MS, DEMO_START, ist } from '@/lib/clock';
import type { Connection, MetricEvent, Plan, Report, Toli, UserId, VenueId, Visit, World } from '@/lib/types';
import { SEED_CHATS } from './chats';
import { USERS } from './users';
import { VENUES } from './venues';

/** Visits as "days before the demo start", logged at 6:45 am that day (deterministic). */
const VISITS: [UserId, VenueId, number[]][] = [
  ['rohan', 'court9', [9]],
  ['rohan', 'jaipur', [20]],
  ['aman', 'court9', [1, 3, 4, 7, 8, 10, 11, 14, 15, 17, 18, 21, 22, 25]],
  ['kabir', 'court9', [4, 11, 18, 25]],
  ['kabir', 'smash', [3, 10]],
  ['neha', 'court9', [4, 11, 18]],
  ['ishita', 'rang', [3, 10, 17]],
  ['ishita', 'leisure', [3, 10]],
  ['dev', 'pickle', [6]],
  ['sana', 'leisure', [3, 10, 17, 24]],
  ['ananya', 'leisure', [3]],
  ['vikram', 'pickle', [6, 13, 20]],
  ['priya', 'leisure', [3, 10, 17]],
  ['priya', 'rang', [11]],
  ['tanvi', 'rang', [4, 11]],
  ['rahul', 'court9', [6, 8, 13, 15]],
  ['sameer', 'smash', [4, 11, 18]],
  ['rocky', 'leisure', [3, 10, 17]],
];

const oct = (day: number, h: number, m = 0) => ist(2026, 10, day, h, m);
const sep = (day: number, h: number, m = 0) => ist(2026, 9, day, h, m);

function plan(
  p: Partial<Plan> & Pick<Plan, 'id' | 'title' | 'activity' | 'venueId' | 'hostId' | 'start'>,
): Plan {
  return {
    durationMin: 90,
    spots: 6,
    members: [],
    attended: [],
    womenOnly: false,
    meetAgain: {},
    feltSafe: {},
    ...p,
  };
}

/** Past meetups give mature users real history (and the stage ladder real data). */
const PAST_PLANS: Plan[] = [
  plan({
    id: 'plan-past-0919',
    title: 'Court 9 doubles',
    activity: 'badminton',
    venueId: 'court9',
    hostId: 'aman',
    start: sep(19, 6, 30),
    members: ['aman', 'kabir'],
    attended: ['aman', 'kabir'],
  }),
  plan({
    id: 'plan-past-0926',
    title: 'Pickleball doubles night',
    activity: 'pickleball',
    venueId: 'pickle',
    hostId: 'vikram',
    start: sep(26, 19, 30),
    spots: 4,
    members: ['vikram', 'aman'],
    attended: ['vikram', 'aman'],
  }),
  plan({
    id: 'plan-past-1003',
    title: 'Court 9 doubles',
    activity: 'badminton',
    venueId: 'court9',
    hostId: 'aman',
    start: oct(3, 6, 30),
    members: ['aman', 'kabir'],
    attended: ['aman', 'kabir'],
  }),
  plan({
    id: 'plan-past-1010',
    title: 'Court 9 doubles',
    activity: 'badminton',
    venueId: 'court9',
    hostId: 'kabir',
    start: oct(10, 6, 30),
    members: ['aman', 'kabir'],
    attended: ['aman', 'kabir'],
  }),
  plan({
    id: 'plan-past-1017',
    title: 'Saturday Smashers',
    activity: 'badminton',
    venueId: 'court9',
    hostId: 'aman',
    start: oct(17, 6, 30),
    members: ['aman', 'kabir', 'neha', 'sameer'],
    attended: ['aman', 'kabir', 'neha', 'sameer'],
    chatId: 'grp-smashers-1017',
    toliId: 'toli-past-1017',
  }),
  plan({
    id: 'plan-past-1024',
    title: 'Court 9 doubles',
    activity: 'badminton',
    venueId: 'court9',
    hostId: 'aman',
    start: oct(24, 6, 30),
    members: ['aman', 'kabir'],
    attended: ['aman', 'kabir'],
  }),
  plan({
    id: 'plan-past-1025',
    title: "Women's 5K + chai",
    activity: 'running',
    venueId: 'leisure',
    hostId: 'sana',
    start: oct(25, 6, 15),
    womenOnly: true,
    members: ['sana', 'priya'],
    attended: ['sana', 'priya'],
  }),
];

const OPEN_PLANS: Plan[] = [
  plan({
    id: 'plan-sketch',
    title: 'Sketch Sundays',
    activity: 'sketching',
    venueId: 'leisure',
    hostId: 'ishita',
    start: ist(2026, 11, 1, 8, 0),
    durationMin: 120,
    members: ['ishita', 'tanvi', 'priya', 'neha'],
    note: 'Bring a pencil and something to lean on. No talent needed.',
  }),
  plan({
    id: 'plan-pickle',
    title: 'Pickleball doubles night',
    activity: 'pickleball',
    venueId: 'pickle',
    hostId: 'vikram',
    start: oct(29, 19, 30),
    spots: 4,
    members: ['vikram', 'dev'],
    note: 'Paddles available. Beginners very welcome.',
  }),
  plan({
    id: 'plan-5k',
    title: "Women's 5K + chai",
    activity: 'running',
    venueId: 'leisure',
    hostId: 'sana',
    start: ist(2026, 11, 1, 6, 15),
    womenOnly: true,
    members: ['sana', 'priya', 'ishita'],
    note: 'Easy pace, nobody gets left behind. Chai after.',
  }),
  plan({
    id: 'plan-mixer',
    title: 'Beginner badminton mixer',
    activity: 'badminton',
    venueId: 'smash',
    hostId: 'sameer',
    start: oct(31, 7, 0),
    members: ['sameer', 'rahul', 'dev'],
    note: 'All levels. We rotate partners every game.',
  }),
];

const TOLIS: Toli[] = [
  {
    id: 'toli-smashers',
    name: 'Saturday Smashers',
    venueId: 'court9',
    activity: 'badminton',
    slot: 'early',
    day: 6,
    members: [
      { userId: 'aman', state: 'accepted' },
      { userId: 'kabir', state: 'accepted' },
      { userId: 'rohan', state: 'pending' },
      { userId: 'neha', state: 'pending' },
    ],
    status: 'forming',
    proposedStart: oct(31, 6, 30),
    womenOnly: false,
  },
];

const conn = (
  id: string,
  from: UserId,
  to: UserId,
  status: Connection['status'],
  at: number,
  note?: string,
) => ({
  id,
  from,
  to,
  status,
  at,
  note,
});

const CONNECTIONS: Connection[] = [
  conn('c-aman-kabir', 'aman', 'kabir', 'connected', sep(20, 9)),
  conn('c-aman-neha', 'neha', 'aman', 'connected', oct(18, 9)),
  conn('c-kabir-neha', 'kabir', 'neha', 'connected', oct(18, 10)),
  conn('c-rohan-meera', 'rohan', 'meera', 'connected', oct(8, 19)),
  conn('c-ishita-tanvi', 'ishita', 'tanvi', 'connected', oct(12, 18)),
  conn('c-sana-priya', 'sana', 'priya', 'connected', oct(5, 8)),
  conn(
    'c-sana-ananya',
    'sana',
    'ananya',
    'pending',
    oct(27, 8, 30),
    'Hi Ananya! I think we run the same loop on Sundays. Want to join our easy-pace 5K this week?',
  ),
  conn(
    'c-rocky-ananya',
    'rocky',
    'ananya',
    'pending',
    oct(20, 22, 40),
    'Hey, I see you running at Leisure Valley every Sunday. Which gate do you come in from?',
  ),
];

const REPORTS: Report[] = [
  {
    id: 'r-seed-1',
    by: 'priya',
    against: 'rocky',
    reason: 'Asked about my routine or location',
    note: '',
    at: oct(12, 9),
    open: true,
  },
  {
    id: 'r-seed-2',
    by: 'sana',
    against: 'rocky',
    reason: 'Made me uncomfortable',
    note: '',
    at: oct(19, 9),
    open: true,
  },
];

function seedEvents(visits: Visit[], plans: Plan[]): MetricEvent[] {
  const events: MetricEvent[] = [];
  const add = (type: MetricEvent['type'], at: number, userId: UserId, props: MetricEvent['props'] = {}) =>
    events.push({ id: `e-seed-${events.length}`, type, at, userId, props });
  for (const u of USERS) {
    const joined = DEMO_START - Math.max(14, Math.round(u.monthsInCity * 30) - 20) * DAY_MS;
    add('signup', joined, u.id);
    if (u.verification.selfie) add('verified', joined + 3600_000, u.id);
  }
  for (const v of visits) add('checkin', v.at, v.userId, { venueId: v.venueId });
  for (const p of plans) for (const id of p.attended) add('attended', p.start, id, { planId: p.id });
  return events.sort((a, b) => a.at - b.at);
}

/** `fresh`: the app's starting point. The signed-in person has no visits, places or chats yet. */
export function buildSeedWorld(fresh = false): World {
  const visits: Visit[] = VISITS.flatMap(([userId, venueId, days]) =>
    days.map((d) => ({
      id: `v-${userId}-${venueId}-${d}`,
      userId,
      venueId,
      at: DEMO_START - d * DAY_MS + 25 * 60_000,
    })),
  );
  const plans = [...PAST_PLANS, ...OPEN_PLANS];
  const users = Object.fromEntries(USERS.map((u) => [u.id, u]));
  if (fresh && users.rohan) {
    users.rohan = { ...users.rohan, routines: [], bio: 'New on Toli.', name: 'You' };
  }
  return structuredClone({
    clock: DEMO_START,
    seq: 0,
    users,
    venues: Object.fromEntries(VENUES.map((v) => [v.id, v])),
    visits: fresh ? visits.filter((v) => v.userId !== 'rohan') : visits,
    connections: fresh ? CONNECTIONS.filter((c) => c.id !== 'c-rohan-meera') : CONNECTIONS,
    tolis: TOLIS,
    plans,
    conversations: fresh ? SEED_CHATS.filter((c) => c.id !== 'dm-rohan-meera') : SEED_CHATS,
    reports: REPORTS,
    blocks: [],
    notifications: [],
    events: seedEvents(visits, plans),
    typing: {},
    prompt: null,
    botCursor: {},
    activitySuggestions: [],
  });
}
