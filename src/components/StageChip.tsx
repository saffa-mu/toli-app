import { Footprints, Sprout, Users, BadgeCheck } from 'lucide-react';
import { Chip } from '@/components/ui';
import type { Stage } from '@/lib/types';

const ICON = {
  New: Sprout,
  Exploring: Footprints,
  Regular: BadgeCheck,
  'In a toli': Users,
} as const;

/** Small chip for the stage ladder: New -> Exploring -> Regular -> In a toli. */
export function StageChip({ stage }: { stage: Stage }) {
  const Icon = ICON[stage];
  const tone = stage === 'Regular' || stage === 'In a toli' ? 'teal' : 'neutral';
  return (
    <Chip tone={tone} icon={<Icon className="h-3.5 w-3.5" aria-hidden />}>
      {stage}
    </Chip>
  );
}
