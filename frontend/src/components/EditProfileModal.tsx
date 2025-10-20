import React from 'react';
import { X, Trash2, Plus, Save } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/types/user';
import { isBio, isHttpsUrl, nonEmpty } from '@/lib/validators';

interface EditProfileModalProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (user: UserProfile) => void;
  initialTab?: 'profile' | 'accounts' | 'privacy';
  focusSection?: 'pins' | 'profile';
  onNotify: (message: string) => void;
}

type DraftUser = UserProfile;

type ErrorState = Record<string, string>;

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  open,
  onOpenChange,
  onSave,
  initialTab = 'profile',
  focusSection,
  onNotify
}) => {
  const [tab, setTab] = React.useState<typeof initialTab>(initialTab);
  const [draft, setDraft] = React.useState<DraftUser>(user);
  const [errors, setErrors] = React.useState<ErrorState>({});
  const pinSectionRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (open) {
      setDraft(JSON.parse(JSON.stringify(user)) as DraftUser);
      setErrors({});
      setTab(initialTab);
      if (focusSection === 'pins') {
        setTab('profile');
        requestAnimationFrame(() => {
          pinSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    }
  }, [open, user, initialTab, focusSection]);

  const updateDraft = <K extends keyof DraftUser>(key: K, value: DraftUser[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateSocial = (kind: DraftUser['socials'][number]['kind'], url: string) => {
    updateDraft(
      'socials',
      draft.socials.map((social) => (social.kind === kind ? { ...social, url } : social))
    );
  };

  const updateFavorite = (type: 'games' | 'genres', index: number, value: string) => {
    if (type === 'games') {
      const updated = [...draft.favoriteGames];
      updated[index] = value;
      updateDraft('favoriteGames', updated);
    } else {
      const updated = [...draft.favoriteGenres];
      updated[index] = value;
      updateDraft('favoriteGenres', updated);
    }
  };

  const addFavorite = (type: 'games' | 'genres') => {
    if (type === 'games') {
      updateDraft('favoriteGames', [...draft.favoriteGames, '']);
    } else {
      updateDraft('favoriteGenres', [...draft.favoriteGenres, '']);
    }
  };

  const removeFavorite = (type: 'games' | 'genres', index: number) => {
    if (type === 'games') {
      updateDraft(
        'favoriteGames',
        draft.favoriteGames.filter((_, i) => i !== index)
      );
    } else {
      updateDraft(
        'favoriteGenres',
        draft.favoriteGenres.filter((_, i) => i !== index)
      );
    }
  };

  const updateAccount = (platform: DraftUser['linkedAccounts'][number]['platform'], field: 'usernameOrId' | 'profileUrl', value: string) => {
    updateDraft(
      'linkedAccounts',
      draft.linkedAccounts.map((account) =>
        account.platform === platform ? { ...account, [field]: value } : account
      )
    );
  };

  const addPin = () => {
    if (draft.pins.length >= 10) {
      onNotify('You can pin up to 10 items.');
      return;
    }
    updateDraft('pins', [...draft.pins, { title: '', statLabel: '', value: '' }]);
  };

  const updatePin = (index: number, field: keyof DraftUser['pins'][number], value: string) => {
    const updated = draft.pins.map((pin, i) => (i === index ? { ...pin, [field]: value } : pin));
    updateDraft('pins', updated);
  };

  const removePin = (index: number) => {
    updateDraft(
      'pins',
      draft.pins.filter((_, i) => i !== index)
    );
  };

  const handleSave = () => {
    const nextErrors: ErrorState = {};

    if (draft.bio && !isBio(draft.bio)) {
      nextErrors.bio = 'Bio must be 280 characters or fewer.';
    }

    if (draft.avatarUrl && !isHttpsUrl(draft.avatarUrl)) {
      nextErrors.avatarUrl = 'Avatar must be a secure https:// URL.';
    }

    if (draft.bannerUrl && !isHttpsUrl(draft.bannerUrl)) {
      nextErrors.bannerUrl = 'Banner must be a secure https:// URL.';
    }

    draft.socials.forEach((social) => {
      if (social.url && !isHttpsUrl(social.url)) {
        nextErrors[`social-${social.kind}`] = 'Enter a valid https:// link.';
      }
    });

    draft.linkedAccounts.forEach((account) => {
      if (!nonEmpty(account.usernameOrId)) {
        nextErrors[`account-${account.platform}-username`] = 'Username or ID is required.';
      }
      if (account.profileUrl && !isHttpsUrl(account.profileUrl)) {
        nextErrors[`account-${account.platform}-url`] = 'Profile link must start with https://';
      }
    });

    draft.pins.forEach((pin, index) => {
      if (!nonEmpty(pin.title)) {
        nextErrors[`pin-${index}-title`] = 'Title is required.';
      }
      if (!nonEmpty(pin.statLabel)) {
        nextErrors[`pin-${index}-stat`] = 'Stat label is required.';
      }
      if (pin.achievementIconUrl && !isHttpsUrl(pin.achievementIconUrl)) {
        nextErrors[`pin-${index}-icon`] = 'Icon must be a https:// image URL.';
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSave({ ...draft });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close editor">
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(value) => setTab(value as typeof initialTab)}>
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-200">Avatar URL</label>
                <Input
                  value={draft.avatarUrl}
                  onChange={(event) => updateDraft('avatarUrl', event.target.value)}
                  placeholder="https://..."
                />
                {errors.avatarUrl && <p className="mt-1 text-xs text-red-400">{errors.avatarUrl}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-200">Banner URL</label>
                <Input
                  value={draft.bannerUrl ?? ''}
                  onChange={(event) => updateDraft('bannerUrl', event.target.value)}
                  placeholder="https://..."
                />
                {errors.bannerUrl && <p className="mt-1 text-xs text-red-400">{errors.bannerUrl}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-200">Handle</label>
                <Input value={draft.handle} disabled aria-disabled />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-200">Location</label>
                <Input
                  value={draft.location ?? ''}
                  onChange={(event) => updateDraft('location', event.target.value)}
                  placeholder="City, Country"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-200">Bio</label>
              <Textarea
                value={draft.bio ?? ''}
                onChange={(event) => updateDraft('bio', event.target.value)}
                maxLength={280}
                placeholder="Tell players what you're grinding."
              />
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>{draft.bio?.length ?? 0} / 280</span>
                {errors.bio && <span className="text-red-400">{errors.bio}</span>}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">Social Links</h3>
              <div className="grid gap-3">
                {draft.socials.map((social) => (
                  <div key={social.kind}>
                    <label className="text-xs uppercase tracking-wide text-slate-400">
                      {social.kind}
                    </label>
                    <Input
                      value={social.url}
                      onChange={(event) => updateSocial(social.kind, event.target.value)}
                      placeholder="https://..."
                    />
                    {errors[`social-${social.kind}`] && (
                      <p className="mt-1 text-xs text-red-400">{errors[`social-${social.kind}`]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Favorites</h3>
                <p className="text-xs text-slate-500">Keep your go-to games and genres handy.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-slate-400">Games</span>
                    <Button size="sm" variant="ghost" onClick={() => addFavorite('games')}>
                      <Plus className="mr-1 h-3.5 w-3.5" />Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {draft.favoriteGames.map((game, index) => (
                      <div key={`fav-game-${index}`} className="flex items-center gap-2">
                        <Input
                          value={game}
                          onChange={(event) => updateFavorite('games', index, event.target.value)}
                          placeholder="Favorite game"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove game"
                          onClick={() => removeFavorite('games', index)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                    {draft.favoriteGames.length === 0 && (
                      <p className="text-xs text-slate-500">Add a few titles you never shut up about.</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-slate-400">Genres</span>
                    <Button size="sm" variant="ghost" onClick={() => addFavorite('genres')}>
                      <Plus className="mr-1 h-3.5 w-3.5" />Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {draft.favoriteGenres.map((genre, index) => (
                      <div key={`fav-genre-${index}`} className="flex items-center gap-2">
                        <Input
                          value={genre}
                          onChange={(event) => updateFavorite('genres', index, event.target.value)}
                          placeholder="Favorite genre"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove genre"
                          onClick={() => removeFavorite('genres', index)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                    {draft.favoriteGenres.length === 0 && (
                      <p className="text-xs text-slate-500">No favorite genres? Add the vibes you chase.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div ref={pinSectionRef} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Pins</h3>
                <Button variant="ghost" size="sm" onClick={addPin}>
                  <Plus className="mr-1 h-3.5 w-3.5" />Add Pin
                </Button>
              </div>
              <p className="text-xs text-slate-500">Surface up to ten of your proudest stats. Drag to reorder soon™.</p>
              <div className="space-y-4">
                {draft.pins.map((pin, index) => (
                  <div key={`pin-${index}`} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-brand/20 text-brand">Pin #{index + 1}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove pin"
                        onClick={() => removePin(index)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs uppercase tracking-wide text-slate-400">Title</label>
                        <Input
                          value={pin.title}
                          onChange={(event) => updatePin(index, 'title', event.target.value)}
                        />
                        {errors[`pin-${index}-title`] && (
                          <p className="mt-1 text-xs text-red-400">{errors[`pin-${index}-title`]}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-slate-400">Stat Label</label>
                        <Input
                          value={pin.statLabel}
                          onChange={(event) => updatePin(index, 'statLabel', event.target.value)}
                        />
                        {errors[`pin-${index}-stat`] && (
                          <p className="mt-1 text-xs text-red-400">{errors[`pin-${index}-stat`]}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs uppercase tracking-wide text-slate-400">Value</label>
                        <Input
                          value={pin.value ? String(pin.value) : ''}
                          onChange={(event) => updatePin(index, 'value', event.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-slate-400">Icon URL</label>
                        <Input
                          value={pin.achievementIconUrl ?? ''}
                          onChange={(event) => updatePin(index, 'achievementIconUrl', event.target.value)}
                          placeholder="https://..."
                        />
                        {errors[`pin-${index}-icon`] && (
                          <p className="mt-1 text-xs text-red-400">{errors[`pin-${index}-icon`]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {draft.pins.length === 0 && (
                  <p className="text-sm text-slate-500">No pins yet. Add a highlight to kick things off.</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-5">
            <p className="text-sm text-slate-400">
              Link platforms so friends can verify your achievements. Verification badges are controlled by the platform.
            </p>
            <div className="space-y-4">
              {draft.linkedAccounts.map((account) => (
                <div key={account.platform} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">{account.platform}</h3>
                    {account.accountVerified && (
                      <Badge className="bg-brand/20 text-brand">Verified by platform</Badge>
                    )}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs uppercase tracking-wide text-slate-400">Username / ID</label>
                      <Input
                        value={account.usernameOrId}
                        onChange={(event) => updateAccount(account.platform, 'usernameOrId', event.target.value)}
                      />
                      {errors[`account-${account.platform}-username`] && (
                        <p className="mt-1 text-xs text-red-400">{errors[`account-${account.platform}-username`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide text-slate-400">Profile URL</label>
                      <Input
                        value={account.profileUrl}
                        onChange={(event) => updateAccount(account.platform, 'profileUrl', event.target.value)}
                        placeholder="https://..."
                      />
                      {errors[`account-${account.platform}-url`] && (
                        <p className="mt-1 text-xs text-red-400">{errors[`account-${account.platform}-url`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4">
            <p className="text-sm text-slate-400">Dial in what you share with the community.</p>
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Show Banner Stats</p>
                  <p className="text-xs text-slate-500">Hide your total hours, achievements, and games if you prefer stealth mode.</p>
                </div>
                <Switch
                  checked={draft.privacy.showStats}
                  onCheckedChange={(checked) =>
                    updateDraft('privacy', { ...draft.privacy, showStats: checked })
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Show Activity Feed</p>
                  <p className="text-xs text-slate-500">Keep your unlock history public or reserve it for close friends.</p>
                </div>
                <Switch
                  checked={draft.privacy.showActivity}
                  onCheckedChange={(checked) =>
                    updateDraft('privacy', { ...draft.privacy, showActivity: checked })
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Show Linked Accounts</p>
                  <p className="text-xs text-slate-500">Only verified profiles surface publicly. You control their visibility.</p>
                </div>
                <Switch
                  checked={draft.privacy.showLinkedAccounts}
                  onCheckedChange={(checked) =>
                    updateDraft('privacy', { ...draft.privacy, showLinkedAccounts: checked })
                  }
                />
              </label>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
