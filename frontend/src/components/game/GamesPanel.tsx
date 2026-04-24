import { useState } from "react";

import { Label } from "@/components/ui/label";
import type { UserProfile } from "@/types/profile";
import { GamesGrid } from "./GamesGrid";

type GamesPanelProps = {
  profile: UserProfile;
};

type FilterOption = "recent" | "a-z" | "z-a" | "completion" | "playtime";

export const GamesPanel = ({ profile }: GamesPanelProps) => {
  const [filter, setFilter] = useState<FilterOption>("recent");
  const games = profile.games ?? [];

  return (
    <div className="rounded-lg bg-app-panel p-4 shadow-md shadow-app-border">
      <div className="mb-4 flex items-center">
        <Label htmlFor="games-filter" className="mr-2 text-app-label">
          Filter by:
        </Label>
        <select
          id="games-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value as FilterOption)}
          className="rounded-md border border-app-border bg-app-bg text-app-text placeholder:text-app-placeholder focus:outline-none focus:ring-2 focus:ring-app-focus"
        >
          <option value="recent">Most Recent</option>
          <option value="a-z">A-Z</option>
          <option value="z-a">Z-A</option>
          <option value="completion">Completion</option>
          <option value="playtime">Playtime</option>
        </select>
      </div>

      {games.length ? (
        <div className="flex max-h-[42rem] justify-center overflow-y-auto pr-1 app-scrollbar">
          <GamesGrid games={games} filter={filter} />
        </div>
      ) : (
        <p className="text-sm text-app-muted">No games found for this profile yet.</p>
      )}
    </div>
  );
};
