import { describe, expect, it } from 'vitest';
import { buildSeedWorld } from '@/data/seed';
import { applyAction } from '@/lib/world/reducer';
import { isVerifiedRegular, regularVenues, visitCount } from '@/lib/rules/regular';
import { stageOf } from '@/lib/rules/stages';
import { canSeeVenue, imHereOpen, visiblePlans } from '@/lib/rules/plans';
import { revealedPicks } from '@/lib/rules/meetAgain';
import { isFlagged, isHiddenBetween } from '@/lib/rules/safety';
import { DAY_MS, MINUTE } from '@/lib/clock';
import type { World } from '@/lib/types';

const seed = () => buildSeedWorld();
const court9 = 'court9';

function logRohanVisit(w: World): World {
  return applyAction(w, { type: 'logVisit', actAs: 'rohan', venueId: court9 });
}

describe('Verified Regular rule', () => {
  it('Haryashwa starts with 1 of 2 visits and is not a Regular', () => {
    const w = seed();
    expect(visitCount(w, 'rohan', court9)).toBe(1);
    expect(isVerifiedRegular(w, 'rohan', court9)).toBe(false);
  });

  it('second visit within 30 days makes him a Verified Regular and logs a badge event', () => {
    const w = logRohanVisit(seed());
    expect(isVerifiedRegular(w, 'rohan', court9)).toBe(true);
    expect(w.events.some((e) => e.type === 'regular_badge' && e.userId === 'rohan')).toBe(true);
  });

  it('visits older than 30 days do not count', () => {
    let w = seed();
    w = { ...w, clock: w.clock + 25 * DAY_MS };
    w = logRohanVisit(w);
    // the visit from 9 days before the start is now 34 days old
    expect(visitCount(w, 'rohan', court9)).toBe(1);
    expect(isVerifiedRegular(w, 'rohan', court9)).toBe(false);
  });

  it('"Not now" on the smart prompt stores nothing', () => {
    let w = applyAction(seed(), { type: 'arriveAt', actAs: 'rohan', venueId: court9, minutes: 10 });
    const visitsBefore = w.visits.length;
    w = applyAction(w, { type: 'dismissPrompt', actAs: 'rohan' });
    expect(w.visits.length).toBe(visitsBefore);
    expect(w.prompt).toBeNull();
  });

  it('smart prompt does not appear when smart check-in is off', () => {
    let w = seed();
    w = applyAction(w, { type: 'setPrefs', actAs: 'rohan', prefs: { smartCheckin: false } });
    w = applyAction(w, { type: 'arriveAt', actAs: 'rohan', venueId: court9, minutes: 10 });
    expect(w.prompt).toBeNull();
  });
});

describe('Stage ladder', () => {
  it('derives every seeded stage from data', () => {
    const w = seed();
    expect(stageOf(w, 'arjun')).toBe('New');
    for (const id of ['rohan', 'ananya', 'dev']) expect(stageOf(w, id)).toBe('Exploring');
    for (const id of ['neha', 'tanvi', 'ishita', 'sana', 'vikram', 'priya', 'rahul', 'sameer'])
      expect(stageOf(w, id)).toBe('Regular');
    for (const id of ['aman', 'kabir']) expect(stageOf(w, id)).toBe('In a toli');
  });

  it('Haryashwa moves from Exploring to Regular after his third visit', () => {
    expect(stageOf(logRohanVisit(seed()), 'rohan')).toBe('Regular');
    expect(regularVenues(logRohanVisit(seed()), 'rohan')).toEqual([court9]);
  });
});

describe('Plans: venue reveal and I am here window', () => {
  it('exact venue is visible only to members', () => {
    const w = seed();
    const sketch = w.plans.find((p) => p.id === 'plan-sketch')!;
    expect(canSeeVenue(sketch, 'ishita')).toBe(true);
    expect(canSeeVenue(sketch, 'rohan')).toBe(false);
    const joined = applyAction(w, { type: 'joinPlan', actAs: 'rohan', planId: 'plan-sketch' });
    expect(canSeeVenue(joined.plans.find((p) => p.id === 'plan-sketch')!, 'rohan')).toBe(true);
  });

  it('a full plan cannot be joined and leaving is always possible', () => {
    let w = seed();
    w = applyAction(w, { type: 'joinPlan', actAs: 'rohan', planId: 'plan-pickle' });
    w = applyAction(w, { type: 'joinPlan', actAs: 'sameer', planId: 'plan-pickle' });
    const full = w.plans.find((p) => p.id === 'plan-pickle')!;
    expect(full.members.length).toBe(4);
    w = applyAction(w, { type: 'joinPlan', actAs: 'rahul', planId: 'plan-pickle' });
    expect(w.plans.find((p) => p.id === 'plan-pickle')!.members).not.toContain('rahul');
    w = applyAction(w, { type: 'leavePlan', actAs: 'rohan', planId: 'plan-pickle' });
    expect(w.plans.find((p) => p.id === 'plan-pickle')!.members).not.toContain('rohan');
  });

  it("I'm here opens 15 minutes before and closes 60 minutes after the start", () => {
    const plan = seed().plans.find((p) => p.id === 'plan-sketch')!;
    expect(imHereOpen(plan, plan.start - 16 * MINUTE)).toBe(false);
    expect(imHereOpen(plan, plan.start - 15 * MINUTE)).toBe(true);
    expect(imHereOpen(plan, plan.start + 60 * MINUTE)).toBe(true);
    expect(imHereOpen(plan, plan.start + 61 * MINUTE)).toBe(false);
  });

  it('attendance counts only through I am here in the window', () => {
    let w = seed();
    w = applyAction(w, { type: 'joinPlan', actAs: 'rohan', planId: 'plan-sketch' });
    w = applyAction(w, { type: 'imHere', actAs: 'rohan', planId: 'plan-sketch' });
    expect(w.plans.find((p) => p.id === 'plan-sketch')!.attended).not.toContain('rohan');
  });
});

describe('Women-only mode', () => {
  it('women-only plans are invisible to men and visible to women', () => {
    const w = seed();
    expect(visiblePlans(w, 'rohan').map((p) => p.id)).not.toContain('plan-5k');
    expect(visiblePlans(w, 'ananya').map((p) => p.id)).toContain('plan-5k');
  });

  it('a woman with women-only on sees only women-only or women-hosted plans', () => {
    const plans = visiblePlans(seed(), 'ananya');
    const w = seed();
    for (const p of plans) expect(p.womenOnly || w.users[p.hostId].gender === 'F').toBe(true);
  });
});

describe('Meet again reveal', () => {
  it('reveals only mutual picks', () => {
    const plan = {
      ...seed().plans.find((p) => p.id === 'plan-sketch')!,
      meetAgain: { rohan: ['aman', 'kabir'], aman: ['rohan'], kabir: ['aman'] },
    };
    expect(revealedPicks(plan, 'rohan')).toEqual(['aman']);
    expect(revealedPicks(plan, 'kabir')).toEqual([]);
    expect(revealedPicks(plan, 'aman')).toEqual(['rohan']);
  });

  it('meet_again_pick events never name the person picked', () => {
    let w = seed();
    const plan = w.plans.find((p) => p.id === 'plan-past-1024')!;
    w = applyAction(w, { type: 'meetAgain', actAs: 'aman', planId: plan.id, picks: ['kabir'] });
    const ev = w.events.filter((e) => e.type === 'meet_again_pick').at(-1)!;
    expect(JSON.stringify(ev.props)).not.toContain('kabir');
  });
});

describe('Safety: report, block, flagged', () => {
  it('the seeded flagged user has two open reports', () => {
    expect(isFlagged(seed(), 'rocky')).toBe(true);
    expect(isFlagged(seed(), 'aman')).toBe(false);
  });

  it('blocking hides both ways and unblock restores', () => {
    let w = applyAction(seed(), { type: 'block', actAs: 'rohan', against: 'rahul' });
    expect(isHiddenBetween(w, 'rohan', 'rahul')).toBe(true);
    expect(isHiddenBetween(w, 'rahul', 'rohan')).toBe(true);
    w = applyAction(w, { type: 'unblock', actAs: 'rohan', against: 'rahul' });
    expect(isHiddenBetween(w, 'rohan', 'rahul')).toBe(false);
  });

  it('report with "also block" creates a report event and a block', () => {
    const w = applyAction(seed(), {
      type: 'report',
      actAs: 'ananya',
      against: 'rocky',
      reason: 'Asked about my routine or location',
      note: '',
      alsoBlock: true,
    });
    expect(w.events.some((e) => e.type === 'report' && e.userId === 'ananya')).toBe(true);
    expect(isHiddenBetween(w, 'ananya', 'rocky')).toBe(true);
  });
});
