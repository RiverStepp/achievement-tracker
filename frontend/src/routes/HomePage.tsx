// src/routes/HomePage.tsx
import { Feed } from "@/components/home/Feed";
import { NewsPosts } from "@/components/home/NewsPosts";
import { Trending } from "@/components/home/Trending";

export const HomePage = () => {
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
        <div className="min-w-0 min-h-0 h-full">
          <Feed/>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-4 min-h-0">
          <NewsPosts />
          <Trending />
        </aside>
      </div>
    </div>
  );
};
