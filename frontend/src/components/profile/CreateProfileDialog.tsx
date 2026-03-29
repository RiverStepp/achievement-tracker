import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const toHandleSeed = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");

export const CreateProfileDialog = () => {
  const navigate = useNavigate();
  const { needsProfileSetup, steamUser, createUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [timezone, setTimezone] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  useEffect(() => {
    if (!needsProfileSetup || !steamUser) return;

    const displaySeed = steamUser.personaName || steamUser.steamId;
    setDisplayName(displaySeed);
    setHandle(toHandleSeed(displaySeed));
    setBio("");
    setLocation("");
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setPronouns("");
    setAvatarUrl(steamUser.avatarFullUrl || steamUser.avatarMediumUrl || "");
    setBannerUrl("");
  }, [needsProfileSetup, steamUser]);

  const normalizedHandle = toHandleSeed(handle);
  const canSubmit = displayName.trim().length > 0 && normalizedHandle.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;

    createUserProfile({
      displayName,
      handle: normalizedHandle,
      bio,
      location,
      timezone,
      pronouns,
      avatarUrl,
      bannerUrl,
    });
    navigate(`/u/${normalizedHandle}`);
  };

  return (
    <Dialog open={needsProfileSetup}>
      <DialogContent
        className="border-app-border bg-app-panel text-app-text shadow-md shadow-app-border sm:max-w-2xl"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="app-heading text-xl text-app-text">
            Create Your Profile
          </DialogTitle>
          <DialogDescription className="text-sm text-app-muted">
            Finish your first-time setup. For now this is stored locally until the real profile endpoints are wired in.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="rounded-lg border border-app-border bg-app-bg/70 p-3">
            <p className="text-sm text-app-muted">
              Your Steam account will be linked automatically after setup, and the Steam badge on your profile will point to your Steam page.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName" className="text-app-text">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="BrandonW"
                className={fieldClassName}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="handle" className="text-app-text">Handle</Label>
              <Input
                id="handle"
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                placeholder="brandonw"
                className={fieldClassName}
              />
              <p className="text-xs text-app-muted">@{normalizedHandle || "handle"}</p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bio" className="text-app-text">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Tell people what you hunt, grind, or obsess over."
              className={textareaClassName}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="location" className="text-app-text">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Ohio, USA"
                className={fieldClassName}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timezone" className="text-app-text">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                placeholder="America/New_York"
                className={fieldClassName}
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="pronouns" className="text-app-text">Pronouns</Label>
              <Input
                id="pronouns"
                value={pronouns}
                onChange={(event) => setPronouns(event.target.value)}
                placeholder="he/him"
                className={fieldClassName}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="avatarUrl" className="text-app-text">Avatar URL</Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://..."
                className={fieldClassName}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bannerUrl" className="text-app-text">Banner URL</Label>
            <Input
              id="bannerUrl"
              value={bannerUrl}
              onChange={(event) => setBannerUrl(event.target.value)}
              placeholder="https://..."
              className={fieldClassName}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSubmit} disabled={!canSubmit} className="shadow-sm shadow-app-border">
              Create Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const fieldClassName =
  "bg-app-bg text-app-text placeholder:text-app-muted border-app-border focus-visible:ring-brand";

const textareaClassName =
  "min-h-24 resize-none bg-app-bg text-app-text placeholder:text-app-muted border-app-border focus-visible:ring-brand";
