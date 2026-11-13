'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, LogOut } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useLogout, useSessionUser } from '@/features/auth/hooks/use-session';

export function UserMenu() {
  const { data: sessionUser } = useSessionUser();
  const logoutMutation = useLogout();

  if (!sessionUser) return <Skeleton className="h-10 w-10 rounded-full sm:w-40 sm:rounded-lg" />;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="flex h-10 items-center gap-2.5 rounded-lg pr-2 pl-1 transition-colors hover:bg-surface-muted focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none"
        aria-label="Account menu"
      >
        <Avatar fullName={sessionUser.fullName} size="sm" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[13px] font-medium text-foreground">{sessionUser.fullName}</span>
          <span className="block text-xs text-muted-foreground capitalize">{sessionUser.role}</span>
        </span>
        <ChevronDown className="hidden size-4 text-subtle-foreground sm:block" aria-hidden />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-60 rounded-xl border border-border bg-surface p-1 shadow-overlay animate-fade-in"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-[13px] font-medium text-foreground">{sessionUser.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{sessionUser.email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            onSelect={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-sm text-danger outline-none select-none data-[highlighted]:bg-danger-soft"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
