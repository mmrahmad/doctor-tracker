'use client';

import { ErrorState } from '@/components/ui/feedback-states';

/** Route-level error boundary: a crash in one page never takes down the shell. */
export default function PortalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="This page hit a problem"
      message="An unexpected error occurred. You can retry, or navigate to another section."
      onRetry={reset}
      className="rounded-2xl border border-border bg-surface"
    />
  );
}
