import { Route, Routes } from 'react-router-dom';
import { PhoneScreen } from '@/components/ui';
import { formatClock } from '@/lib/clock';
import { ErrorBoundary } from '@/features/demo/ErrorBoundary';
import { FounderView } from '@/features/metrics/FounderView';
import { PhoneApp } from '@/features/shell/PhoneApp';
import { ME, useDemo } from '@/store';

/** The product: one app, full screen on a phone, a centred column on a laptop. */
function Shell() {
  const clock = useDemo((s) => s.world.clock);
  const epoch = useDemo((s) => s.epoch);
  return (
    <div className="flex h-[100dvh] justify-center bg-[#EFEAE1]">
      <div className="flex h-full w-full max-w-[430px] flex-col bg-paper sm:shadow-lift">
        <PhoneScreen clock={formatClock(clock)}>
          <PhoneApp key={epoch} idx={0} me={ME} />
        </PhoneScreen>
      </div>
    </div>
  );
}

export function App() {
  const epoch = useDemo((s) => s.epoch);
  return (
    <ErrorBoundary key={epoch}>
      <Routes>
        <Route path="/founder" element={<FounderView />} />
        <Route path="*" element={<Shell />} />
      </Routes>
    </ErrorBoundary>
  );
}
