'use client';

import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { useEffect, useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { onSessionExpired } from '@/lib/http/api-client';
import { createQueryClient } from '@/lib/query-client';

/** Sends the user to sign-in (and drops cached data) once their session can no longer be refreshed. */
function SessionExpiryRedirect() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(
    () =>
      onSessionExpired(() => {
        queryClient.clear();
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }),
    [queryClient, router, pathname],
  );
  return null;
}

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{ className: 'font-sans' }}
    />
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  // One client per browser session (not per render), created lazily.
  const [queryClient] = useState(createQueryClient);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <SessionExpiryRedirect />
          {children}
          <ThemedToaster />
        </NuqsAdapter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
