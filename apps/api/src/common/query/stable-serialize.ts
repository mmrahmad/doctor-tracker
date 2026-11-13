import { createHash } from 'node:crypto';

/** Serializes a plain value with sorted object keys so equal queries always produce equal strings. */
export function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'undefined';
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  const sortedEntries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([entryKey, entryValue]) => `${JSON.stringify(entryKey)}:${stableSerialize(entryValue)}`);
  return `{${sortedEntries.join(',')}}`;
}

/** Short, fixed-length fingerprint of a query, suitable for cache keys. */
export function fingerprint(value: unknown): string {
  return createHash('sha1').update(stableSerialize(value)).digest('base64url');
}
