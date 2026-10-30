import { Home, MapPin, MessageCircle, User, Users } from 'lucide-react';
import { useEffect, useRef, useState, type ContextType, type ReactNode } from 'react';
import {
  MemoryRouter,
  NavLink,
  Route,
  Routes,
  UNSAFE_LocationContext,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { OverlayRootContext, Toast, cx, type ToastItem } from '@/components/ui';
import { useDemo } from '@/store';
import { CelebrateScreen } from '@/features/checkin/CelebrateScreen';
import { CheckinScreen } from '@/features/checkin/CheckinScreen';
import { PromptSheet } from '@/features/checkin/PromptSheet';
import { ChatScreen } from '@/features/chat/ChatScreen';
import { ChatsScreen, unreadTotal } from '@/features/chat/ChatsScreen';
import { HomeScreen } from '@/features/home/HomeScreen';
import { SignupFlow } from '@/features/onboarding/SignupFlow';
import { RecommendScreen } from '@/features/onboarding/RecommendScreen';
import { WelcomeScreen } from '@/features/onboarding/WelcomeScreen';
import { VerifyScreen } from '@/features/profile/VerifyScreen';
import { PeopleScreen } from '@/features/people/PeopleScreen';
import { MeScreen } from '@/features/profile/MeScreen';
import { SafetyScreen } from '@/features/safety/SafetyScreen';
import { PlanScreen } from '@/features/tolis/PlanScreen';
import { TolisScreen } from '@/features/tolis/TolisScreen';
import { PhoneContext, usePhone } from './phone';

const FULLSCREEN = ['/welcome', '/signup', '/chat/', '/celebrate', '/recommend'];

function TabBar() {
  const { world, me } = usePhone();
  const unread = unreadTotal(world, me);
  const tab = (to: string, label: string, Icon: typeof Home, badge?: number) => (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cx(
          'relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium',
          isActive ? 'text-teal-800' : 'text-ink-muted',
        )
      }
    >
      <Icon className="h-5 w-5" aria-hidden />
      {label}
      {!!badge && (
        <span className="absolute right-[22%] top-1.5 min-w-[18px] rounded-full bg-teal px-1 text-center text-[11px] font-semibold leading-[18px] text-white">
          {badge}
        </span>
      )}
    </NavLink>
  );
  return (
    <nav
      aria-label="Main"
      className="relative z-20 flex shrink-0 items-end border-t border-hairline bg-white px-1 pb-1"
    >
      {tab('/', 'Home', Home)}
      {tab('/tolis', 'Tolis', Users)}
      <NavLink
        to="/checkin"
        className="flex h-14 flex-1 flex-col items-center justify-end gap-0.5 text-xs font-medium text-teal-800"
        data-testid="tab-checkin"
      >
        <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-teal text-white shadow-lift ring-4 ring-paper">
          <MapPin className="h-5 w-5" aria-hidden />
        </span>
        Check in
      </NavLink>
      {tab('/chats', 'Chats', MessageCircle, unread)}
      {tab('/me', 'Me', User)}
    </nav>
  );
}

/** When someone accepts my request, the new 1:1 chat opens on my phone too. */
function AutoOpenChat() {
  const { world, me } = usePhone();
  const navigate = useNavigate();
  const accepted = world.connections
    .filter((c) => c.from === me && c.status === 'connected')
    .map((c) => c.to);
  const known = useRef(new Set(accepted));
  useEffect(() => {
    const fresh = accepted.find((id) => !known.current.has(id));
    known.current = new Set(accepted);
    if (!fresh) return;
    const conv = world.conversations.find(
      (c) => c.kind === 'dm' && c.members.includes(me) && c.members.includes(fresh),
    );
    if (conv) navigate(`/chat/${conv.id}`);
  }, [accepted, world.conversations, me, navigate]);
  return null;
}

function Toasts() {
  const { world, me } = usePhone();
  const seen = useDemo((s) => s.seenNotifs);
  const markSeen = useDemo((s) => s.markNotifsSeen);
  const navigate = useNavigate();
  const next = world.notifications.find((n) => n.userId === me && !seen.includes(n.id));
  const nextId = next?.id;
  useEffect(() => {
    if (!nextId) return;
    const t = setTimeout(() => markSeen([nextId]), 3200);
    return () => clearTimeout(t);
  }, [nextId, markSeen]);
  const item: ToastItem | null = next
    ? {
        id: next.id,
        text: next.text,
        onOpen: () => {
          markSeen([next.id]);
          if (next.link) navigate(next.link);
        },
      }
    : null;
  return <Toast item={item} />;
}

function Screens() {
  const { pathname } = useLocation();
  const showTabs = !FULLSCREEN.some((p) => pathname.startsWith(p));
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [pathname]);
  const routes = (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/welcome" element={<WelcomeScreen />} />
      <Route path="/signup/:step" element={<SignupFlow />} />
      <Route path="/recommend" element={<RecommendScreen />} />
      <Route path="/verify" element={<VerifyScreen />} />
      <Route path="/checkin" element={<CheckinScreen />} />
      <Route path="/celebrate/:venueId" element={<CelebrateScreen />} />
      <Route path="/people" element={<PeopleScreen />} />
      <Route path="/tolis" element={<TolisScreen />} />
      <Route path="/plan/:planId" element={<PlanScreen />} />
      <Route path="/chats" element={<ChatsScreen />} />
      <Route path="/chat/:convId" element={<ChatScreen />} />
      <Route path="/me" element={<MeScreen />} />
      <Route path="/safety" element={<SafetyScreen />} />
      <Route path="*" element={<HomeScreen />} />
    </Routes>
  );
  return (
    <>
      <div ref={scroller} className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto" data-scroll>
        {routes}
        {showTabs && <div className="h-10" aria-hidden />}
      </div>
      {showTabs && <TabBar />}
      <Toasts />
      <PromptSheet />
    </>
  );
}

/**
 * Each phone needs its own history while the page itself uses a HashRouter. React Router forbids
 * nesting routers, so the phone's MemoryRouter is rendered outside the page router's location context.
 */
function IsolatedRouter({ initial, children }: { initial: string; children: ReactNode }) {
  return (
    <UNSAFE_LocationContext.Provider value={null as unknown as ContextType<typeof UNSAFE_LocationContext>}>
      <MemoryRouter
        initialEntries={[initial]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        {children}
      </MemoryRouter>
    </UNSAFE_LocationContext.Provider>
  );
}

/** One phone's worth of app: its own router, overlay layer and "me". */
export function PhoneApp({
  idx,
  me,
}: {
  idx: 0 | 1;
  me: string;
}) {
  const initial = useDemo.getState().signup ? '/' : '/welcome';
  const [overlay, setOverlay] = useState<HTMLDivElement | null>(null);
  return (
    <PhoneContext.Provider value={{ idx, me, surface: 'phone' }}>
      <OverlayRootContext.Provider value={overlay}>
        <IsolatedRouter initial={initial} key={me}>
          <AutoOpenChat />
          <div className="relative flex min-h-0 flex-1 flex-col" data-testid={`phone-${idx}`} data-user={me}>
            <Screens />
            <div
              ref={setOverlay}
              className="pointer-events-none absolute inset-0 z-40 [&>*]:pointer-events-auto"
            />
          </div>
        </IsolatedRouter>
      </OverlayRootContext.Provider>
    </PhoneContext.Provider>
  );
}
