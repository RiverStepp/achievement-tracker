import { useEffect, useMemo, useState } from "react";
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
import { userSettingsService } from "@/services/userSettings";
import type {
  LocationCityOption,
  LocationStateRegionOption,
  SettingsSocialPlatform,
  UserSettingsResponse,
} from "@/types/settings";

const SOCIAL_FIELDS: Array<{
  key: "youtube" | "twitch" | "discord";
  label: string;
  platform: SettingsSocialPlatform;
  placeholder: string;
}> = [
  { key: "youtube", label: "YouTube", platform: 1, placeholder: "Channel URL or handle" },
  { key: "twitch", label: "Twitch", platform: 2, placeholder: "Channel URL or handle" },
  { key: "discord", label: "Discord", platform: 3, placeholder: "Invite URL or username" },
];

type DialogFormState = {
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

const DEFAULT_FORM: DialogFormState = {
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

const toHandleSeed = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");

const toNullableNumber = (value: string) => (value ? Number(value) : null);

function getSocialValue(settings: UserSettingsResponse, platform: SettingsSocialPlatform) {
  return settings.socialLinks.find((item) => item.platform === platform)?.linkValue ?? "";
}

function buildInitialForm(
  steamSeed: string,
  settings: UserSettingsResponse | null
): DialogFormState {
  if (!settings) {
    return {
      ...DEFAULT_FORM,
      displayName: steamSeed,
      handle: toHandleSeed(steamSeed),
    };
  }

  return {
    displayName: settings.displayName ?? steamSeed,
    handle: settings.handle?.replace(/^@/, "") ?? toHandleSeed(steamSeed),
    bio: settings.bio ?? "",
    countryId: settings.location?.countryId ? String(settings.location.countryId) : "",
    stateRegionId: settings.location?.stateRegionId ? String(settings.location.stateRegionId) : "",
    cityId: settings.location?.cityId ? String(settings.location.cityId) : "",
    ianaTimeZoneId: settings.timeZone?.ianaTimeZoneId
      ? String(settings.timeZone.ianaTimeZoneId)
      : "",
    pronounOptionId: settings.pronouns?.pronounOptionId
      ? String(settings.pronouns.pronounOptionId)
      : "",
    youtube: getSocialValue(settings, 1),
    twitch: getSocialValue(settings, 2),
    discord: getSocialValue(settings, 3),
  };
}

export const CreateProfileDialog = () => {
  const navigate = useNavigate();
  const { needsProfileSetup, steamUser, createUserProfile, appUser } = useAuth();
  const [settings, setSettings] = useState<UserSettingsResponse | null>(null);
  const [form, setForm] = useState<DialogFormState>(DEFAULT_FORM);
  const [stateRegions, setStateRegions] = useState<LocationStateRegionOption[]>([]);
  const [cities, setCities] = useState<LocationCityOption[]>([]);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    if (!needsProfileSetup || !steamUser) return;

    let cancelled = false;
    const steamSeed = steamUser.personaName || steamUser.steamId;

    const load = async () => {
      setIsLoadingOptions(true);
      setErrorMessage(null);
      setProfileImageFile(null);
      setBannerImageFile(null);

      try {
        const nextSettings = await userSettingsService.get();
        if (cancelled) {
          return;
        }

        setSettings(nextSettings);
        setForm(buildInitialForm(steamSeed, nextSettings));
      } catch (error: any) {
        if (cancelled) {
          return;
        }

        console.log("[create-profile] failed to load settings seed data", { error });
        setSettings(null);
        setForm(buildInitialForm(steamSeed, null));
        setErrorMessage(
          error?.response?.data?.error ||
            error?.message ||
            "Could not load setup options."
        );
      } finally {
        if (!cancelled) {
          setIsLoadingOptions(false);
          setIsSubmitting(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [needsProfileSetup, steamUser]);

  useEffect(() => {
    let cancelled = false;

    const loadStateRegions = async () => {
      if (!needsProfileSetup || !form.countryId) {
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
          console.log("[create-profile] failed to load state regions", {
            error,
            countryId: form.countryId,
          });
          setStateRegions([]);
        }
      }
    };

    void loadStateRegions();

    return () => {
      cancelled = true;
    };
  }, [needsProfileSetup, form.countryId]);

  useEffect(() => {
    let cancelled = false;

    const loadCities = async () => {
      if (!needsProfileSetup || !form.stateRegionId) {
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
          console.log("[create-profile] failed to load cities", {
            error,
            stateRegionId: form.stateRegionId,
          });
          setCities([]);
        }
      }
    };

    void loadCities();

    return () => {
      cancelled = true;
    };
  }, [needsProfileSetup, form.stateRegionId]);

  const normalizedHandle = useMemo(() => toHandleSeed(form.handle), [form.handle]);
  const canSubmit =
    !isLoadingOptions &&
    form.displayName.trim().length > 0 &&
    normalizedHandle.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const error = await createUserProfile({
      displayName: form.displayName,
      handle: normalizedHandle,
      bio: form.bio,
      countryId: toNullableNumber(form.countryId),
      stateRegionId: toNullableNumber(form.stateRegionId),
      cityId: toNullableNumber(form.cityId),
      ianaTimeZoneId: toNullableNumber(form.ianaTimeZoneId),
      pronounOptionId: toNullableNumber(form.pronounOptionId),
      socials: SOCIAL_FIELDS.map((field) => ({
        platform: field.platform,
        linkValue: form[field.key],
        isVisible: form[field.key].trim().length > 0,
      })),
      profileImageFile,
      bannerImageFile,
    });

    if (error) {
      setErrorMessage(error);
      setIsSubmitting(false);
      return;
    }

    navigate(`/u/${appUser?.publicId ?? normalizedHandle}`);
  };

  return (
    <Dialog open={needsProfileSetup}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto border-app-border bg-app-panel text-app-text shadow-md shadow-app-border sm:max-w-3xl"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="app-heading text-xl text-app-text">
            Complete Your Profile
          </DialogTitle>
          <DialogDescription className="text-sm text-app-muted">
            This setup is required for new accounts. Finish these profile fields before using the app.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="rounded-lg border border-app-border bg-app-bg/70 p-3">
            <p className="text-sm text-app-muted">
              Your Steam account is already linked. Complete your profile details now, then you can adjust them later from settings.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName" className="text-app-text">Display Name</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, displayName: event.target.value }))
                }
                placeholder="BrandonW"
                className={fieldClassName}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="handle" className="text-app-text">Handle</Label>
              <Input
                id="handle"
                value={form.handle}
                onChange={(event) =>
                  setForm((current) => ({ ...current, handle: event.target.value }))
                }
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
              value={form.bio}
              onChange={(event) =>
                setForm((current) => ({ ...current, bio: event.target.value }))
              }
              placeholder="Tell people what you play, collect, or grind."
              className={textareaClassName}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="country" className="text-app-text">Country</Label>
              <select
                id="country"
                className={selectClassName}
                value={form.countryId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    countryId: event.target.value,
                    stateRegionId: "",
                    cityId: "",
                  }))
                }
              >
                <option value="">None</option>
                {settings?.countries.map((country) => (
                  <option key={country.locationCountryId} value={country.locationCountryId}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="state-region" className="text-app-text">State / Region</Label>
              <select
                id="state-region"
                className={selectClassName}
                value={form.stateRegionId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    stateRegionId: event.target.value,
                    cityId: "",
                  }))
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

            <div className="grid gap-2">
              <Label htmlFor="city" className="text-app-text">City</Label>
              <select
                id="city"
                className={selectClassName}
                value={form.cityId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, cityId: event.target.value }))
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
            <div className="grid gap-2">
              <Label htmlFor="time-zone" className="text-app-text">Time Zone</Label>
              <select
                id="time-zone"
                className={selectClassName}
                value={form.ianaTimeZoneId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, ianaTimeZoneId: event.target.value }))
                }
              >
                <option value="">None</option>
                {settings?.ianaTimeZones.map((timeZone) => (
                  <option key={timeZone.ianaTimeZoneId} value={timeZone.ianaTimeZoneId}>
                    {timeZone.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pronouns" className="text-app-text">Pronouns</Label>
              <select
                id="pronouns"
                className={selectClassName}
                value={form.pronounOptionId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, pronounOptionId: event.target.value }))
                }
              >
                <option value="">None</option>
                {settings?.pronounOptions.map((pronoun) => (
                  <option key={pronoun.pronounOptionId} value={pronoun.pronounOptionId}>
                    {pronoun.displayLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SOCIAL_FIELDS.map((field) => (
              <div key={field.key} className="grid gap-2">
                <Label htmlFor={field.key} className="text-app-text">{field.label}</Label>
                <Input
                  id={field.key}
                  value={form[field.key]}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                  placeholder={field.placeholder}
                  className={fieldClassName}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="profileImage" className="text-app-text">Profile Image</Label>
              <Input
                id="profileImage"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className={fieldClassName}
                onChange={(event) => setProfileImageFile(event.target.files?.[0] ?? null)}
              />
              {profileImageFile ? (
                <p className="text-xs text-app-muted">{profileImageFile.name}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bannerImage" className="text-app-text">Banner Image</Label>
              <Input
                id="bannerImage"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className={fieldClassName}
                onChange={(event) => setBannerImageFile(event.target.files?.[0] ?? null)}
              />
              {bannerImageFile ? (
                <p className="text-xs text-app-muted">{bannerImageFile.name}</p>
              ) : null}
            </div>
          </div>

          {errorMessage ? (
            <p className="text-sm text-red-400">{errorMessage}</p>
          ) : null}

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => void handleSubmit()}
              disabled={!canSubmit || isSubmitting}
              className="shadow-sm shadow-app-border"
            >
              {isSubmitting ? "Saving..." : "Complete Profile"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const fieldClassName =
  "bg-app-bg text-app-text placeholder:text-app-muted border-app-border focus-visible:ring-brand";

const selectClassName =
  "flex h-10 w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClassName =
  "min-h-24 resize-none bg-app-bg text-app-text placeholder:text-app-muted border-app-border focus-visible:ring-brand";
