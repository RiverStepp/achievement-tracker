import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { normalizeHandle } from "@/profile/profileSetup";
import { userSettingsService } from "@/services/userSettings";
import type {
  LocationCityOption,
  LocationStateRegionOption,
  SettingsSocialPlatform,
  UpdateUserSettingsRequest,
  UserSettingsResponse,
} from "@/types/settings";

type SettingsFormState = {
  displayName: string;
  handle: string;
  bio: string;
  countryId: string;
  stateRegionId: string;
  cityId: string;
  ianaTimeZoneId: string;
  pronounOptionId: string;
  youtube: string;
  twitch: string;
  discord: string;
};

type DirtyState = {
  displayName: boolean;
  handle: boolean;
  bio: boolean;
  location: boolean;
  timeZone: boolean;
  pronouns: boolean;
  socials: boolean;
  profileImage: boolean;
  bannerImage: boolean;
};

const DEFAULT_DIRTY_STATE: DirtyState = {
  displayName: false,
  handle: false,
  bio: false,
  location: false,
  timeZone: false,
  pronouns: false,
  socials: false,
  profileImage: false,
  bannerImage: false,
};

const DEFAULT_FORM: SettingsFormState = {
  displayName: "",
  handle: "",
  bio: "",
  countryId: "",
  stateRegionId: "",
  cityId: "",
  ianaTimeZoneId: "",
  pronounOptionId: "",
  youtube: "",
  twitch: "",
  discord: "",
};

const SOCIAL_FIELDS: Array<{
  key: keyof Pick<SettingsFormState, "youtube" | "twitch" | "discord">;
  label: string;
  platform: SettingsSocialPlatform;
  placeholder: string;
}> = [
  { key: "youtube", label: "YouTube", platform: 1, placeholder: "Channel URL or handle" },
  { key: "twitch", label: "Twitch", platform: 2, placeholder: "Channel URL or handle" },
  { key: "discord", label: "Discord", platform: 3, placeholder: "Invite URL or username" },
];

function getSocialValue(settings: UserSettingsResponse, platform: SettingsSocialPlatform) {
  return settings.socialLinks.find((item) => item.platform === platform)?.linkValue ?? "";
}

function toOptionValue(value: number | null | undefined) {
  return value ? String(value) : "";
}

function createFormState(settings: UserSettingsResponse): SettingsFormState {
  return {
    displayName: settings.displayName ?? "",
    handle: settings.handle?.replace(/^@/, "") ?? "",
    bio: settings.bio ?? "",
    countryId: toOptionValue(settings.location?.countryId),
    stateRegionId: toOptionValue(settings.location?.stateRegionId),
    cityId: toOptionValue(settings.location?.cityId),
    ianaTimeZoneId: toOptionValue(settings.timeZone?.ianaTimeZoneId),
    pronounOptionId: toOptionValue(settings.pronouns?.pronounOptionId),
    youtube: getSocialValue(settings, 1),
    twitch: getSocialValue(settings, 2),
    discord: getSocialValue(settings, 3),
  };
}

function toNullableNumber(value: string) {
  return value ? Number(value) : null;
}

export const SettingsPage = () => {
  const { steamUser, refreshCurrentUserProfile } = useAuth();
  const [form, setForm] = useState<SettingsFormState>(DEFAULT_FORM);
  const [settings, setSettings] = useState<UserSettingsResponse | null>(null);
  const [stateRegions, setStateRegions] = useState<LocationStateRegionOption[]>([]);
  const [cities, setCities] = useState<LocationCityOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dirty, setDirty] = useState<DirtyState>(DEFAULT_DIRTY_STATE);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [removeBannerImage, setRemoveBannerImage] = useState(false);

  const hydrateForm = (nextSettings: UserSettingsResponse) => {
    setSettings(nextSettings);
    setForm(createFormState(nextSettings));
    setDirty(DEFAULT_DIRTY_STATE);
    setProfileImageFile(null);
    setBannerImageFile(null);
    setRemoveProfileImage(false);
    setRemoveBannerImage(false);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const nextSettings = await userSettingsService.get();
        if (cancelled) {
          return;
        }

        hydrateForm(nextSettings);
      } catch (error: any) {
        console.log("[settings] failed to load settings", { error });
        toast({
          title: "Could not load settings",
          description:
            error?.response?.data?.error ||
            error?.message ||
            "The settings page could not load your current profile settings.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadStateRegions = async () => {
      if (!form.countryId) {
        setStateRegions([]);
        return;
      }

      try {
        const items = await userSettingsService.getStateRegions(Number(form.countryId));
        if (!cancelled) {
          setStateRegions(items);
        }
      } catch (error) {
        if (!cancelled) {
          console.log("[settings] failed to load state regions", { error, countryId: form.countryId });
          setStateRegions([]);
        }
      }
    };

    void loadStateRegions();

    return () => {
      cancelled = true;
    };
  }, [form.countryId]);

  useEffect(() => {
    let cancelled = false;

    const loadCities = async () => {
      if (!form.stateRegionId) {
        setCities([]);
        return;
      }

      try {
        const items = await userSettingsService.getCities(Number(form.stateRegionId));
        if (!cancelled) {
          setCities(items);
        }
      } catch (error) {
        if (!cancelled) {
          console.log("[settings] failed to load cities", { error, stateRegionId: form.stateRegionId });
          setCities([]);
        }
      }
    };

    void loadCities();

    return () => {
      cancelled = true;
    };
  }, [form.stateRegionId]);

  const currentProfileImageUrl = useMemo(() => {
    if (removeProfileImage) {
      return null;
    }
    return settings?.profileImage?.url ?? null;
  }, [removeProfileImage, settings?.profileImage?.url]);

  const currentBannerImageUrl = useMemo(() => {
    if (removeBannerImage) {
      return null;
    }
    return settings?.bannerImage?.url ?? null;
  }, [removeBannerImage, settings?.bannerImage?.url]);

  const hasDirtyChanges = Object.values(dirty).some(Boolean);

  const canSave =
    form.displayName.trim().length > 0 &&
    normalizeHandle(form.handle).length > 0 &&
    hasDirtyChanges &&
    !isSaving;

  const handleSave = async () => {
    if (!settings || !canSave) {
      return;
    }

    const normalizedHandle = normalizeHandle(form.handle);
    setIsSaving(true);

    try {
      if (
        dirty.displayName ||
        dirty.handle ||
        dirty.bio ||
        dirty.location ||
        dirty.timeZone ||
        dirty.pronouns ||
        dirty.socials ||
        dirty.profileImage ||
        dirty.bannerImage
      ) {
        const request: UpdateUserSettingsRequest = {};

        if (dirty.displayName) {
          request.displayName = form.displayName.trim();
        }

        if (dirty.handle) {
          request.handle = `@${normalizedHandle}`;
        }

        if (dirty.bio) {
          request.bio = form.bio.trim() || null;
        }

        if (dirty.location) {
          request.location =
            form.countryId || form.stateRegionId || form.cityId
              ? {
                  countryId: toNullableNumber(form.countryId),
                  stateRegionId: toNullableNumber(form.stateRegionId),
                  cityId: toNullableNumber(form.cityId),
                }
              : null;
          request.unsetLocation = !form.countryId && !form.stateRegionId && !form.cityId;
        }

        if (dirty.timeZone) {
          request.ianaTimeZoneId = toNullableNumber(form.ianaTimeZoneId);
          request.unsetTimeZone = !form.ianaTimeZoneId;
        }

        if (dirty.pronouns) {
          request.pronounOptionId = toNullableNumber(form.pronounOptionId);
          request.unsetPronouns = !form.pronounOptionId;
        }

        if (dirty.socials) {
          request.socialLinks = SOCIAL_FIELDS.map((field) => ({
            platform: field.platform,
            linkValue: form[field.key].trim() || null,
            isVisible: form[field.key].trim().length > 0,
          })).filter((item) => Boolean(item.linkValue));
        }

        if (dirty.profileImage && removeProfileImage) {
          request.unsetProfileImage = true;
        }

        if (dirty.bannerImage && removeBannerImage) {
          request.unsetBannerImage = true;
        }

        if (Object.keys(request).length > 0) {
          await userSettingsService.update(request);
        }
      }

      if ((dirty.profileImage && profileImageFile) || (dirty.bannerImage && bannerImageFile)) {
        await userSettingsService.updateMedia({
          profileImage: dirty.profileImage ? profileImageFile : null,
          bannerImage: dirty.bannerImage ? bannerImageFile : null,
        });
      }

      const updatedSettings = await userSettingsService.get();
      hydrateForm(updatedSettings);
      await refreshCurrentUserProfile();

      toast({
        title: "Settings saved",
        description: "Your profile settings were updated successfully.",
      });
    } catch (error: any) {
      console.log("[settings] failed to save settings", { error });
      toast({
        title: "Could not save settings",
        description:
          error?.response?.data?.error ||
          error?.response?.data?.title ||
          error?.message ||
          "The settings update failed.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  if (!settings) {
    return <div>Could not load settings.</div>;
  }

  return (
    <div className="w-full flex justify-center min-h-0">
      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_360px] gap-4 min-h-0">
        <section className="space-y-4">
          <SectionCard
            title="Profile"
            description=""
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  value={form.displayName}
                  onChange={(event) =>
                    {
                      setForm((current) => ({ ...current, displayName: event.target.value }));
                      setDirty((current) => ({ ...current, displayName: true }));
                    }
                  }
                  className={fieldClassName}
                  placeholder="Display name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="handle">Handle</Label>
                <Input
                  id="handle"
                  value={form.handle}
                  onChange={(event) =>
                    {
                      setForm((current) => ({ ...current, handle: event.target.value }));
                      setDirty((current) => ({ ...current, handle: true }));
                    }
                  }
                  className={fieldClassName}
                  placeholder="your_handle"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={(event) => {
                  setForm((current) => ({ ...current, bio: event.target.value }));
                  setDirty((current) => ({ ...current, bio: true }));
                }}
                className={textareaClassName}
                placeholder="Write a short profile bio."
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Media"
            description=""
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MediaField
                label="Profile image"
                currentUrl={currentProfileImageUrl}
                currentFileName={settings.profileImage.fileName}
                file={profileImageFile}
                onFileChange={(file) => {
                  setProfileImageFile(file);
                  setDirty((current) => ({ ...current, profileImage: true }));
                  if (file) {
                    setRemoveProfileImage(false);
                  }
                }}
                removeEnabled={removeProfileImage}
                onToggleRemove={() => {
                  setRemoveProfileImage((current) => !current);
                  setProfileImageFile(null);
                  setDirty((current) => ({ ...current, profileImage: true }));
                }}
              />
              <MediaField
                label="Banner image"
                currentUrl={currentBannerImageUrl}
                currentFileName={settings.bannerImage.fileName}
                file={bannerImageFile}
                onFileChange={(file) => {
                  setBannerImageFile(file);
                  setDirty((current) => ({ ...current, bannerImage: true }));
                  if (file) {
                    setRemoveBannerImage(false);
                  }
                }}
                removeEnabled={removeBannerImage}
                onToggleRemove={() => {
                  setRemoveBannerImage((current) => !current);
                  setBannerImageFile(null);
                  setDirty((current) => ({ ...current, bannerImage: true }));
                }}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Location And Preferences"
            description=""
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <select
                  id="country"
                  className={selectClassName}
                  value={form.countryId}
                  onChange={(event) =>
                    {
                      setForm((current) => ({
                        ...current,
                        countryId: event.target.value,
                        stateRegionId: "",
                        cityId: "",
                      }));
                      setDirty((current) => ({ ...current, location: true }));
                    }
                  }
                >
                  <option value="">None</option>
                  {settings.countries.map((country) => (
                    <option key={country.locationCountryId} value={country.locationCountryId}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state-region">State / Region</Label>
                <select
                  id="state-region"
                  className={selectClassName}
                  value={form.stateRegionId}
                  onChange={(event) =>
                    {
                      setForm((current) => ({
                        ...current,
                        stateRegionId: event.target.value,
                        cityId: "",
                      }));
                      setDirty((current) => ({ ...current, location: true }));
                    }
                  }
                  disabled={!form.countryId}
                >
                  <option value="">None</option>
                  {stateRegions.map((stateRegion) => (
                    <option
                      key={stateRegion.locationStateRegionId}
                      value={stateRegion.locationStateRegionId}
                    >
                      {stateRegion.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <select
                  id="city"
                  className={selectClassName}
                  value={form.cityId}
                  onChange={(event) =>
                    {
                      setForm((current) => ({ ...current, cityId: event.target.value }));
                      setDirty((current) => ({ ...current, location: true }));
                    }
                  }
                  disabled={!form.stateRegionId}
                >
                  <option value="">None</option>
                  {cities.map((city) => (
                    <option key={city.locationCityId} value={city.locationCityId}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time-zone">Time Zone</Label>
                <select
                  id="time-zone"
                  className={selectClassName}
                  value={form.ianaTimeZoneId}
                  onChange={(event) =>
                    {
                      setForm((current) => ({ ...current, ianaTimeZoneId: event.target.value }));
                      setDirty((current) => ({ ...current, timeZone: true }));
                    }
                  }
                >
                  <option value="">None</option>
                  {settings.ianaTimeZones.map((timeZone) => (
                    <option key={timeZone.ianaTimeZoneId} value={timeZone.ianaTimeZoneId}>
                      {timeZone.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pronouns">Pronouns</Label>
                <select
                  id="pronouns"
                  className={selectClassName}
                  value={form.pronounOptionId}
                  onChange={(event) =>
                    {
                      setForm((current) => ({ ...current, pronounOptionId: event.target.value }));
                      setDirty((current) => ({ ...current, pronouns: true }));
                    }
                  }
                >
                  <option value="">None</option>
                  {settings.pronounOptions.map((pronoun) => (
                    <option key={pronoun.pronounOptionId} value={pronoun.pronounOptionId}>
                      {pronoun.displayLabel}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Social Links"
            description=""
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SOCIAL_FIELDS.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    value={form[field.key]}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, [field.key]: event.target.value }));
                      setDirty((current) => ({ ...current, socials: true }));
                    }}
                    className={fieldClassName}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="bg-app-panel rounded-lg p-4 shadow-md shadow-app-border">
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSave} disabled={!canSave}>
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
              <Button
                variant="outline"
                onClick={() => settings && hydrateForm(settings)}
                disabled={isSaving}
              >
                Reset
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

type SectionCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

const SectionCard = ({ title, description, children, className = "p-4" }: SectionCardProps) => {
  return (
    <div className={`bg-app-panel rounded-lg shadow-md shadow-app-border ${className} space-y-4`}>
      <div>
        <h2 className="app-heading text-lg">{title}</h2>
        {description ? <p className="text-sm text-app-muted">{description}</p> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

type MediaFieldProps = {
  label: string;
  currentUrl: string | null;
  currentFileName: string | null;
  file: File | null;
  onFileChange: (file: File | null) => void;
  removeEnabled: boolean;
  onToggleRemove: () => void;
};

const MediaField = ({
  label,
  currentUrl,
  currentFileName,
  file,
  onFileChange,
  removeEnabled,
  onToggleRemove,
}: MediaFieldProps) => {
  return (
    <div className="space-y-3 rounded-lg border border-app-border bg-app-bg p-3">
      <div>
        <p className="text-sm font-medium text-app-text">{label}</p>
        {currentFileName ? <p className="text-xs text-app-muted">{currentFileName}</p> : null}
      </div>

      {currentUrl ? (
        <img
          src={currentUrl}
          alt={label}
          className="h-28 w-full rounded-md object-cover border border-app-border"
        />
      ) : (
        <div className="flex h-28 items-center justify-center rounded-md border border-dashed border-app-border text-sm text-app-muted">
          No image set
        </div>
      )}

      <Input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className={fieldClassName}
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />

      {file ? <p className="text-xs text-app-muted">Selected: {file.name}</p> : null}

      <Button type="button" variant="outline" onClick={onToggleRemove}>
        {removeEnabled ? "Keep current image" : "Remove current image"}
      </Button>
    </div>
  );
};

const fieldClassName =
  "bg-app-bg text-app-text placeholder:text-app-muted border-app-border focus-visible:ring-brand";

const selectClassName =
  "flex h-10 w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClassName =
  "min-h-[120px] resize-none bg-app-bg text-app-text placeholder:text-app-muted border-app-border focus-visible:ring-brand";
