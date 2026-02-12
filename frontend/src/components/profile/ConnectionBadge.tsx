import { CheckCircle2 } from "lucide-react";
import { Platform } from "@/types/profile";
type ConnectionBadgeProps = {
    platform: Platform;
    usernameOrId: string;
    profileUrl: string;
    accountVerified: boolean;
}

export const ConnectionBadge = ({ platform, usernameOrId, profileUrl, accountVerified }: ConnectionBadgeProps) => {
    const platformColors: Record<Platform, string> = {
      steam: "bg-gradient-to-tr from-[#1b2838] to-[#2a475e]",
      pc: "bg-gradient-to-tr from-[#4a90e2] to-[#357ABD]",
      xbox: "bg-gradient-to-tr from-[#107c10] to-[#0f5f0f]",
      psn: "bg-gradient-to-tr from-[#003791] to-[#0a56b3]",
      switch: "bg-gradient-to-tr from-[#e60012] to-[#b7000e]",
    };

    const platformLabel: Record<Platform, string> = {
      steam: "Steam",
      pc: "PC",
      xbox: "Xbox",
      psn: "PlayStation",
      switch: "Switch",
    };

    return (
        <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex shrink-0 items-center gap-2 px-3 py-1 rounded-full text-sm text-white outline outline-1 outline-white/30 ${platformColors[platform]}`}
        >
            <span className="font-semibold">{platformLabel[platform]}</span>
            <span className="opacity-90">{usernameOrId}</span>
            {accountVerified && <CheckCircle2 className="h-3.5 w-3.5" aria-label="Verified account" />}
        </a>
    )
}
