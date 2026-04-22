import { useState } from "react";

import { CreatePostDialog } from "@/components/home/CreatePostDialog";
import { Feed } from "@/components/home/Feed";
import { NewsPosts } from "@/components/home/NewsPosts";
import { Trending } from "@/components/home/Trending";

export const HomePage = () => {
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);

  return (
    <div className="w-full flex justify-center min-h-0 h-full">
      <div
        className="
          w-full
          max-w-[1100px]
          grid
          gap-4
          grid-cols-1
          lg:grid-cols-[minmax(0,680px)_360px]
          min-h-0
          h-full
        "
      >
        {/* Center feed column */}
        <div className="min-w-0 min-h-0 h-full flex flex-col gap-4">
          <div className="shrink-0">
            <CreatePostDialog
              onPostCreated={() => {
                console.log("[home-page] post created, refreshing feed");
                setFeedRefreshKey((current) => current + 1);
              }}
            />
          </div>
          <div className="min-h-0 flex-1">
            <Feed refreshKey={feedRefreshKey} />
          </div>
        </div>

        {/* Right sidebar */}
        {/*<aside className="space-y-4 min-h-0">
          <NewsPosts />
          <Trending />
        </aside>*/}
      </div>
    </div>
  );
};
