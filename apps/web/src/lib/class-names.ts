import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Joins conditional class names and resolves conflicting Tailwind utilities (last one wins). */
export function cn(...classValues: ClassValue[]): string {
  return twMerge(clsx(classValues));
}
