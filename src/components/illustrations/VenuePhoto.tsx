import { useId } from 'react';
import type { Venue } from '@/lib/types';
import { cx } from '@/components/ui/cx';

type Kind = Venue['kind'];

const SKY: Record<Kind, [string, string]> = {
  court: ['#FDE9B8', '#F7B267'],
  park: ['#CFEFE9', '#8FD3C4'],
  studio: ['#FCE7D6', '#F2B8A0'],
  pool: ['#CDEBFA', '#7CC4EA'],
  cafe: ['#F8E3C8', '#E0A96D'],
  turf: ['#D6F0D2', '#7FCB78'],
};

function Scene({ kind }: { kind: Kind }) {
  switch (kind) {
    case 'court':
      return (
        <g>
          <path d="M0 96h340v64H0z" fill="#2F6F5E" />
          <path d="M30 150l40-54h200l40 54z" fill="#3F8B73" />
          <path d="M70 96h200M56 123h228M170 96v54" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
          <path d="M60 94h220" stroke="#1F2933" strokeWidth="3" />
          <path d="M60 94v-22M280 94v-22" stroke="#1F2933" strokeWidth="3" />
          <path d="M60 78h220v16H60z" fill="#FFFFFF" opacity="0.55" />
          <g stroke="#1F2933" strokeOpacity="0.35" strokeWidth="0.8">
            {Array.from({ length: 12 }).map((_, i) => (
              <path key={i} d={`M${68 + i * 17} 78v16`} />
            ))}
          </g>
          <circle cx="250" cy="48" r="16" fill="#FFFFFF" opacity="0.8" />
          <path d="M243 41l14 14M257 41l-14 14" stroke="#F59E0B" strokeWidth="2" />
        </g>
      );
    case 'park':
      return (
        <g>
          <path d="M0 100c60-18 120-12 180-4s110 8 160-6v70H0z" fill="#5BAE6C" />
          <path d="M0 126c80-16 150-6 340-18v52H0z" fill="#3F9455" />
          <path d="M120 160c30-30 50-44 90-56" stroke="#F3E6C8" strokeWidth="14" strokeLinecap="round" fill="none" />
          {[
            [40, 92, 22],
            [86, 100, 16],
            [270, 88, 24],
            [310, 100, 16],
          ].map(([x, y, r]) => (
            <g key={x}>
              <rect x={x - 2} y={y} width="4" height="26" fill="#6B4A2E" />
              <circle cx={x} cy={y - 4} r={r} fill="#2E8B57" />
              <circle cx={x - r / 3} cy={y - 8} r={r * 0.6} fill="#46A56B" />
            </g>
          ))}
          <circle cx="170" cy="94" r="9" fill="#BFE3E8" />
          <path d="M170 94v-16M165 84c3-6 7-6 10 0" stroke="#7CC4EA" strokeWidth="2" fill="none" />
        </g>
      );
    case 'studio':
      return (
        <g>
          <path d="M0 110h340v50H0z" fill="#C9A27E" />
          <path d="M0 110h340" stroke="#A98259" strokeWidth="3" />
          <rect x="40" y="28" width="62" height="50" rx="3" fill="#FFFFFF" />
          <path d="M46 70l16-20 12 12 10-14 12 22z" fill="#5EAAA0" />
          <circle cx="86" cy="42" r="5" fill="#F59E0B" />
          <rect x="130" y="40" width="44" height="58" rx="3" fill="#FFFFFF" />
          <path d="M136 90c10-30 20-30 32 0z" fill="#E86A5E" opacity="0.8" />
          <path d="M214 112l22-62 22 62M226 92h20" stroke="#6B4A2E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="220" y="50" width="32" height="26" rx="2" fill="#FFFFFF" stroke="#6B4A2E" strokeWidth="3" />
          <path d="M226 70c4-10 10-10 14-4s8 0 10-2" stroke="#0F766E" strokeWidth="2.5" fill="none" />
          <circle cx="296" cy="124" r="7" fill="#F59E0B" />
          <circle cx="312" cy="128" r="6" fill="#E86A5E" />
          <circle cx="282" cy="130" r="5" fill="#0F766E" />
        </g>
      );
    case 'pool':
      return (
        <g>
          <path d="M0 84h340v76H0z" fill="#48B1E0" />
          <path d="M0 84h340v8H0z" fill="#E8F4FA" />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M0 ${104 + i * 14}c20-6 30 6 50 0s30-6 50 0 30 6 50 0 30-6 50 0 30 6 50 0 30-6 50 0 30 6 40 0`} stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="2" fill="none" />
          ))}
          <g stroke="#F59E0B" strokeWidth="3" strokeDasharray="6 5">
            <path d="M0 100h340M0 128h340" />
          </g>
          <circle cx="120" cy="116" r="7" fill="#F6D7B8" />
          <path d="M126 114c10-6 22-2 30 4" stroke="#F6D7B8" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M80 70v-30M70 40h20" stroke="#B0B7BD" strokeWidth="3" fill="none" />
        </g>
      );
    case 'cafe':
      return (
        <g>
          <path d="M0 110h340v50H0z" fill="#8B5E3C" />
          <rect x="40" y="26" width="86" height="56" rx="4" fill="#FFF7E6" />
          <path d="M40 26h86l-6-12H46z" fill="#E86A5E" />
          <rect x="150" y="30" width="40" height="52" rx="3" fill="#6B4A2E" />
          <path d="M156 38h28M156 50h28M156 62h28" stroke="#F3E6C8" strokeWidth="3" />
          <ellipse cx="260" cy="104" rx="62" ry="12" fill="#6B4A2E" />
          <rect x="256" y="104" width="8" height="46" fill="#5A3E26" />
          <rect x="232" y="82" width="26" height="22" rx="4" fill="#FFFFFF" />
          <path d="M258 88c8 0 8 12 0 12" stroke="#FFFFFF" strokeWidth="3" fill="none" />
          <path d="M240 78c-3-6 3-8 0-14M248 78c-3-6 3-8 0-14" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="2" fill="none" />
          <rect x="278" y="84" width="22" height="22" rx="2" fill="#0F766E" />
          <rect x="283" y="89" width="12" height="12" fill="#FFFFFF" opacity="0.5" />
        </g>
      );
    default:
      return (
        <g>
          <path d="M0 90h340v70H0z" fill="#46A56B" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M${i * 60} 90h30v70h-30z`} fill="#3F9455" opacity="0.55" />
          ))}
          <path d="M40 150l30-50h200l30 50z" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
          <path d="M170 100v50" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="170" cy="125" r="12" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
          <path d="M20 90V52h6v38M314 90V52h-6v38" stroke="#E5E7EB" strokeWidth="3" />
          <circle cx="220" cy="118" r="7" fill="#FFFFFF" />
          <path d="M216 114l8 8M224 114l-8 8" stroke="#1F2933" strokeWidth="1.4" />
        </g>
      );
  }
}

/** Illustrated "photo" of a place, drawn from its kind. Offline and light. */
export function VenuePhoto({
  kind,
  className,
  label,
}: {
  kind: Kind;
  className?: string;
  label?: string;
}) {
  const id = `vp${useId().replace(/:/g, '')}`;
  const [top, bottom] = SKY[kind];
  return (
    <svg
      viewBox="0 0 340 160"
      className={cx('h-auto w-full', className)}
      role="img"
      aria-label={label ?? `Illustration of a ${kind}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width="340" height="160" fill={`url(#${id})`} />
      <circle cx="298" cy="30" r="16" fill="#FFFFFF" opacity="0.65" />
      <Scene kind={kind} />
    </svg>
  );
}
