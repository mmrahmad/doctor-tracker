import type { LoginRequest, SessionUser } from '@doctor-tracker/contracts';
import { apiRequest } from '@/lib/http/api-client';

export const authApi = {
  login: (credentials: LoginRequest) =>
    apiRequest<SessionUser>('/auth/login', { method: 'POST', body: credentials }),
  logout: () => apiRequest<void>('/auth/logout', { method: 'POST' }),
  fetchCurrentUser: () => apiRequest<SessionUser>('/auth/me'),
};
