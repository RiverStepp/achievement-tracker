import { Link as LinkIconLucide } from "lucide-react";
import { SiDiscord, SiGithub, SiTwitch, SiX, SiYoutube } from "react-icons/si";
import type { SocialKind } from "@/types/profile";
import { cn } from "@/lib/utils";

type SocialBrandIconProps = {
  kind: SocialKind;
  url: string;
};

const LABEL_BY_KIND: Partial<Record<SocialKind, string>> = {
  youtube: "YouTube profile",
  twitch: "Twitch profile",
  discord: "Discord invite or profile",
  github: "GitHub profile",
  x: "X profile",
  website: "Website",
};

export function SocialBrandIcon({ kind, url }: SocialBrandIconProps) {
  const label = LABEL_BY_KIND[kind] ?? "Social profile link";
  const iconClassName = "h-5 w-5 shrink-0 text-app-muted transition-colors group-hover:text-app-text";

  const Glyph =
    kind === "youtube" ? (
      <SiYoutube className={iconClassName} aria-hidden="true" />
    ) : kind === "twitch" ? (
      <SiTwitch className={iconClassName} aria-hidden="true" />
    ) : kind === "discord" ? (
      <SiDiscord className={iconClassName} aria-hidden="true" />
    ) : kind === "github" ? (
      <SiGithub className={iconClassName} aria-hidden="true" />
    ) : kind === "x" ? (
      <SiX className={iconClassName} aria-hidden="true" />
    ) : (
      <LinkIconLucide className={iconClassName} aria-hidden="true" />
    );

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className={cn(
        "group inline-flex h-10 w-10 items-center justify-center rounded-lg border border-app-border",
        "bg-app-bg transition-colors hover:border-app-muted hover:bg-app-panel2"
      )}
    >
      {Glyph}
    </a>
  );
}
