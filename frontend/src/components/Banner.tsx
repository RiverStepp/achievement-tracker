import React from 'react';
import { Medal, Clock3, Library, MapPin, CalendarDays } from 'lucide-react';
import { UserProfile } from '@/types/user';
import { StatPill } from '@/components/StatPill';
import { FollowButton } from '@/components/FollowButton';
import { MessageCTA } from '@/components/MessageCTA';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { formatDate, formatHours, formatNumber } from '@/lib/format';

interface BannerProps {
  user: UserProfile;
  onEdit: (opts?: { tab?: 'profile' | 'accounts' | 'privacy'; focus?: 'pins' | 'profile' }) => void;
  onNotify: (message: string) => void;
}

export const Banner: React.FC<BannerProps> = ({ user, onEdit, onNotify }) => {
  return (
    <section className="relative overflow-visible rounded-3xl border border-slate-800 bg-slate-950/80 shadow-lg shadow-slate-950/50">
      {/* Only the inner wrapper clips the banner image; outer stays overflow-visible */}
      <div className="relative h-48 w-full overflow-hidden rounded-t-3xl">
        {user.bannerUrl ? (
          <img
            src={user.bannerUrl}
            alt="Profile banner"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900" />
        )}
        {/* Put the overlay under the avatar and ignore pointer events */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950 via-slate-950/60 z-0" />
      </div>
      <div className="px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
        <div className="-mt-20 relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="relative z-20 flex items-end gap-4">
            <img
              src={user.avatarUrl}
              alt={`${user.handle} avatar`}
              className="h-32 w-32 rounded-3xl border-4 border-slate-950/90 object-cover shadow-2xl"
            />
            <div className="space-y-2">
              <div>
                <h1 className="text-2xl font-semibold text-white sm:text-3xl">{user.handle}</h1>
                <p className="text-sm text-blue-200">@{user.handle}</p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-blue-200/80">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {user.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Joined {formatDate(user.joinDate)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FollowButton />
            <MessageCTA onNotify={onNotify} />
            <ThemeToggle />
            <Button
              variant="outline"
              className="border-brand/50 text-blue-100 hover:bg-brand/20"
              onClick={() => onEdit({ tab: 'profile' })}
            >
              Edit Profile
            </Button>
          </div>
        </div>
        {user.privacy.showStats && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatPill icon={Medal} label="Achievements" value={formatNumber(user.totalAchievements)} />
            <StatPill icon={Clock3} label="Hours Played" value={formatHours(user.hoursPlayed)} />
            <StatPill icon={Library} label="Games Owned" value={formatNumber(user.gamesOwned)} />
          </div>
        )}
      </div>
    </section>
  );
};
