import { cn } from '@/lib/class-names';
import { getInitials } from '@/lib/formatters';

const AVATAR_TONES = [
  'bg-primary-soft text-primary',
  'bg-info-soft text-info',
  'bg-warning-soft text-warning',
  'bg-success-soft text-success',
  'bg-danger-soft text-danger',
  'bg-neutral-soft text-neutral',
] as const;

/** Picks a stable tone per name so the same person always gets the same color. */
function pickToneForName(fullName: string): string {
  let hash = 0;
  for (const character of fullName) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length]!;
}

interface AvatarProps {
  fullName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AVATAR_SIZES = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg' } as const;

export function Avatar({ fullName, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        AVATAR_SIZES[size],
        pickToneForName(fullName),
        className,
      )}
      aria-hidden
    >
      {getInitials(fullName)}
    </span>
  );
}
