'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { isNavigationItemActive, NAVIGATION_ITEMS } from './navigation-items';
import { SidebarNavigation } from './sidebar-navigation';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

const SIDEBAR_WIDTH_CLASS = 'w-64';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const currentSection = NAVIGATION_ITEMS.find((item) => isNavigationItemActive(item, pathname));

  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <aside className={`fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-surface lg:block ${SIDEBAR_WIDTH_CLASS}`}>
        <SidebarNavigation />
      </aside>

      <DialogPrimitive.Root open={isMobileNavigationOpen} onOpenChange={setIsMobileNavigationOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[#0a111d]/50 animate-fade-in lg:hidden" />
          <DialogPrimitive.Content
            className={`fixed inset-y-0 left-0 z-50 border-r border-border bg-surface shadow-overlay animate-slide-in-left focus:outline-none lg:hidden ${SIDEBAR_WIDTH_CLASS}`}
          >
            <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">Main navigation menu</DialogPrimitive.Description>
            <SidebarNavigation onNavigate={() => setIsMobileNavigationOpen(false)} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 lg:hidden"
            onClick={() => setIsMobileNavigationOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </Button>
          <p className="text-sm font-medium text-muted-foreground">
            <span className="hidden sm:inline">Admin / </span>
            <span className="text-foreground">{currentSection?.label ?? 'Overview'}</span>
          </p>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />
            <UserMenu />
          </div>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
