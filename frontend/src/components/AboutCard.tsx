import React from 'react';
import { Globe2, Github, Twitch, MessageCircleMore, LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfile } from '@/types/user';
import { PlatformBadge } from '@/components/PlatformBadge';
import { Badge } from '@/components/ui/badge';

const socialIcons = {
  discord: MessageCircleMore,
  x: LinkIcon,
  twitch: Twitch,
  github: Github,
  website: Globe2
} as const;

interface AboutCardProps {
  user: UserProfile;
}

export const AboutCard: React.FC<AboutCardProps> = ({ user }) => {
  const verifiedAccounts = user.privacy.showLinkedAccounts
    ? user.linkedAccounts.filter((account) => account.accountVerified)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">About</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {user.bio && <p className="text-sm leading-relaxed text-blue-100">{user.bio}</p>}

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-200/80">Platforms</p>
          <div className="flex flex-wrap gap-2">
            {user.platforms.map((platform) => (
              <Badge key={platform} variant="outline" className="border-brand/40 text-blue-100">
                {platform.toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-200/80">Socials</p>
          <div className="flex flex-wrap gap-3">
            {user.socials.map((social) => {
              const Icon = socialIcons[social.kind];
              return (
                <a
                  key={social.kind}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-slate-950/60 px-3 py-1.5 text-sm text-blue-100 transition-colors hover:border-brand hover:text-white"
                  aria-label={`Open ${social.kind} profile`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="capitalize">{social.kind}</span>
                </a>
              );
            })}
          </div>
        </div>

        {verifiedAccounts.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-200/80">Linked Accounts</p>
            <div className="flex flex-col gap-2">
              {verifiedAccounts.map((account) => (
                <PlatformBadge key={account.platform} account={account} />
              ))}
            </div>
            <p className="text-xs text-blue-200/70">
              Verification controlled server-side. Unverified accounts stay private.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
