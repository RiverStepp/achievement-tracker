import type { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
 
type FlagBadgeProps = {
  icon: LucideIcon;
  label: string;
  description: string;
  colorClass: string;
};
 
export function AchievementFlagBadge({ icon: Icon, label, description, colorClass }: FlagBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1 cursor-default ${colorClass}`}>
          <Icon className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {description}
      </TooltipContent>
    </Tooltip>
  );
}
