import React from 'react';
import * as Icons from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfile } from '@/types/user';
import { formatDate } from '@/lib/format';

interface ActivityFeedProps {
  activity: UserProfile['activity'];
}

const kindDefaults: Record<UserProfile['activity'][number]['kind'], keyof typeof Icons> = {
  achievement: 'Trophy',
  game_added: 'PlusCircle',
  badge: 'ShieldCheck'
};

const toIconName = (value?: string): keyof typeof Icons | undefined => {
  if (!value) return undefined;
  const formatted = value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
  return formatted as keyof typeof Icons;
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activity }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {activity.map((item) => {
            const iconName = toIconName(item.icon);
            const library = Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
            const IconComponent = (iconName && library[iconName]) || library[kindDefaults[item.kind]];

            return (
              <li key={item.id} className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <span className="mt-1 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand/25 text-brand">
                  {IconComponent ? <IconComponent className="h-4 w-4" aria-hidden="true" /> : null}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  {item.subtitle && <p className="text-sm text-blue-200/80">{item.subtitle}</p>}
                  <p className="text-xs text-blue-200/70">{formatDate(item.ts)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};
