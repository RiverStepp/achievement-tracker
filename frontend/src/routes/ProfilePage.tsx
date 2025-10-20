import React from 'react';
import { useParams } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { AboutCard } from '@/components/AboutCard';
import { PinnedGrid } from '@/components/PinnedGrid';
import { FavoritesGrid } from '@/components/FavoritesGrid';
import { ActivityFeed } from '@/components/ActivityFeed';
import { AchievementsPreview } from '@/components/AchievementsPreview';
import { EditProfileModal } from '@/components/EditProfileModal';
import { getMockUser } from '@/data/mockUser';
import { UserProfile } from '@/types/user';

interface EditState {
  open: boolean;
  tab: 'profile' | 'accounts' | 'privacy';
  focus?: 'pins' | 'profile';
}

let toastId = 0;

export const ProfilePage: React.FC = () => {
  

  const params = useParams<{ handle: string }>();
  const [profile, setProfile] = React.useState<UserProfile | undefined>(() =>
    params.handle ? getMockUser(params.handle) : undefined
  );
  const [editState, setEditState] = React.useState<EditState>({ open: false, tab: 'profile' });
  const [toasts, setToasts] = React.useState<Array<{ id: number; message: string }>>([]);

  React.useEffect(() => {
    if (params.handle) {
      setProfile(getMockUser(params.handle));
    }
  }, [params.handle]);

  const showToast = React.useCallback((message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">User not found</h1>
          <p className="mt-2 text-sm text-slate-400">This profile hasn\'t been created yet.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 pb-16 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 text-blue-100 sm:px-6 lg:px-10">
        <Banner
          user={profile}
          onNotify={showToast}
          onEdit={(opts) =>
            setEditState({ open: true, tab: opts?.tab ?? 'profile', focus: opts?.focus })
          }
        />

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <AboutCard user={profile} />
          <AchievementsPreview activity={profile.activity} />
        </div>

        <PinnedGrid
          pins={profile.pins}
          onEditPins={() => setEditState({ open: true, tab: 'profile', focus: 'pins' })}
        />

        <FavoritesGrid favoriteGames={profile.favoriteGames} favoriteGenres={profile.favoriteGenres} />

        {profile.privacy.showActivity && (
          <ActivityFeed activity={profile.activity} />
        )}
      </div>

      <EditProfileModal
        user={profile}
        open={editState.open}
        initialTab={editState.tab}
        focusSection={editState.focus}
        onNotify={showToast}
        onOpenChange={(open) => setEditState((prev) => ({ ...prev, open }))}
        onSave={(next) => setProfile(next)}
      />

      <div className="pointer-events-none fixed bottom-6 right-6 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-2xl border border-brand/40 bg-slate-950/90 px-4 py-3 text-sm text-blue-100 shadow-lg shadow-slate-950/50"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </main>
  );
};

export default ProfilePage;
