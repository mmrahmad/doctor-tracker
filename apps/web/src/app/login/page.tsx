import { Activity, ShieldCheck, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrandMark } from '@/components/layout/brand-mark';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = { title: 'Sign in' };

const PRODUCT_HIGHLIGHTS = [
  { icon: Users, title: 'Doctors & patients in one place', text: 'Assign, update and track care teams.' },
  { icon: Activity, title: 'Live care analytics', text: 'Admissions, workloads and condition trends.' },
  { icon: ShieldCheck, title: 'Secure by default', text: 'Rotating sessions and audited access.' },
];

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-[#0b5c63] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(1200px 600px at -10% -10%, #14a3ad55, transparent 60%), radial-gradient(900px 500px at 110% 110%, #0a3f4455, transparent 60%)',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden
        />
        <BrandMark appearance="inverse" className="relative" />

        <div className="relative max-w-md">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight">
            Care coordination,
            <br />
            without the spreadsheets.
          </h2>
          <ul className="mt-10 space-y-6">
            {PRODUCT_HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-medium">{title}</span>
                  <span className="block text-sm text-white/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Doctor Tracker</p>
      </aside>

      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[400px]">
          <BrandMark className="mb-10 lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-1.5 mb-8 text-sm text-muted-foreground">Sign in to manage doctors and patients.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
          <p className="mt-8 text-center text-xs text-subtle-foreground">
            Access is restricted to authorized administrators.
          </p>
        </div>
      </section>
    </main>
  );
}
