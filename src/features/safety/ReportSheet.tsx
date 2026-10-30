import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, Sheet, cx } from '@/components/ui';
import type { ReportReason, UserId } from '@/lib/types';
import { usePhone } from '@/features/shell/phone';

const REASONS: ReportReason[] = [
  'Made me uncomfortable',
  'Asked about my routine or location',
  'Romantic or sexual messages',
  'Fake profile',
  'Something else',
];

/** Report flow: reason, optional note, "Also block", then a calm confirmation. */
export function ReportSheet({
  userId,
  onClose,
  onDone,
  intro,
}: {
  userId: UserId | null;
  onClose: () => void;
  onDone: () => void;
  intro?: string;
}) {
  const { world, act } = usePhone();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [sent, setSent] = useState(false);
  const u = userId ? world.users[userId] : undefined;

  useEffect(() => {
    if (userId) {
      setReason(null);
      setNote('');
      setAlsoBlock(true);
      setSent(false);
    }
  }, [userId]);

  const first = u?.name.split(' ')[0] ?? '';
  return (
    <Sheet
      open={!!u}
      onClose={sent ? onDone : onClose}
      title={sent ? 'Report sent' : `Report ${first}`}
      testId="report-sheet"
      footer={
        sent ? (
          <Button block onClick={onDone}>
            Done
          </Button>
        ) : (
          <Button
            variant="danger"
            block
            disabled={!reason}
            onClick={() => {
              if (!reason || !userId) return;
              act({ type: 'report', against: userId, reason, note, alsoBlock });
              setSent(true);
            }}
          >
            {alsoBlock ? 'Report and block' : 'Send report'}
          </Button>
        )
      }
    >
      {sent ? (
        <div className="flex flex-col items-center py-6 text-center" data-testid="report-confirmation">
          <CheckCircle2 className="mb-3 h-12 w-12 text-teal" aria-hidden />
          <p className="font-display text-lg font-semibold">
            Thanks. Our team reviews every report within 24 hours.
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            {alsoBlock
              ? `${first} can no longer see you or contact you. You can unblock from Me at any time.`
              : `${first} won't be told who reported them.`}
          </p>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-base text-ink-soft">
            {intro ?? `You're safe to tell us. ${first} will never know who reported them.`}
          </p>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink-muted">What happened?</legend>
            <div className="flex flex-col gap-2">
              {REASONS.map((r) => (
                <label
                  key={r}
                  className={cx(
                    'flex min-h-[48px] cursor-pointer items-center gap-3 rounded-btn border px-4 text-base',
                    reason === r ? 'border-coral-700 bg-coral-50' : 'border-hairline bg-white',
                  )}
                >
                  <input
                    type="radio"
                    name="reason"
                    className="h-5 w-5 accent-[#B4432A]"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                  />
                  {r}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-semibold text-ink-muted">Anything else? (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-btn border border-hairline bg-white p-3 text-base"
            />
          </label>
          <label className="mt-3 flex min-h-[48px] cursor-pointer items-center justify-between gap-3 rounded-btn bg-mist px-4">
            <span className="font-medium">Also block {first}</span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#0F766E]"
              checked={alsoBlock}
              onChange={(e) => setAlsoBlock(e.target.checked)}
            />
          </label>
        </div>
      )}
    </Sheet>
  );
}
