'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/class-names';
import { BrandMark } from './brand-mark';
import { isNavigationItemActive, NAVIGATION_ITEMS } from './navigation-items';

interface SidebarNavigationProps {
  /** Called after a link is chosen — closes the mobile drawer. */
  onNavigate?: () => void;
}

/** Sidebar content shared by the desktop rail and the mobile drawer. */
export function SidebarNavigation({ onNavigate }: SidebarNavigationProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <BrandMark />
      </div>

      <nav aria-label="Main" className="flex-1 px-3 pt-4">
        <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-subtle-foreground uppercase">Menu</p>
        <ul className="space-y-1">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = isNavigationItemActive(item, pathname);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring',
                    isActive
                      ? 'bg-primary-soft text-primary'
                      : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
                  )}
                >
                  <Icon
                    className={cn('size-[18px]', isActive ? 'text-primary' : 'text-subtle-foreground group-hover:text-foreground')}
                    aria-hidden
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
