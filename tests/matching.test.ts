import { describe, expect, it } from 'vitest';
import { buildSeedWorld } from '@/data/seed';
import { applyAction } from '@/lib/world/reducer';
import { peopleFor, scorePair, eligibleCandidates } from '@/lib/matching/score';
import { WEIGHTS } from '@/lib/matching/weights';
import { suggestGroups } from '@/lib/rules/tolis';
import type { World } from '@/lib/types';

function rohanRegular(): World {
  let w = applyAction(buildSeedWorld(), { type: 'logVisit', actAs: 'rohan', venueId: 'court9' });
  // Two photo moments take him to Trusted (75%).
  for (let i = 0; i < 2; i++) w = applyAction(w, { type: 'addMoment', actAs: 'rohan', venueId: 'court9' });
  return w;
}

describe('Discovery gate', () => {
  it('is locked until the viewer is a Verified Regular', () => {
    const before = peopleFor(buildSeedWorld(), 'rohan');
    expect(before.locked).toBe(true);
    expect(before.matches).toEqual([]);
    expect(before.teaserCount).toBeGreaterThan(0);
    expect(peopleFor(rohanRegular(), 'rohan').locked).toBe(false);
  });
});

describe('Matching score', () => {
  it('weights sum to 1', () => {
    const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it("produces Haryashwa's expected ranking", () => {
    const { matches } = peopleFor(rohanRegular(), 'rohan');
    const ids = matches.map((m) => m.userId);
    expect(ids.length).toBe(5);
    expect(new Set(ids.slice(0, 3))).toEqual(new Set(['aman', 'kabir', 'neha']));
    for (const m of matches.slice(0, 3)) expect(m.total).toBeGreaterThan(0.85);
    expect(ids[3]).toBe('sameer');
    const rahul = scorePair(rohanRegular(), 'rohan', 'rahul');
    for (const m of matches.slice(0, 3)) expect(rahul.total).toBeLessThan(m.total);
    expect(ids).not.toContain('arjun');
    expect(ids).not.toContain('rocky');
  });

  it('total equals the weighted sum of the five components', () => {
    const r = scorePair(rohanRegular(), 'rohan', 'aman');
    const c = r.components;
    const expected =
      WEIGHTS.place * c.place +
      WEIGHTS.timeSlot * c.timeSlot +
      WEIGHTS.lifeStage * c.lifeStage +
      WEIGHTS.interests * c.interests +
      WEIGHTS.quiz * c.quiz;
    expect(r.total).toBeCloseTo(expected, 10);
    for (const v of Object.values(c)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('component rules match the spec for known pairs', () => {
    const w = rohanRegular();
    const aman = scorePair(w, 'rohan', 'aman').components;
    expect(aman.place).toBe(1);
    expect(aman.timeSlot).toBe(1);
    expect(aman.lifeStage).toBe(1);
    const sameer = scorePair(w, 'rohan', 'sameer').components;
    expect(sameer.place).toBe(0.3);
    const rahul = scorePair(w, 'rohan', 'rahul').components;
    expect(rahul.place).toBe(1);
    expect(rahul.timeSlot).toBe(0);
    expect(rahul.lifeStage).toBe(0.5);
    // same venue, but Haryashwa not yet a Regular
    expect(scorePair(buildSeedWorld(), 'rohan', 'aman').components.place).toBe(0.6);
  });

  it('builds a plain-language reason from the strongest components', () => {
    const r = scorePair(rohanRegular(), 'rohan', 'neha');
    expect(r.reason).toBe(
      "You're both Saturday-morning regulars at a court in Sector 56, and new to the city.",
    );
  });

  it('changing a seeded slot changes the ranking', () => {
    const w = rohanRegular();
    const moved: World = {
      ...w,
      users: {
        ...w.users,
        rahul: {
          ...w.users.rahul,
          routines: [{ venueId: 'court9', activity: 'badminton', days: [6], slot: 'early' }],
        },
      },
    };
    const before = scorePair(w, 'rohan', 'rahul').total;
    const after = scorePair(moved, 'rohan', 'rahul').total;
    expect(after).toBeGreaterThan(before);
  });
});

describe('Eligibility filters', () => {
  it('excludes unverified, flagged, blocked and connected users', () => {
    let w = rohanRegular();
    const ids = () => eligibleCandidates(w, 'rohan');
    expect(ids()).not.toContain('arjun');
    expect(ids()).not.toContain('rocky');
    expect(ids()).not.toContain('rohan');
    w = applyAction(w, { type: 'block', actAs: 'rahul', against: 'rohan' });
    expect(ids()).not.toContain('rahul');
    w = applyAction(w, { type: 'sendConnect', actAs: 'rohan', to: 'aman' });
    expect(ids()).toContain('aman');
    w = applyAction(w, { type: 'respondConnect', actAs: 'aman', from: 'rohan', accept: true });
    expect(ids()).not.toContain('aman');
  });

  it('never shows women-only women to men', () => {
    const ids = eligibleCandidates(rohanRegular(), 'rohan');
    for (const id of ['sana', 'ananya', 'priya']) expect(ids).not.toContain(id);
  });

  it('a woman with women-only on sees only women', () => {
    const w = buildSeedWorld();
    const ids = eligibleCandidates(w, 'ananya');
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(w.users[id].gender).toBe('F');
  });
});

describe('Suggested tolis', () => {
  it('groups top matches who share venue and slot into a toli of 3-5', () => {
    const w = rohanRegular();
    const groups = suggestGroups(w, 'rohan');
    const court = groups.find((g) => g.venueId === 'court9')!;
    expect(court).toBeDefined();
    expect(new Set(court.members)).toEqual(new Set(['rohan', 'aman', 'kabir', 'neha']));
  });

  it('forms when 3 members have accepted, with a group chat and plan', () => {
    let w = rohanRegular();
    w = applyAction(w, { type: 'acceptToli', actAs: 'rohan', toliId: 'toli-smashers' });
    const toli = w.tolis.find((t) => t.id === 'toli-smashers')!;
    expect(toli.status).toBe('formed');
    const chat = w.conversations.find((c) => c.id === toli.chatId)!;
    expect(chat.messages.some((m) => m.text === 'Toli formed: 3 of 3 accepted')).toBe(true);
    expect(chat.messages.some((m) => m.kind === 'plan')).toBe(true);
    const plan = w.plans.find((p) => p.id === toli.planId)!;
    expect(plan.spots).toBeGreaterThanOrEqual(3);
    expect(plan.spots).toBeLessThanOrEqual(6);
    expect(w.events.some((e) => e.type === 'toli_formed')).toBe(true);
  });
});
