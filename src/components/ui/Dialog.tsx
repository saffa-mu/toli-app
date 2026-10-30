import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './Button';
import { OverlayPortal } from './Overlay';

/** Confirmation dialog used before location-related or destructive actions. */
export function Dialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const titleId = useId();
  const confirm = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirm.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  return (
    <OverlayPortal>
      <AnimatePresence>
        {open && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              className="absolute inset-0 bg-ink/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCancel}
              aria-hidden
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="relative w-full rounded-card bg-white p-5 shadow-lift"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18 }}
            >
              <h2 id={titleId} className="font-display text-lg font-semibold">
                {title}
              </h2>
              <p className="mt-2 text-base text-ink-soft">{body}</p>
              {children}
              <div className="mt-5 flex flex-col gap-2">
                <Button ref={confirm} variant={tone} block onClick={onConfirm}>
                  {confirmLabel}
                </Button>
                <Button variant="ghost" block onClick={onCancel}>
                  {cancelLabel}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </OverlayPortal>
  );
}
