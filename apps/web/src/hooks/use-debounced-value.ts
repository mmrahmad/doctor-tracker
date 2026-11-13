import { useEffect, useState } from 'react';

/** Returns `value` once it has stopped changing for `delayMs` — used to avoid a request per keystroke. */
export function useDebouncedValue<TValue>(value: TValue, delayMs = 300): TValue {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}
