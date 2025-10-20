import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
        variant === 'default'
          ? 'border-transparent bg-slate-950/70 text-blue-100'
          : 'border-brand/40 bg-transparent text-blue-100',
        className
      )}
      {...props}
    />
  );
}
