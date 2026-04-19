import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type SpinnerProps = {
  className?: string;
};

export const Spinner = ({ className }: SpinnerProps) => {
  return (
    <LoaderCircle
      className={cn("h-4 w-4 animate-spin text-app-muted", className)}
      aria-hidden="true"
    />
  );
};
