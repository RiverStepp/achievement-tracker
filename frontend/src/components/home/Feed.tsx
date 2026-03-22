import { useEffect, useMemo, useRef, useState } from "react";

import type { UserProfile } from "@/types/profile";
import { Post } from "@/components/social/post";
import { mockHomeFeedPosts } from "@/data/mockPosts";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

type FeedProps = {
  variant?: "home" | "profile";
  userProfile?: UserProfile;
};

const FEED_REFRESH_INTERVAL_MS = 30_000;
const FEED_REFRESH_SPINNER_MS = 900;
const INITIAL_POST_COUNT = 60;
const LOAD_MORE_POST_COUNT = 30;
const TOP_SCROLL_THRESHOLD_PX = 8;

export const Feed = ({ variant, userProfile }: FeedProps) => {
  const resolvedVariant = variant ?? (userProfile ? "profile" : "home");
  const isProfileFeed = resolvedVariant === "profile" && !!userProfile;
  const isHomeFeed = resolvedVariant === "home";
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [visibleCount, setVisibleCount] = useState(INITIAL_POST_COUNT);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isAtTopRef = useRef(true);
  const profileFeedItems = userProfile?.feed?.items ?? [];
  const allFeedItems = useMemo(() => {
    const items = isProfileFeed ? profileFeedItems : mockHomeFeedPosts;
    return [...items].sort(
      (left, right) =>
        new Date(right.metadata.createdAt).getTime() -
        new Date(left.metadata.createdAt).getTime()
    );
  }, [isProfileFeed, profileFeedItems]);
  const visibleFeedItems = useMemo(
    () => allFeedItems.slice(0, visibleCount),
    [allFeedItems, visibleCount]
  );
  const hasMorePosts = allFeedItems.length > visibleFeedItems.length;

  const title = isProfileFeed ? `${userProfile.displayName}'s Feed` : "Feed";
  const subtitle = isProfileFeed
    ? `Posts from @${userProfile.handle}`
    : "Latest posts from the community";

  useEffect(() => {
    isAtTopRef.current = isAtTop;
  }, [isAtTop]);

  useEffect(() => {
    let spinnerTimeoutId: number | undefined;

    const runRefreshCycle = () => {
      if (!isAtTopRef.current) {
        return;
      }

      setIsRefreshing(true);
      setVisibleCount(INITIAL_POST_COUNT);

      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }

      if (spinnerTimeoutId) {
        window.clearTimeout(spinnerTimeoutId);
      }

      spinnerTimeoutId = window.setTimeout(() => {
        setIsRefreshing(false);
      }, FEED_REFRESH_SPINNER_MS);
    };

    runRefreshCycle();

    const intervalId = window.setInterval(runRefreshCycle, FEED_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      if (spinnerTimeoutId) {
        window.clearTimeout(spinnerTimeoutId);
      }
    };
  }, []);

  useEffect(() => {
    setVisibleCount(INITIAL_POST_COUNT);
  }, [resolvedVariant, userProfile?.handle]);

  useEffect(() => {
    if (visibleCount > allFeedItems.length) {
      setVisibleCount(allFeedItems.length || INITIAL_POST_COUNT);
    }
  }, [allFeedItems.length, visibleCount]);

  const handleShowMore = () => {
    setVisibleCount((currentCount) =>
      Math.min(currentCount + LOAD_MORE_POST_COUNT, allFeedItems.length)
    );
  };

  const handleFeedScroll = () => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      return;
    }

    setIsAtTop(scrollContainer.scrollTop <= TOP_SCROLL_THRESHOLD_PX);
  };

  return (
    <section
      className={`bg-app-panel rounded-lg p-4 shadow-md shadow-app-border ${
        isHomeFeed ? "flex h-full min-h-0 flex-col" : ""
      }`}
    >
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-app-muted">{subtitle}</p>
      </div>

      <div
        ref={isHomeFeed ? scrollContainerRef : undefined}
        onScroll={isHomeFeed ? handleFeedScroll : undefined}
        className={`mt-4 border-t border-app-border pt-4 ${
          isHomeFeed ? "min-h-0 flex-1 overflow-y-auto app-scrollbar pr-1" : ""
        }`}
      >
        <div className="mb-4 flex h-4 items-center justify-center">
          {isRefreshing ? <Spinner className="h-5 w-5" /> : null}
        </div>

        {visibleFeedItems.length === 0 ? (
          <p className="text-sm text-app-muted">
            This user has not posted anything yet.
          </p>
        ) : (
          <div className="space-y-4">
            {visibleFeedItems.map((item) => (
              <Post key={item.postID} post={item} />
            ))}

            {hasMorePosts ? (
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={handleShowMore}>
                  Show more
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
};
