'use client';

import { SEARCH_TERM_MAX_LENGTH } from '@doctor-tracker/contracts';
import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { cn } from '@/lib/class-names';
import { Input } from './input';

interface SearchInputProps {
  /** Committed search term (usually from the URL). */
  value: string;
  /** Called with the trimmed term after the user pauses typing. */
  onValueChange: (searchTerm: string) => void;
  placeholder: string;
  className?: string;
}

/** Search box that keeps typing responsive locally and only commits debounced terms. */
export function SearchInput({ value, onValueChange, placeholder, className }: SearchInputProps) {
  const [draftTerm, setDraftTerm] = useState(value);
  const [previousCommittedValue, setPreviousCommittedValue] = useState(value);
  const debouncedDraftTerm = useDebouncedValue(draftTerm, 300);

  // Follow external changes (e.g. "Clear filters" or browser back) without fighting the user's typing.
  if (value !== previousCommittedValue) {
    setPreviousCommittedValue(value);
    if (draftTerm.trim() !== value) setDraftTerm(value);
  }

  const latestValueRef = useRef(value);
  const latestOnValueChangeRef = useRef(onValueChange);
  useEffect(() => {
    latestValueRef.current = value;
    latestOnValueChangeRef.current = onValueChange;
  });

  useEffect(() => {
    const normalizedTerm = debouncedDraftTerm.trim();
    if (normalizedTerm !== latestValueRef.current) latestOnValueChangeRef.current(normalizedTerm);
  }, [debouncedDraftTerm]);

  const clearSearch = () => {
    setDraftTerm('');
    onValueChange('');
  };

  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle-foreground"
        aria-hidden
      />
      <Input
        type="search"
        value={draftTerm}
        onChange={(event) => setDraftTerm(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={SEARCH_TERM_MAX_LENGTH}
        className="pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {draftTerm && (
        <button
          type="button"
          onClick={clearSearch}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-subtle-foreground hover:bg-surface-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
