import type { Venue } from '@/lib/types';

/**
 * A stylised neighbourhood map in inline SVG (no tiles, no network).
 * Hidden: a soft sector-level area. Revealed: the exact pin with the venue name.
 */
export function VenueMap({ venue, revealed }: { venue: Venue; revealed: boolean }) {
  const x = 20 + venue.map.x * 3;
  const y = 10 + venue.map.y * 1.8;
  return (
    <svg
      viewBox="0 0 340 200"
      className="h-auto w-full rounded-card"
      role="img"
      aria-label={
        revealed ? `Map: ${venue.name}, Sector ${venue.sector}` : `Map: somewhere in Sector ${venue.sector}`
      }
      data-testid={revealed ? 'map-revealed' : 'map-hidden'}
    >
      <rect width="340" height="200" fill="#F3F4F6" />
      <path d="M20 40c40-10 60 10 90 0s40-20 60-10 10 50-20 60-80 10-110-10-40-30-20-40z" fill="#D5EEEA" />
      <path d="M210 130c30-20 70-10 100 0s20 50-20 55-70-5-85-20 0-30 5-35z" fill="#D5EEEA" />
      <g stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" fill="none">
        <path d="M0 100h340" />
        <path d="M170 0v200" />
        <path d="M0 160c80-20 160 10 340-30" />
        <path d="M60 0l40 200" />
        <path d="M260 0l-20 200" />
      </g>
      <g stroke="#E7E1D6" strokeWidth="1" fill="none">
        <path d="M0 100h340M170 0v200" />
      </g>
      <g fontFamily="Inter, sans-serif" fontSize="11" fill="#5F6B76">
        <text x="16" y="92">
          Sector 29
        </text>
        <text x="182" y="22">
          Sector 49
        </text>
        <text x="108" y="124">
          Sector 42
        </text>
        <text x="182" y="124">
          Sector 54
        </text>
        <text x="270" y="92">
          Sector 56
        </text>
      </g>
      {revealed ? (
        <g>
          <circle cx={x} cy={y} r="18" fill="#0F766E" opacity="0.15" />
          <path
            d={`M${x} ${y + 4}c-9-10-13-16-13-22a13 13 0 0 1 26 0c0 6-4 12-13 22z`}
            fill="#0F766E"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <circle cx={x} cy={y - 18} r="4.5" fill="#FFFFFF" />
        </g>
      ) : (
        <g>
          <circle cx={x} cy={y} r="42" fill="#0F766E" opacity="0.12" />
          <circle cx={x} cy={y} r="42" fill="none" stroke="#0F766E" strokeDasharray="4 5" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  );
}
