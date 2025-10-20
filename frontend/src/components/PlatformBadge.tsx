import React from 'react';
import { CheckCircle2, Monitor, Gamepad2, Laptop2, BadgeCheck, Joystick } from 'lucide-react';
import { LinkedAccount } from '@/types/user';
import { Badge } from '@/components/ui/badge';

const platformMeta: Record<LinkedAccount['platform'], { label: string; icon: React.ReactNode }> = {
  steam: { label: 'Steam', icon: <Joystick className="h-3.5 w-3.5" aria-hidden="true" /> },
  xbox: { label: 'Xbox', icon: <Gamepad2 className="h-3.5 w-3.5" aria-hidden="true" /> },
  psn: { label: 'PlayStation', icon: <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> },
  switch: { label: 'Switch', icon: <Monitor className="h-3.5 w-3.5" aria-hidden="true" /> },
  pc: { label: 'PC', icon: <Laptop2 className="h-3.5 w-3.5" aria-hidden="true" /> }
};

interface PlatformBadgeProps {
  account: LinkedAccount;
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({ account }) => {
  const meta = platformMeta[account.platform];

  return (
    <a
      href={account.profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2"
    >
      <Badge className="gap-2 bg-slate-950/70 pr-3 text-blue-100">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/30 text-brand">
          {meta.icon}
        </span>
        <span className="text-xs font-semibold text-white">{meta.label}</span>
        <span className="text-xs text-blue-200">{account.usernameOrId}</span>
        {account.accountVerified && (
          <CheckCircle2 className="h-4 w-4 text-brand" aria-label="Verified by platform" />
        )}
      </Badge>
    </a>
  );
};
