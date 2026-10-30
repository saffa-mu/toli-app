import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { buildSeedWorld } from '@/data/seed';
import type { World } from '@/lib/types';
import type { Action } from '@/lib/world/actions';
import { botReactions, type BotContext } from '@/lib/world/bots';
import { applyAction } from '@/lib/world/reducer';
import { safeStorage } from './storage';

/** The signed-in person in this app. Everyone else is a simulated neighbour. */
export const ME = 'rohan';

export interface AppState {
  world: World;
  /** Always off in the app; kept so shared screens can ask. */
  lens: boolean;
  seenNotifs: string[];
  /** Bumped on reset so the app restarts from the welcome screen. */
  epoch: number;
  /** The sign-up the user completed. Its presence means "signed up". */
  signup?: Action;

  dispatch: (action: Action) => void;
  reset: () => void;
  markNotifsSeen: (ids: string[]) => void;
}

const timers = new Set<ReturnType<typeof setTimeout>>();
function clearTimers() {
  for (const t of timers) clearTimeout(t);
  timers.clear();
}

const freshWorld = () => buildSeedWorld(true);

export const useDemo = create<AppState>()(
  persist(
    (set, get) => ({
      world: freshWorld(),
      lens: false,
      seenNotifs: [],
      epoch: 0,

      dispatch: (action) => {
        if (action.type === 'completeSignup' && action.actAs === ME) set({ signup: action });
        const prev = get().world;
        const next = applyAction(prev, action);
        set({ world: next });
        // Neighbours react on their own timers: replies, accepts, toli joins.
        const ctx: BotContext = { autopilot: true, controlled: [ME], primary: ME };
        for (const r of botReactions(prev, next, action, ctx)) {
          const t = setTimeout(() => {
            timers.delete(t);
            get().dispatch(r.action);
          }, r.delayMs);
          timers.add(t);
        }
      },

      reset: () => {
        clearTimers();
        const world = freshWorld();
        set((s) => ({
          world,
          epoch: s.epoch + 1,
          signup: undefined,
          seenNotifs: world.notifications.map((x) => x.id),
        }));
      },

      markNotifsSeen: (ids) => set((s) => ({ seenNotifs: [...new Set([...s.seenNotifs, ...ids])] })),
    }),
    {
      name: 'toli-app-v1',
      version: 1,
      storage: createJSONStorage(safeStorage),
      partialize: (s) => ({ world: s.world, seenNotifs: s.seenNotifs, signup: s.signup }),
      // Typing indicators never survive a reload.
      onRehydrateStorage: () => (state) => {
        if (state) state.world = { ...state.world, typing: {} };
      },
    },
  ),
);
