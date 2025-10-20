import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatPillProps {
  icon: LucideIcon;
  label: string;
  value: string;
  className?: string;
}

export const StatPill: React.FC<StatPillProps> = ({ icon: Icon, label, value, className }) => {
  return (
    <div
      className={cn(
        'flex min-w-[160px] flex-1 items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-left shadow-inner shadow-slate-950/40 backdrop-blur',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 text-brand">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-200/80">{label}</p>
          <p className="text-lg font-semibold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
};
