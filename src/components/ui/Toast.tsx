import { AnimatePresence, motion } from 'framer-motion';
import { Bell } from 'lucide-react';

export interface ToastItem {
  id: string;
  text: string;
  onOpen?: () => void;
}

/** Notification toast at the top of the phone. */
export function Toast({ item }: { item: ToastItem | null }) {
  return (
    <div className="pointer-events-none absolute inset-x-3 top-12 z-[60]" aria-live="polite">
      <AnimatePresence>
        {item && (
          <motion.button
            key={item.id}
            type="button"
            onClick={item.onOpen}
            data-testid="toast"
            className="pointer-events-auto flex w-full items-center gap-3 rounded-card border border-hairline bg-white p-3 text-left shadow-lift"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal text-white">
              <Bell className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-sm font-medium text-ink">{item.text}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
