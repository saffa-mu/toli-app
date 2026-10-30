import { ScanSearch } from 'lucide-react';
import { useDemo } from '@/store';

/**
 * PM Lens: names the framework in play. Rendered inline (never floating),
 * so it can never cover primary content. Hidden unless the lens is on.
 */
export function LensPill({ framework, why }: { framework: string; why: string }) {
  const on = useDemo((s) => s.lens);
  if (!on) return null; // product mode: never shown
  return (
    <div className="my-1.5 flex animate-fade-up" data-testid="lens-pill">
      <span className="inline-flex max-w-full items-start gap-1.5 rounded-full bg-teal px-3 py-1 text-xs font-medium leading-snug text-white">
        <ScanSearch className="mt-[1px] h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          <strong className="font-semibold">{framework}:</strong> {why}
        </span>
      </span>
    </div>
  );
}
