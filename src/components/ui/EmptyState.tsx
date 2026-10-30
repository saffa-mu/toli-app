import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal">
        {icon}
      </div>
      <h3 className="font-display text-md font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-[280px] text-sm text-ink-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
