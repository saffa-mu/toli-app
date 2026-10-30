import { DAY_MS } from './clock';
import { regularVenues } from './rules/regular';
import type { Activity, MetricEvent, UserId, VenueId, World } from './types';

/** Simulated concierge-pilot cohort. Live demo events are added on top. */
export const BASELINE = {
  mau: 180,
  repeatUsers: 31,
  connectedUsers: 108,
  metUsers: 62,
  feltSafeOk: 27,
  feltSafeTotal: 28,
  reports: 3,
  meetups: 968,
  notifOptouts: 14,
  suggestionAccept: 0.38,
  nextPlanWithin7d: 0.41,
  matched: 140,
  metWithin2w: 46,
  metAgain: 23,
} as const;

export const TARGETS = { northStar: 0.25, feltSafe: 0.95, reportsPer1000: 5, notifOptout: 0.1 } as const;

export interface FunnelStage {
  name: 'Acquisition' | 'Activation' | 'Retention' | 'Referral' | 'Revenue';
  actual: number;
  target: number;
  format: 'count' | 'pct' | 'ratio' | 'none';
  definition: string;
}

export const FUNNEL: FunnelStage[] = [
  {
    name: 'Acquisition',
    actual: 212,
    target: 200,
    format: 'count',
    definition: 'Installs in Gurugram pilot',
  },
  {
    name: 'Activation',
    actual: 0.27,
    target: 0.4,
    format: 'pct',
    definition: 'Regular badge or first toli within 14 days',
  },
  {
    name: 'Retention',
    actual: 0.31,
    target: 0.35,
    format: 'pct',
    definition: 'Week-4 proxy: still checking in',
  },
  { name: 'Referral', actual: 0.8, target: 1, format: 'ratio', definition: 'Invites per good meetup' },
  { name: 'Revenue', actual: 0, target: 0, format: 'none', definition: 'Not live, free in the pilot' },
];

export interface Guardrail {
  key: 'feltSafe' | 'reports' | 'optout';
  label: string;
  value: number;
  display: string;
  threshold: string;
  ok: boolean;
}

const within30 = (w: World, e: MetricEvent) => e.at > w.clock - 30 * DAY_MS && e.at <= w.clock;

/** Users who met the same person in person 2+ times in the last 30 days (from attendance events). */
export function repeatMeetupUsers(w: World): Set<UserId> {
  const byPlan = new Map<string, UserId[]>();
  for (const e of w.events)
    if (e.type === 'attended' && within30(w, e)) {
      const planId = String(e.props.planId);
      byPlan.set(planId, [...(byPlan.get(planId) ?? []), e.userId]);
    }
  const pairCount = new Map<string, number>();
  for (const people of byPlan.values()) {
    const uniq = [...new Set(people)].sort();
    for (let i = 0; i < uniq.length; i++)
      for (let j = i + 1; j < uniq.length; j++) {
        const k = `${uniq[i]}|${uniq[j]}`;
        pairCount.set(k, (pairCount.get(k) ?? 0) + 1);
      }
  }
  const users = new Set<UserId>();
  for (const [k, n] of pairCount) if (n >= 2) for (const id of k.split('|')) users.add(id);
  return users;
}

export function activeUsers(w: World): Set<UserId> {
  return new Set(w.events.filter((e) => within30(w, e)).map((e) => e.userId));
}

export interface VenueRow {
  venueId: VenueId;
  name: string;
  sector: number;
  activities: Activity[];
  regulars: number;
  womenRegulars: number;
  posted: number;
  happened: number;
  womenOnlyPosted: number;
}

export function venueTable(w: World): VenueRow[] {
  return Object.values(w.venues).map((v) => {
    const regs = Object.keys(w.users).filter((id) => regularVenues(w, id).includes(v.id));
    const plans = w.plans.filter((p) => p.venueId === v.id);
    return {
      venueId: v.id,
      name: v.name,
      sector: v.sector,
      activities: v.activities,
      regulars: regs.length,
      womenRegulars: regs.filter((id) => w.users[id].gender === 'F').length,
      posted: plans.length,
      happened: plans.filter((p) => p.attended.length >= 2).length,
      womenOnlyPosted: plans.filter((p) => p.womenOnly).length,
    };
  });
}

export function computeMetrics(w: World) {
  const active = activeUsers(w);
  const repeat = repeatMeetupUsers(w);
  const numerator = BASELINE.repeatUsers + repeat.size;
  const denominator = BASELINE.mau + active.size;

  const live = (type: MetricEvent['type']) =>
    w.events.filter((e) => e.type === type && !e.id.startsWith('e-seed'));
  const feltLive = live('felt_safe');
  const feltOk = BASELINE.feltSafeOk + feltLive.filter((e) => e.props.answer !== 'no').length;
  const feltTotal = BASELINE.feltSafeTotal + feltLive.length;
  const meetupPlans = new Set(
    w.events.filter((e) => e.type === 'attended' && within30(w, e)).map((e) => String(e.props.planId)),
  );
  const reports = BASELINE.reports + live('report').length;
  const meetups = BASELINE.meetups + meetupPlans.size;
  const optouts = BASELINE.notifOptouts + live('notif_optout').length;

  const feltSafe = feltOk / feltTotal;
  const per1000 = (reports / meetups) * 1000;
  const optout = optouts / BASELINE.mau;
  const guardrails: Guardrail[] = [
    {
      key: 'feltSafe',
      label: 'Felt safe',
      value: feltSafe,
      display: pct(feltSafe),
      threshold: '≥ 95%',
      ok: feltSafe >= TARGETS.feltSafe,
    },
    {
      key: 'reports',
      label: 'Reports per 1,000 meetups',
      value: per1000,
      display: per1000.toFixed(1),
      threshold: '< 5',
      ok: per1000 < TARGETS.reportsPer1000,
    },
    {
      key: 'optout',
      label: 'Notification opt-out (30 days)',
      value: optout,
      display: pct(optout),
      threshold: '< 10%',
      ok: optout < TARGETS.notifOptout,
    },
  ];

  const scored = FUNNEL.filter((s) => s.target > 0).map((s) => ({
    name: s.name,
    ratio: s.actual / s.target,
  }));
  const weakest = scored.reduce((a, b) => (b.ratio < a.ratio ? b : a)).name;

  const picks = live('meet_again_pick').length;
  const mutuals = live('mutual_meet_again').length;
  const toliMembers = w.tolis.flatMap((t) => t.members);
  const pastPlans = w.plans.filter((p) => p.start + p.durationMin * 60_000 <= w.clock);
  const venues = venueTable(w);

  const tree = {
    connected: BASELINE.connectedUsers / BASELINE.mau,
    conversion: BASELINE.metUsers / BASELINE.connectedUsers,
    repeat: BASELINE.repeatUsers / BASELINE.metUsers,
    inputs: {
      regularsPerVenue: venues.reduce((s, v) => s + v.regulars, 0) / Math.max(1, venues.length),
      suggestionAcceptance: toliMembers.length
        ? toliMembers.filter((m) => m.state === 'accepted').length / toliMembers.length
        : BASELINE.suggestionAccept,
      tolisHappened: pastPlans.filter((p) => p.attended.length >= 2).length,
      tolisPosted: pastPlans.length,
      showUpRate:
        pastPlans.reduce((s, p) => s + p.attended.length, 0) /
        Math.max(
          1,
          pastPlans.reduce((s, p) => s + p.members.length, 0),
        ),
      mutualRate: picks ? mutuals / picks : 0.5,
      nextPlanWithin7d: BASELINE.nextPlanWithin7d,
    },
  };

  const liveMatched = new Set([...live('connect_accepted'), ...live('toli_formed')].map((e) => e.userId));
  const liveMet = new Set(live('attended').map((e) => e.userId));

  return {
    northStar: {
      value: numerator / denominator,
      numerator,
      denominator,
      baseline: BASELINE.repeatUsers / BASELINE.mau,
      target: TARGETS.northStar,
      liveRepeat: repeat.size,
      liveActive: active.size,
    },
    guardrails,
    funnel: { stages: FUNNEL, weakest },
    tree,
    hypothesis: {
      matched: BASELINE.matched + liveMatched.size,
      met: BASELINE.metWithin2w + [...liveMatched].filter((id) => liveMet.has(id)).length,
      metAgain: BASELINE.metAgain + [...liveMatched].filter((id) => repeat.has(id)).length,
    },
    venues,
  };
}

export type Metrics = ReturnType<typeof computeMetrics>;

export function pct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}
