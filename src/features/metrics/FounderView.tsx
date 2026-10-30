import { ArrowLeft, FlaskConical, ShieldAlert, ShieldCheck, Target } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LensPill } from '@/components/LensPill';
import { cx } from '@/components/ui';
import { computeMetrics, pct, type FunnelStage } from '@/lib/metrics';
import { ACTIVITIES as ACTIVITY_LIST } from '@/data/activities';
import type { Activity } from '@/lib/types';
import { useDemo } from '@/store';
import { B2BTile } from './B2BTile';

/** Animates a number towards its new value (instantly with reduced motion). */
function useAnimated(value: number, ms = 900): number {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    const a = from.current;
    if (reduce || a === value) {
      from.current = value;
      setShown(value);
      return;
    }
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(a + (value - a) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}

function Tile({
  title,
  children,
  className,
  testId,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <section
      className={cx('rounded-card border border-hairline bg-white p-5 shadow-soft', className)}
      data-testid={testId}
    >
      <h2 className="mb-3 font-display text-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function fmtStage(s: FunnelStage, v: number): string {
  if (s.format === 'pct') return pct(v, 0);
  if (s.format === 'ratio') return v.toFixed(1);
  return String(v);
}

const ACTIVITIES: (Activity | 'all')[] = ['all', ...ACTIVITY_LIST.map((a) => a.id)];

export function FounderView() {
  const world = useDemo((s) => s.world);
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | 'all'>('all');
  const [womenOnly, setWomenOnly] = useState(false);
  const m = computeMetrics(world);
  const ns = useAnimated(m.northStar.value);
  const weakest = m.funnel.weakest;
  const venues = m.venues.filter((v) => activity === 'all' || v.activities.includes(activity));

  return (
    <div className="h-full overflow-y-auto bg-paper" data-testid="founder-view">
      <div className="mx-auto max-w-[1240px] px-6 py-5">
        <header className="mb-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex h-11 items-center gap-1.5 rounded-btn border border-hairline bg-white px-3 text-sm font-semibold hover:bg-mist"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to the app
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-semibold text-ink">Founder view</h1>
            <p className="text-sm font-medium text-ink-muted">
              Founder view · simulated pilot data + live activity
            </p>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-3">
          <Tile title="North Star · Monthly Repeat Meetups" className="lg:col-span-2" testId="north-star">
            <LensPill
              framework="North Star"
              why="actionable, not vanity: it only moves when people meet again"
            />
            <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
              <p
                className="font-display text-[64px] font-semibold leading-none tabular-nums text-teal"
                data-testid="ns-value"
              >
                {(ns * 100).toFixed(1)}%
              </p>
              <div className="pb-2 text-base text-ink-soft">
                <p>
                  <strong className="text-ink">{m.northStar.numerator}</strong> of {m.northStar.denominator}{' '}
                  monthly active users met the same person 2+ times in 30 days
                </p>
                <p className="text-sm text-ink-muted">
                  Pilot baseline {pct(m.northStar.baseline)} (31 of 180) · live demo adds{' '}
                  {m.northStar.liveRepeat} of {m.northStar.liveActive}
                </p>
              </div>
            </div>
            <div
              className="relative mt-4 h-4 rounded-full bg-teal-50"
              role="img"
              aria-label={`Progress to 25% target: ${pct(ns)}`}
            >
              <div
                className="h-full rounded-full bg-teal transition-[width] duration-slow"
                style={{ width: `${Math.min(100, (ns / 0.3) * 100)}%` }}
              />
              <span
                className="absolute top-[-6px] h-7 w-1 rounded bg-ink"
                style={{ left: `${(0.25 / 0.3) * 100}%` }}
                aria-hidden
              />
            </div>
            <div className="mt-1.5 flex justify-between text-sm text-ink-muted">
              <span>0%</span>
              <span className="font-semibold text-ink">Target 25% of MAU by month 6</span>
            </div>
          </Tile>

          <Tile title="Metric spec" testId="metric-spec">
            <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5 text-sm">
              {[
                ['Definition', 'Share of MAU who met the same person in person 2+ times'],
                ['Formula', 'repeat users ÷ monthly active users'],
                ['Window', 'Rolling 30 days'],
                ['Segments', 'Venue, activity, women-only'],
                ['Source', '"I\'m here" attendance events'],
                ['Owner', 'Product lead'],
                ['Target', '25% by month 6'],
                ['Guardrail', 'Felt safe ≥ 95%'],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="font-semibold text-ink-muted">{k}</dt>
                  <dd className="text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </Tile>

          <Tile title="Metric tree" className="lg:col-span-3" testId="metric-tree">
            <div className="flex flex-wrap items-stretch gap-3 text-center">
              {[
                {
                  label: 'Repeat Meetups (pilot cohort)',
                  value: pct(m.tree.connected * m.tree.conversion * m.tree.repeat),
                  strong: true,
                },
                { op: '=' },
                {
                  label: 'Connected users',
                  value: pct(m.tree.connected, 0),
                  inputs: [
                    `${m.tree.inputs.regularsPerVenue.toFixed(1)} regulars per venue`,
                    `${pct(m.tree.inputs.suggestionAcceptance, 0)} suggestion acceptance`,
                  ],
                },
                { op: '×' },
                {
                  label: 'Meetup conversion',
                  value: pct(m.tree.conversion, 0),
                  inputs: [
                    `${m.tree.inputs.tolisHappened} of ${m.tree.inputs.tolisPosted} past plans happened`,
                    `${pct(m.tree.inputs.showUpRate, 0)} show-up rate`,
                  ],
                },
                { op: '×' },
                {
                  label: 'Repeat rate',
                  value: pct(m.tree.repeat, 0),
                  inputs: [
                    `${pct(m.tree.inputs.mutualRate, 0)} mutual meet-again`,
                    `${pct(m.tree.inputs.nextPlanWithin7d, 0)} next plan within 7 days`,
                  ],
                },
              ].map((n, i) =>
                'op' in n ? (
                  <span
                    key={i}
                    className="flex items-center font-display text-3xl text-ink-muted"
                    aria-hidden
                  >
                    {n.op}
                  </span>
                ) : (
                  <div
                    key={i}
                    className={cx(
                      'min-w-[150px] flex-1 rounded-card p-3',
                      n.strong ? 'bg-teal text-white' : 'bg-mist',
                    )}
                  >
                    <p className={cx('text-sm font-semibold', n.strong ? 'text-teal-50' : 'text-ink-muted')}>
                      {n.label}
                    </p>
                    <p className="font-display text-[40px] font-semibold leading-tight tabular-nums">
                      {n.value}
                    </p>
                    {n.inputs?.map((x) => (
                      <p key={x} className="text-sm text-ink-soft">
                        {x}
                      </p>
                    ))}
                  </div>
                ),
              )}
            </div>
            <p className="mt-2 text-sm text-ink-muted">
              Discovery → meeting → repeat. Inputs are computed from the demo world plus the pilot baseline.
            </p>
          </Tile>

          <Tile title="Guardrails" testId="guardrails">
            <LensPill framework="Guardrail metrics" why="Goodhart's law: never trade safety for growth" />
            <ul className="flex flex-col gap-2">
              {m.guardrails.map((g) => (
                <li
                  key={g.key}
                  data-testid={`guardrail-${g.key}`}
                  data-ok={g.ok}
                  className={cx(
                    'flex items-center gap-3 rounded-btn p-3',
                    g.ok ? 'bg-teal-50' : 'bg-coral-700 text-white',
                  )}
                >
                  {g.ok ? (
                    <ShieldCheck className="h-6 w-6 shrink-0 text-teal" aria-hidden />
                  ) : (
                    <ShieldAlert className="h-6 w-6 shrink-0" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{g.label}</p>
                    <p className={cx('text-sm', g.ok ? 'text-ink-muted' : 'text-white')}>
                      Threshold {g.threshold} · {g.ok ? 'OK' : 'Breached'}
                    </p>
                  </div>
                  <span className="font-display text-2xl font-semibold tabular-nums">{g.display}</span>
                </li>
              ))}
            </ul>
          </Tile>

          <Tile title="AARRR funnel" className="lg:col-span-2" testId="funnel">
            <ul className="flex flex-col gap-2">
              {m.funnel.stages.map((s) => {
                const isWeak = s.name === weakest;
                const ratio = s.target ? s.actual / s.target : 0;
                return (
                  <li
                    key={s.name}
                    data-testid={`funnel-${s.name}`}
                    data-weakest={isWeak}
                    className={cx(
                      'grid grid-cols-[120px,1fr,auto] items-center gap-3 rounded-btn p-2.5',
                      isWeak ? 'bg-marigold-50 ring-2 ring-marigold' : 'bg-mist',
                    )}
                  >
                    <span className="font-semibold">{s.name}</span>
                    <div>
                      <p className="text-sm text-ink-muted">{s.definition}</p>
                      {s.target > 0 && (
                        <div className="mt-1 h-2.5 rounded-full bg-white">
                          <div
                            className={cx('h-full rounded-full', isWeak ? 'bg-marigold' : 'bg-teal')}
                            style={{ width: `${Math.min(100, ratio * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <span className="text-right text-sm tabular-nums">
                      {s.target > 0 ? (
                        <>
                          <strong className="text-base">{fmtStage(s, s.actual)}</strong> vs{' '}
                          {fmtStage(s, s.target)}
                        </>
                      ) : (
                        'Not live'
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 flex items-start gap-2 rounded-btn bg-marigold-50 p-3 text-sm text-ink">
              <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-marigold-600" aria-hidden />
              <span>
                <strong>Weakest stage: {weakest}.</strong> Next experiment: seed each venue with a partner
                club's session as an open toli.
              </span>
            </p>
          </Tile>

          <Tile title="Hypothesis tracker" testId="hypothesis">
            <p className="mb-3 text-sm text-ink-soft">
              30% of matched users meet within two weeks; half of them meet again.
            </p>
            {[
              { label: 'Met within 2 weeks', n: m.hypothesis.met, d: m.hypothesis.matched, target: 0.3 },
              { label: 'Of those, met again', n: m.hypothesis.metAgain, d: m.hypothesis.met, target: 0.5 },
            ].map((h) => {
              const r = h.d ? h.n / h.d : 0;
              return (
                <div key={h.label} className="mb-3">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold">{h.label}</span>
                    <span className="tabular-nums">
                      <strong className="font-display text-2xl">{pct(r, 0)}</strong> ({h.n}/{h.d}) · target{' '}
                      {pct(h.target, 0)}
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 rounded-full bg-mist">
                    <div
                      className="h-full rounded-full bg-teal"
                      style={{ width: `${Math.min(100, r * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="flex items-center gap-1.5 text-sm text-ink-muted">
              <Target className="h-4 w-4" aria-hidden /> Pilot baseline + live demo matches
            </p>
          </Tile>

          <Tile title="B2B: partner leads and conversions (District, BookMyShow, TripAdvisor, venue sites)" className="lg:col-span-3" testId="b2b">
            <B2BTile world={world} />
          </Tile>

          <Tile title="Venues" className="lg:col-span-2" testId="venues">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {ACTIVITIES.map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={activity === a}
                  onClick={() => setActivity(a)}
                  className={cx(
                    'h-11 rounded-full border px-4 text-sm font-semibold capitalize',
                    activity === a ? 'border-teal bg-teal text-white' : 'border-hairline bg-white',
                  )}
                >
                  {a}
                </button>
              ))}
              <label className="ml-auto flex h-11 items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[#0F766E]"
                  checked={womenOnly}
                  onChange={(e) => setWomenOnly(e.target.checked)}
                />
                Women-only cut
              </label>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-hairline text-ink-muted">
                  <th className="py-2 font-semibold">Venue</th>
                  <th className="py-2 text-right font-semibold">
                    {womenOnly ? 'Women regulars' : 'Regulars'}
                  </th>
                  <th className="py-2 text-right font-semibold">
                    {womenOnly ? 'Women-only tolis' : 'Tolis posted'}
                  </th>
                  <th className="py-2 text-right font-semibold">Happened</th>
                </tr>
              </thead>
              <tbody>
                {venues.map((v) => (
                  <tr key={v.venueId} className="border-b border-hairline last:border-0">
                    <td className="py-2">
                      <span className="font-semibold">{v.name}</span>{' '}
                      <span className="text-ink-muted">· Sector {v.sector}</span>
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {womenOnly ? v.womenRegulars : v.regulars}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {womenOnly ? v.womenOnlyPosted : v.posted}
                    </td>
                    <td className="py-2 text-right tabular-nums">{v.happened}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tile>
        </div>

      </div>
    </div>
  );
}
