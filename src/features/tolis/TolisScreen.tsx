import { Lock, Tent } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Card, EmptyState, SectionTitle, Tabs } from '@/components/ui';
import { peopleFor } from '@/lib/matching/score';
import { visiblePlans } from '@/lib/rules/plans';
import { usePhone } from '@/features/shell/phone';
import { HostForm } from './HostForm';
import { PlanCard } from './PlanCard';
import { SuggestedToliCard } from './SuggestedToliCard';

type Tab = 'foryou' | 'host';

export function TolisScreen() {
  const { world, me } = usePhone();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'host' ? 'host' : 'foryou';
  const locked = peopleFor(world, me).locked;
  const suggested = world.tolis.filter(
    (t) => t.members.some((m) => m.userId === me) && t.status !== 'closed',
  );
  const toliPlanIds = new Set(suggested.map((t) => t.planId));
  const plans = visiblePlans(world, me).filter((p) => !toliPlanIds.has(p.id));

  return (
    <div className="px-4 pb-6 pt-3">
      <h1 className="mb-3 font-display text-2xl font-semibold">Tolis</h1>
      <Tabs<Tab>
        label="Tolis"
        value={tab}
        onChange={(v) => setParams(v === 'host' ? { tab: 'host' } : {})}
        options={[
          { value: 'foryou', label: 'Tolis for you' },
          { value: 'host', label: 'Host a toli' },
        ]}
      />
      <div className="mt-4">
        {tab === 'host' ? (
          <HostForm />
        ) : (
          <>
            <section className="mb-6" aria-labelledby="sugg-h">
              <SectionTitle>
                <span id="sugg-h">Suggested for you</span>
              </SectionTitle>
              {locked ? (
                <Card tone="teal" className="flex items-start gap-3 p-4">
                  <Lock className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />
                  <p className="text-sm text-ink">
                    Suggested groups unlock when you're a Verified Regular. They're built from people who
                    share your place and time.
                  </p>
                </Card>
              ) : suggested.length === 0 ? (
                <Card tone="mist" className="p-4 text-sm text-ink-soft">
                  No group suggestions this week. Try an open plan below.
                </Card>
              ) : (
                <div className="flex flex-col gap-3">
                  {suggested.map((t) => (
                    <SuggestedToliCard key={t.id} toli={t} />
                  ))}
                </div>
              )}
            </section>
            <section aria-labelledby="open-h">
              <SectionTitle>
                <span id="open-h">Open plans near you</span>
              </SectionTitle>
              {plans.length === 0 ? (
                <EmptyState
                  icon={<Tent className="h-6 w-6" aria-hidden />}
                  title="No open plans right now"
                  body="Be the first: host a small plan at your place. 3 to 6 people, in public."
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {plans.map((p) => (
                    <PlanCard key={p.id} plan={p} cta={p.members.includes(me) ? 'Open plan' : 'See plan'} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
