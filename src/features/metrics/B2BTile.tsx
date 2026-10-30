import type { PartnerSource, World } from '@/lib/types';

/** Simulated pilot leads/bookings per listing site; live demo bookings are added on top. */
const BASE: Record<PartnerSource, { leads: number; booked: number; avg: number }> = {
  District: { leads: 142, booked: 38, avg: 320 },
  BookMyShow: { leads: 96, booked: 22, avg: 260 },
  TripAdvisor: { leads: 188, booked: 31, avg: 210 },
  'Venue site': { leads: 64, booked: 19, avg: 400 },
};
const GROUP = 4;
const COMMISSION = 0.12;

export function B2BTile({ world }: { world: World }) {
  const rows = (Object.keys(BASE) as PartnerSource[]).map((src) => {
    const live = (t: string) =>
      world.events.filter((e) => e.type === t && e.props.source === src && !e.id.startsWith('e-seed')).length;
    const leads = BASE[src].leads + live('partner_click');
    const booked = BASE[src].booked + live('partner_booked');
    return { src, leads, booked, conv: booked / leads, revenue: Math.round(booked * BASE[src].avg * GROUP * COMMISSION) };
  });
  const sum = (k: 'leads' | 'booked' | 'revenue') => rows.reduce((s, r) => s + r[k], 0);
  const partners = Object.values(world.venues).filter((v) => v.partner);
  const liveBooked = world.events.filter((e) => e.type === 'partner_booked').length;
  const asked = world.activitySuggestions.reduce<Record<string, number>>((m, s) => {
    m[s.text] = (m[s.text] ?? 0) + 1;
    return m;
  }, {});
  const kpi = (label: string, value: string) => (
    <div className="rounded-btn bg-mist p-3">
      <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
  return (
    <div data-testid="b2b-tile">
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {kpi('Partner and sponsored venues', String(partners.length))}
        {kpi('Leads sent to listing sites', String(sum('leads')))}
        {kpi('Tolis and users converted', String(sum('booked')))}
        {kpi(`Est. commission (₹, ${COMMISSION * 100}%)`, sum('revenue').toLocaleString('en-IN'))}
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-ink-muted">
          <tr>
            <th className="py-1">Source</th>
            <th>Leads</th>
            <th>Booked</th>
            <th>Conversion</th>
            <th>₹ commission</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.src} className="border-t border-hairline">
              <td className="py-1.5 font-semibold">{r.src}</td>
              <td className="tabular-nums">{r.leads}</td>
              <td className="tabular-nums">{r.booked}</td>
              <td className="tabular-nums">{(r.conv * 100).toFixed(0)}%</td>
              <td className="tabular-nums">{r.revenue.toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-ink-muted" data-testid="b2b-live">
        {liveBooked > 0
          ? `${liveBooked} booking${liveBooked > 1 ? 's' : ''} made in this demo are included.`
          : 'Book a partner place from a joined plan to see a live lead appear here.'}
      </p>
      {Object.keys(asked).length > 0 && (
        <p className="mt-1 text-xs text-ink-muted">
          New activities requested: {Object.entries(asked).map(([k, n]) => `${k} (${n})`).join(', ')}
        </p>
      )}
    </div>
  );
}
