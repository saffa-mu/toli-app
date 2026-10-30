import { useEffect, useState } from 'react';

/** Animated ring, e.g. "2 of 3 visits". Starts empty and fills to the value. */
export function ProgressRing({
  value,
  max,
  size = 64,
  label,
}: {
  value: number;
  max: number;
  size?: number;
  label?: string;
}) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const target = Math.min(1, value / max);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(target));
    return () => cancelAnimationFrame(id);
  }, [target]);
  const done = value >= max;
  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${value} of ${max}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#D5EEEA" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={done ? '#F59E0B' : '#0F766E'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown)}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.16,1,0.3,1), stroke 200ms' }}
        />
      </svg>
      <span className="absolute font-display text-sm font-semibold text-ink">
        {Math.min(value, max)}/{max}
      </span>
    </div>
  );
}
