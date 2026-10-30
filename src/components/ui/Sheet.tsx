import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconButton } from './Button';
import { OverlayPortal } from './Overlay';

/** Bottom sheet that slides up inside the phone. Escape or the backdrop closes it. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  testId,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  testId?: string;
}) {
  const reduce = useReducedMotion();
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <OverlayPortal>
      <AnimatePresence>
        {open && (
          <div className="absolute inset-0 z-40 flex flex-col justify-end">
            <motion.div
              className="absolute inset-0 bg-ink/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              aria-hidden
            />
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              data-testid={testId}
              className="relative flex max-h-[88%] flex-col rounded-t-sheet bg-paper shadow-lift outline-none"
              initial={reduce ? { opacity: 0 } : { y: '100%' }}
              animate={reduce ? { opacity: 1 } : { y: 0 }}
              exit={reduce ? { opacity: 0 } : { y: '100%' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-hairline" aria-hidden />
              <div className="flex items-center justify-between gap-2 px-4 pb-1 pt-2">
                <h2 id={titleId} className="font-display text-xl font-semibold">
                  {title}
                </h2>
                <IconButton label="Close" onClick={onClose}>
                  <X className="h-5 w-5" />
                </IconButton>
              </div>
              <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-4">{children}</div>
              {footer && <div className="border-t border-hairline bg-paper px-4 pb-5 pt-3">{footer}</div>}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </OverlayPortal>
  );
}
