import { LayoutDashboard, Stethoscope, Users, type LucideIcon } from 'lucide-react';

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Doctors', href: '/doctors', icon: Stethoscope },
  { label: 'Patients', href: '/patients', icon: Users },
];

export function isNavigationItemActive(item: NavigationItem, pathname: string): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
