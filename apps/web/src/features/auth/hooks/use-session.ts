'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { queryKeys } from '@/lib/query-keys';
import { authApi } from '../api/auth-api';

export function useSessionUser() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: authApi.fetchCurrentUser,
    staleTime: 5 * 60_000,
  });
}

/** Only same-site relative paths are honoured, preventing open redirects via `?next=`. */
export function toSafeRedirectPath(requestedPath: string | null): string {
  if (!requestedPath || !requestedPath.startsWith('/') || requestedPath.startsWith('//')) return '/dashboard';
  return requestedPath;
}

export function useLogin(redirectPath: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (sessionUser) => {
      queryClient.setQueryData(queryKeys.session, sessionUser);
      router.replace(redirectPath);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.clear();
      router.replace('/login');
    },
  });
}
