'use client';

import { loginRequestSchema } from '@doctor-tracker/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, Eye, EyeOff } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { describeFieldControl, FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/http/api-request-error';
import { toSafeRedirectPath, useLogin } from '../hooks/use-session';

export function LoginForm() {
  const searchParams = useSearchParams();
  const loginMutation = useLogin(toSafeRedirectPath(searchParams.get('next')));
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: '', password: '' },
  });

  const submitCredentials = handleSubmit((credentials) => loginMutation.mutate(credentials));

  return (
    <form onSubmit={submitCredentials} noValidate className="flex flex-col gap-5">
      {loginMutation.isError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger-soft px-3.5 py-3 text-[13px] text-danger"
        >
          <CircleAlert className="mt-px size-4 shrink-0" aria-hidden />
          <span>{getErrorMessage(loginMutation.error)}</span>
        </div>
      )}

      <FormField label="Email address" htmlFor="login-email" error={errors.email?.message}>
        <Input
          {...describeFieldControl('login-email', errors.email?.message)}
          {...register('email')}
          type="email"
          autoComplete="username"
          placeholder="you@hospital.org"
          autoFocus
        />
      </FormField>

      <FormField label="Password" htmlFor="login-password" error={errors.password?.message}>
        <div className="relative">
          <Input
            {...describeFieldControl('login-password', errors.password?.message)}
            {...register('password')}
            type={isPasswordVisible ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isPasswordVisible}
            className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-subtle-foreground hover:bg-surface-muted hover:text-foreground"
          >
            {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </FormField>

      <Button type="submit" className="mt-1 w-full" isLoading={loginMutation.isPending || loginMutation.isSuccess}>
        Sign in
      </Button>
    </form>
  );
}
