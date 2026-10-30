import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Each phone provides its own overlay layer so sheets and dialogs stay inside that phone. */
export const OverlayRootContext = createContext<HTMLElement | null>(null);

export function OverlayPortal({ children }: { children: ReactNode }) {
  const root = useContext(OverlayRootContext);
  return root ? createPortal(children, root) : null;
}
