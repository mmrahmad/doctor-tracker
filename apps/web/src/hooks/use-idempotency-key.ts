'use client';

import { useCallback, useState } from 'react';

function generateIdempotencyKey(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // Fallback for non-secure contexts where randomUUID is unavailable.
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * One key per logical submission: retries/double-clicks reuse it (the API replays the result
 * instead of creating duplicates); call `renewKey` after success to start a new submission.
 */
export function useIdempotencyKey(): [idempotencyKey: string, renewKey: () => void] {
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey);
  const renewKey = useCallback(() => setIdempotencyKey(generateIdempotencyKey()), []);
  return [idempotencyKey, renewKey];
}
