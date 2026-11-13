import { z } from 'zod';
import { USER_ROLES } from '../constants';
import { emailSchema } from './common';

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: (typeof USER_ROLES)[number];
}
