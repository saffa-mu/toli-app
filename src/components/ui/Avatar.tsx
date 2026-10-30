import { useId } from 'react';
import { LEVEL_COLOUR, levelOf } from '@/lib/rules/verification';
import type { AvatarSeed } from '@/lib/types';
import { cx } from './cx';

export const SKIN = ['#F6D7B8', '#E8B98F', '#C98E62', '#A86B45', '#7A4A2E'];
const HAIR_COLOURS = ['#2B2118', '#3B2A1F', '#1C1714'];
export const SHIRTS = ['#0F766E', '#F59E0B', '#5EAAA0', '#334155', '#A16207', '#2D6A64'];
const BG = ['#EFF8F6', '#FEF6E4', '#F3F4F6'];

function Hair({ style, colour }: { style: number; colour: string }) {
  switch (style) {
    case 0: // short
      return <path d="M19 27c0-9 6-14 13-14s13 5 13 14c-2-4-6-7-13-7s-11 3-13 7z" fill={colour} />;
    case 1: // medium
      return (
        <path
          d="M17 31c-1-12 6-19 15-19s16 7 15 19c-1-3-2-6-4-8-3 1-8 1-12-1-3 2-7 4-11 4-1 1-2 3-3 5z"
          fill={colour}
        />
      );
    case 2: // long
      return (
        <>
          <path d="M16 30c-1-11 6-18 16-18s17 7 16 18l1 18H15z" fill={colour} />
          <path d="M19 27c1-7 6-11 13-11s12 4 13 11c-4-3-8-5-13-5s-9 2-13 5z" fill={colour} />
        </>
      );
    case 3: // bun
      return (
        <>
          <circle cx="32" cy="9" r="6" fill={colour} />
          <path d="M18 28c0-9 6-15 14-15s14 6 14 15c-3-5-8-8-14-8s-11 3-14 8z" fill={colour} />
        </>
      );
    case 4: // curly
      return (
        <g fill={colour}>
          {[
            [20, 22],
            [25, 16],
            [32, 14],
            [39, 16],
            [44, 22],
            [18, 28],
            [46, 28],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={5.5} />
          ))}
        </g>
      );
    default: // bald
      return null;
  }
}

/** Flat head-and-shoulders portrait drawn from a seed. Stable for the same seed. */
function Portrait({
  seed,
  size = 48,
  name,
  blurred,
  className,
}: {
  seed: AvatarSeed;
  size?: number;
  name: string;
  blurred?: boolean;
  className?: string;
}) {
  const skin = SKIN[seed.skin % SKIN.length];
  const hair = HAIR_COLOURS[(seed.hair + seed.skin) % HAIR_COLOURS.length];
  const shirt = SHIRTS[seed.shirt % SHIRTS.length];
  const bg = BG[(seed.shirt + seed.hair) % BG.length];
  const clipId = `avatar${useId().replace(/:/g, '')}`;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={blurred ? 'Hidden profile' : name}
      className={cx('shrink-0 rounded-full', blurred && 'blur-[3px]', className)}
    >
      <defs>
        <radialGradient id={`${clipId}bg`} cx="35%" cy="25%" r="85%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor={bg} />
        </radialGradient>
        <linearGradient id={`${clipId}sh`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shirt} stopOpacity="0.85" />
          <stop offset="1" stopColor={shirt} />
        </linearGradient>
        <linearGradient id={`${clipId}sk`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={skin} />
          <stop offset="1" stopColor={skin} stopOpacity="0.88" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${clipId}bg)`} />
      <clipPath id={clipId}>
        <circle cx="32" cy="32" r="32" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        {seed.hair === 2 && <Hair style={2} colour={hair} />}
        <path d="M10 64c1-11 10-17 22-17s21 6 22 17z" fill={`url(#${clipId}sh)`} />
        <path d="M26 47.5c1.5 3.2 3.4 4.5 6 4.5s4.5-1.3 6-4.5" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M27 42h10v8c-3 2-7 2-10 0z" fill={skin} />
        <path d="M27 44.5c3 1.6 7 1.6 10 0v-2.5H27z" fill="#000000" opacity="0.10" />
        <ellipse cx="32" cy="30" rx="13" ry="14" fill={`url(#${clipId}sk)`} />
        <circle cx="24" cy="35" r="2.8" fill="#E5736B" opacity="0.18" />
        <circle cx="40" cy="35" r="2.8" fill="#E5736B" opacity="0.18" />
        <circle cx="19.5" cy="31" r="2.5" fill={skin} />
        <circle cx="44.5" cy="31" r="2.5" fill={skin} />
        {seed.hair !== 2 && <Hair style={seed.hair} colour={hair} />}
        {seed.hair === 2 && (
          <path d="M19 27c1-7 6-11 13-11s12 4 13 11c-4-3-8-5-13-5s-9 2-13 5z" fill={hair} />
        )}
        <path d="M23.5 26.6c1.2-1.2 3.4-1.4 5-.4M35.5 26.2c1.6-1 3.8-.8 5 .4" stroke={hair} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="27" cy="31" r="1.9" fill="#1F2933" />
        <circle cx="37" cy="31" r="1.9" fill="#1F2933" />
        <circle cx="27.6" cy="30.4" r="0.6" fill="#FFFFFF" />
        <circle cx="37.6" cy="30.4" r="0.6" fill="#FFFFFF" />
        {seed.beard ? (
          <path
            d="M20 33c1 9 6 13 12 13s11-4 12-13c-2 4-5 5-6 5-2-2-4-2-6-2s-4 0-6 2c-1 0-4-1-6-5z"
            fill={hair}
          />
        ) : (
          <path d="M28 37c2 2 6 2 8 0" stroke="#7A4A2E" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        )}
        {seed.beard && (
          <path
            d="M28.5 38.5c2 1.5 5 1.5 7 0"
            stroke="#F3F4F6"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {seed.glasses && (
          <g stroke="#1F2933" strokeWidth="1.6" fill="none">
            <circle cx="27" cy="31" r="4.2" />
            <circle cx="37" cy="31" r="4.2" />
            <path d="M31.2 31h1.6" />
          </g>
        )}
      </g>
    </svg>
  );
}

/**
 * Portrait with an optional verification ring. The ring fills with the verification score and is
 * coloured by level (grey, teal, deep teal, gold). The footprint stays `size` either way.
 */
export function Avatar({
  seed,
  size = 48,
  name,
  blurred,
  className,
  score,
}: {
  seed: AvatarSeed;
  size?: number;
  name: string;
  blurred?: boolean;
  className?: string;
  /** Verification score 0-100; draws the ring when given. */
  score?: number;
}) {
  if (score === undefined) return <Portrait seed={seed} size={size} name={name} blurred={blurred} className={className} />;
  const stroke = Math.max(2.5, Math.round(size / 16));
  const inner = size - stroke * 2 - 3;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const level = levelOf(score);
  const colour = LEVEL_COLOUR[level.key];
  return (
    <span
      className={cx('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      title={`${level.label} · ${score}%`}
      data-score={score}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(circ * Math.max(score, 2)) / 100} ${circ}`}
        />
      </svg>
      <Portrait seed={seed} size={inner} name={name} blurred={blurred} />
    </span>
  );
}
