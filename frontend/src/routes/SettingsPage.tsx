import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const SettingsPage = () => {
  return (
    <div className="w-full flex justify-center min-h-0">
      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_320px] gap-4 min-h-0">
        {/* Main settings column: profile editing and the larger account controls live here. */}
        <section className="space-y-4">
          {/* Page header: short intro and top-level actions for the settings route. */}
          <div className="bg-app-panel rounded-lg p-4 shadow-md shadow-app-border">
            <h1 className="app-heading">Settings</h1>
            <p className="text-sm text-app-muted">
              Page for account preferences, privacy, and connected services.
            </p>
          </div>

          {/* Profile section: fields that would eventually map to the user profile model. */}
          <SectionCard
            title="Profile"
            description="Basic account details that can be wired to the profile API."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input id="display-name" placeholder="Display name" className={fieldClassName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="handle">Handle</Label>
                <Input id="handle" placeholder="@handle" className={fieldClassName} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="City, State" className={fieldClassName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" placeholder="America/New_York" className={fieldClassName} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Short profile bio"
                className={textareaClassName}
              />
            </div>
          </SectionCard>

          {/* Notifications section: placeholder toggles for app and email updates. */}
          <SectionCard
            title="Notifications"
            description="Placeholder toggles for message, achievement, and digest updates."
          >
            <SettingsToggle
              title="Achievement notifications"
              description="Notify users about unlocks, comments, or profile activity."
            />
            <SettingsToggle
              title="Direct message alerts"
              description="Show alerts when new messages or replies arrive."
            />
            <SettingsToggle
              title="Email updates"
              description="Send a periodic summary and important account notices."
            />
          </SectionCard>

          {/* Appearance section: a future home for theme and display preferences. */}
          <SectionCard
            title="Appearance"
            description="Reserved for display options and feed presentation preferences."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <PlaceholderPanel
                title="Theme"
                description="Light, dark, or system theme selection can live here later."
              />
              <PlaceholderPanel
                title="Achievement layout"
                description="Grid density, icon size, and sorting defaults can be configured here."
              />
            </div>
          </SectionCard>

          {/* Save actions: kept simple for now because this page is still a scaffold. */}
          <div className="bg-app-panel rounded-lg p-4 shadow-md shadow-app-border">
            <div className="flex flex-wrap gap-3">
              <Button>Save Changes</Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </div>
        </section>

        {/* Sidebar column: smaller settings groups that do not need the full main content width. */}
        <aside className="space-y-4">
          {/* Privacy section: visibility controls that affect what other users can see. */}
          <SectionCard
            title="Privacy"
            description="Visibility controls for profile content and linked account data."
            className="p-4"
          >
            <SettingsToggle
              title="Show achievements publicly"
              description="Control whether recent unlocks appear on the profile."
            />
            <SettingsToggle
              title="Show linked accounts"
              description="Control whether connected platforms are visible."
            />
            <SettingsToggle
              title="Show social links"
              description="Control whether external profile links appear on the page."
            />
          </SectionCard>

          {/* Connected accounts section: slots for Steam and future platform linking UI. */}
          <SectionCard
            title="Connected Accounts"
            description="This area can hold account linking, sync status, and re-auth actions."
            className="p-4"
          >
            <PlaceholderPanel
              title="Steam"
              description="Primary platform connection status and sync controls."
            />
            <PlaceholderPanel
              title="More platforms"
              description="Xbox, PlayStation, and other providers can be added here later."
            />
          </SectionCard>

          {/* Security section: reserved for credentials, sessions, and verification work. */}
          <SectionCard
            title="Security"
            description="Reserved for passwordless login management, sessions, and verification tools."
            className="p-4"
          >
            <div className="space-y-3 text-sm text-app-muted">
              <p>Active sessions</p>
              <p>Steam re-link flow</p>
              <p>Recovery options</p>
            </div>
          </SectionCard>

          {/* Danger zone: destructive actions should stay visually isolated from normal settings. */}
          <div className="bg-app-panel rounded-lg p-4 shadow-md shadow-app-border">
            <h2 className="app-heading mb-2 text-lg">Danger Zone</h2>
            <p className="text-sm text-app-muted mb-4">
              Place destructive account actions here so they stay separate from normal settings.
            </p>

            <div className="flex flex-col gap-3">
              <Button variant="outline" className="justify-start">
                Disconnect account
              </Button>
              <Button variant="outline" className="justify-start">
                Delete profile
              </Button>
            </div>
          </div>
        </aside>
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
        <p className="text-sm text-app-muted">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

type PlaceholderPanelProps = {
  title: string;
  description: string;
};

const PlaceholderPanel = ({ title, description }: PlaceholderPanelProps) => {
  return (
    <div className="bg-app-bg rounded-lg border border-app-border p-3">
      <p className="text-sm font-medium text-app-text">{title}</p>
      <p className="text-sm text-app-muted">{description}</p>
    </div>
  );
};

type SettingsToggleProps = {
  title: string;
  description: string;
};

const SettingsToggle = ({ title, description }: SettingsToggleProps) => {
  return (
    <div className="flex items-start justify-between gap-4 bg-app-bg rounded-lg border border-app-border p-3">
      <div>
        <p className="text-sm font-medium text-app-text">{title}</p>
        <p className="text-sm text-app-muted">{description}</p>
      </div>
      <Switch />
    </div>
  );
};

const fieldClassName =
  "bg-app-bg text-app-text placeholder:text-app-muted border-app-border focus-visible:ring-brand";

const textareaClassName =
  "min-h-[100px] resize-none bg-app-bg text-app-text placeholder:text-app-muted border-app-border focus-visible:ring-brand";
