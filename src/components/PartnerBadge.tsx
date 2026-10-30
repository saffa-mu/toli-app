import { Handshake, Megaphone } from 'lucide-react';
import type { Partner } from '@/lib/types';
import { cx } from '@/components/ui/cx';

/** B2B: marks a partner or sponsored place and the site it can be booked through. */
export function PartnerBadge({ partner, className }: { partner: Partner; className?: string }) {
  const sponsored = partner.tier === 'sponsored';
  const Icon = sponsored ? Megaphone : Handshake;
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        sponsored ? 'bg-marigold-50 text-ink' : 'bg-teal-50 text-teal-800',
        className,
      )}
      data-testid="partner-badge"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {sponsored ? 'Sponsored' : 'Partner'} · {partner.source}
    </span>
  );
}
