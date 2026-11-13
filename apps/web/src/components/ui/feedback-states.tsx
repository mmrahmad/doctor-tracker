import { CircleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/class-names';
import { Button } from './button';

interface FeedbackStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: 'neutral' | 'danger';
  className?: string;
}

function FeedbackState({ icon: Icon, title, description, action, tone = 'neutral', className }: FeedbackStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div
        className={cn(
          'mb-4 flex size-12 items-center justify-center rounded-2xl',
          tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-primary-soft text-primary',
        )}
      >
        <Icon className="size-6" aria-hidden />
      </div>
      <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function EmptyState(props: Omit<FeedbackStateProps, 'tone'>) {
  return <FeedbackState {...props} />;
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Could not load data', message, onRetry, className }: ErrorStateProps) {
  return (
    <FeedbackState
      icon={CircleAlert}
      tone="danger"
      title={title}
      description={message}
      className={className}
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    />
  );
}
