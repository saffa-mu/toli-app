import { BatteryFull, Signal, Wifi } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from './cx';

export const PHONE_W = 390;
export const PHONE_H = 844;
export const BEZEL = 12;

/**
 * A 390x844 phone with a bezel, a status bar showing the demo clock and a home indicator.
 * Scaled with a CSS transform so it always fits the viewport height.
 */
export function PhoneFrame({
  clock,
  scale,
  label,
  children,
  testId,
}: {
  clock: string;
  scale: number;
  label: string;
  children: ReactNode;
  testId?: string;
}) {
  const outerW = PHONE_W + BEZEL * 2;
  const outerH = PHONE_H + BEZEL * 2;
  return (
    <div
      style={{ width: outerW * scale, height: outerH * scale }}
      className="relative shrink-0"
      data-testid={testId}
    >
      <div
        className="absolute left-0 top-0 origin-top-left rounded-[56px] bg-ink p-3 shadow-phone"
        style={{ width: outerW, height: outerH, transform: `scale(${scale})` }}
        aria-label={label}
        role="group"
      >
        <PhoneScreen clock={clock} framed>
          {children}
        </PhoneScreen>
      </div>
    </div>
  );
}

/** The phone screen itself; also used full-bleed on real phones. */
export function PhoneScreen({
  clock,
  framed,
  children,
}: {
  clock: string;
  framed?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        'relative flex flex-col overflow-hidden bg-paper',
        framed ? 'h-full w-full rounded-[44px]' : 'h-full w-full',
      )}
    >
      {framed && (
        <div className="relative z-30 flex h-11 shrink-0 items-center justify-between bg-paper px-7 text-sm font-semibold text-ink">
          <span data-testid="status-clock">{clock}</span>
          <span
            className="absolute left-1/2 top-2 h-7 w-28 -translate-x-1/2 rounded-full bg-ink"
            aria-hidden
          />
          <span className="flex items-center gap-1" aria-hidden>
            <Signal className="h-4 w-4" />
            <Wifi className="h-4 w-4" />
            <BatteryFull className="h-5 w-5" />
          </span>
        </div>
      )}
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
      {framed && (
        <div className="flex h-6 shrink-0 items-center justify-center bg-paper" aria-hidden>
          <span className="h-1.5 w-32 rounded-full bg-ink" />
        </div>
      )}
    </div>
  );
}
