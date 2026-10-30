import type { Day, Slot } from './types';

/** All demo times are India Standard Time, independent of the laptop's timezone. */
const IST_OFFSET_MS = 330 * 60 * 1000;
export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const DAY_MS = 24 * HOUR;

/** Build a timestamp from an IST wall-clock time. Month is 1-based. */
export function ist(year: number, month: number, day: number, hour = 0, minute = 0): number {
  return Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET_MS;
}

/** Demo clock starts Wednesday 28 Oct 2026, 06:20 IST. */
export const DEMO_START = ist(2026, 10, 28, 6, 20);

function parts(ms: number) {
  const d = new Date(ms + IST_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    date: d.getUTCDate(),
    day: d.getUTCDay() as Day,
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dayOf(ms: number): Day {
  return parts(ms).day;
}

export function formatTime(ms: number): string {
  const { hour, minute } = parts(ms);
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'am' : 'pm'}`;
}

/** Status-bar style 24h clock, e.g. "06:20". */
export function formatClock(ms: number): string {
  const { hour, minute } = parts(ms);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function formatDay(ms: number): string {
  const { day, date, month } = parts(ms);
  return `${DAY_SHORT[day]} ${date} ${MONTHS[month]}`;
}

export function formatDayTime(ms: number): string {
  return `${formatDay(ms)}, ${formatTime(ms)}`;
}

/** Friendly relative label used in chat lists. */
export function formatRelative(ms: number, now: number): string {
  if (formatDay(ms) === formatDay(now)) return formatTime(ms);
  const days = Math.round((startOfDay(now) - startOfDay(ms)) / DAY_MS);
  if (days === 1) return 'Yesterday';
  if (days < 7) return DAY_SHORT[parts(ms).day];
  return formatDay(ms).slice(4);
}

export function startOfDay(ms: number): number {
  const p = parts(ms);
  return ist(p.year, p.month + 1, p.date);
}

export function slotOfHour(hour: number): Slot {
  if (hour >= 5 && hour < 9) return 'early';
  if (hour >= 9 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

export function slotOf(ms: number): Slot {
  return slotOfHour(parts(ms).hour);
}

/** Next occurrence (at or after `from`) of a given weekday and time. */
export function nextOccurrence(from: number, day: Day, hour: number, minute: number): number {
  const base = startOfDay(from);
  for (let i = 0; i < 8; i++) {
    const candidate = base + i * DAY_MS + hour * HOUR + minute * MINUTE;
    if (dayOf(candidate) === day && candidate >= from) return candidate;
  }
  return base + 7 * DAY_MS + hour * HOUR + minute * MINUTE;
}
