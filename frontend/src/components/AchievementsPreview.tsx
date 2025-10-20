import React from 'react';
import { Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfile } from '@/types/user';
import { formatDate } from '@/lib/format';

interface AchievementsPreviewProps {
  activity: UserProfile['activity'];
}

export const AchievementsPreview: React.FC<AchievementsPreviewProps> = ({ activity }) => {
  const recentAchievements = activity
    .filter((item) => item.kind === 'achievement')
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Trophy className="h-5 w-5 text-brand" aria-hidden="true" />
          Latest Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {recentAchievements.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                {item.subtitle && <p className="text-xs text-blue-200/80">{item.subtitle}</p>}
              </div>
              <span className="text-xs text-blue-200/70">{formatDate(item.ts)}</span>
            </li>
          ))}
          {recentAchievements.length === 0 && (
            <li className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-blue-200/70">
              Achievement unlocks will appear here.
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
};
