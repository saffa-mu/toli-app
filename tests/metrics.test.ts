import { describe, expect, it } from 'vitest';
import { buildSeedWorld } from '@/data/seed';
import { applyAction } from '@/lib/world/reducer';
import { computeMetrics, BASELINE } from '@/lib/metrics';

describe('Founder metrics', () => {
  it('baseline North Star is 17.2% of 180 MAU', () => {
    expect(BASELINE.repeatUsers / BASELINE.mau).toBeCloseTo(0.172, 3);
  });

  it('Activation is the weakest funnel stage', () => {
    const m = computeMetrics(buildSeedWorld());
    expect(m.funnel.weakest).toBe('Activation');
  });

  it('guardrails start green and a live "No" breaches felt-safe', () => {
    const w = buildSeedWorld();
    const m = computeMetrics(w);
    expect(m.guardrails.every((g) => g.ok)).toBe(true);
    const plan = w.plans.find((p) => p.id === 'plan-past-1024')!;
    const after = applyAction(w, { type: 'feltSafe', actAs: 'aman', planId: plan.id, answer: 'no' });
    const felt = computeMetrics(after).guardrails.find((g) => g.key === 'feltSafe')!;
    expect(felt.ok).toBe(false);
  });

  it('metric tree product equals the North Star baseline', () => {
    const t = computeMetrics(buildSeedWorld()).tree;
    expect(t.connected * t.conversion * t.repeat).toBeCloseTo(BASELINE.repeatUsers / BASELINE.mau, 2);
  });
});
