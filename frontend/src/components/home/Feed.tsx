import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/auth/AuthProvider";
import { Post } from "@/components/social/post";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/use-toast";
import { feedService, type SocialAuthorOverrides } from "@/services/feed";
import type { UserProfile } from "@/types/profile";
import type { Post as PostModel } from "@/types/post";

type FeedProps = {
  variant?: "home" | "profile";
  userProfile?: UserProfile;
  refreshKey?: number;
};

const FEED_REFRESH_INTERVAL_MS = 30_000;
const FEED_REFRESH_SPINNER_MS = 900;
const TOP_SCROLL_THRESHOLD_PX = 8;
const HOME_FEED_PAGE_SIZE = 20;
const PROFILE_FEED_PAGE_SIZE = 20;

export const Feed = ({ variant, userProfile, refreshKey = 0 }: FeedProps) => {
  const { userProfile: currentUserProfile } = useAuth();
  const resolvedVariant = variant ?? (userProfile ? "profile" : "home");
  const isProfileFeed = resolvedVariant === "profile" && !!userProfile;
  const isHomeFeed = resolvedVariant === "home";
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [remoteFeedItems, setRemoteFeedItems] = useState<PostModel[]>([]);
  const [remoteHasMore, setRemoteHasMore] = useState(false);
  const [remoteNextPageToken, setRemoteNextPageToken] = useState<string | null>(null);
  const [hasLoadedRemoteFeed, setHasLoadedRemoteFeed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isAtTopRef = useRef(true);

  const authorOverrides = useMemo<SocialAuthorOverrides>(() => {
    const overrides: SocialAuthorOverrides = {};

    if (currentUserProfile?.user.publicId) {
      overrides[currentUserProfile.user.publicId] = {
        avatarUrl: currentUserProfile.avatarUrl,
        displayName: currentUserProfile.displayName,
        handle: currentUserProfile.handle,
      };
    }

    if (userProfile?.user.publicId) {
      overrides[userProfile.user.publicId] = {
        avatarUrl: userProfile.avatarUrl,
        displayName: userProfile.displayName,
        handle: userProfile.handle,
      };
    }

    return overrides;
  }, [currentUserProfile, userProfile]);

  const fallbackItems = useMemo(
    () => (isProfileFeed ? userProfile?.feed?.items ?? [] : []),
    [isProfileFeed, userProfile?.feed?.items]
  );
  const allFeedItems = hasLoadedRemoteFeed ? remoteFeedItems : fallbackItems;

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
    let cancelled = false;

    const loadFeed = async () => {
      setIsLoadingInitial(true);

      try {
        if (isProfileFeed && userProfile?.user.publicId) {
          console.log("[feed] loading profile feed", {
            authorPublicId: userProfile.user.publicId,
            handle: userProfile.handle,
            refreshKey,
          });

          const page = await feedService.getFeedByUser(
            userProfile.user.publicId,
            { pageSize: PROFILE_FEED_PAGE_SIZE },
            authorOverrides
          );

          if (cancelled) {
            return;
          }

          setRemoteFeedItems(page.items);
          setRemoteHasMore(page.hasMore);
          setRemoteNextPageToken(page.nextPageToken);
          setHasLoadedRemoteFeed(true);

          console.log("[feed] profile feed loaded", {
            authorPublicId: userProfile.user.publicId,
            itemCount: page.items.length,
            hasMore: page.hasMore,
          });
          return;
        }

        if (isHomeFeed) {
          console.log("[feed] loading home feed", { refreshKey });

          const page = await feedService.getFeed(
            { pageSize: HOME_FEED_PAGE_SIZE },
            authorOverrides
          );

          if (cancelled) {
            return;
          }

          setRemoteFeedItems(page.items);
          setRemoteHasMore(page.hasMore);
          setRemoteNextPageToken(page.nextPageToken);
          setHasLoadedRemoteFeed(true);

          const scrollContainer = scrollContainerRef.current;
          if (scrollContainer) {
            scrollContainer.scrollTop = 0;
          }

          console.log("[feed] home feed loaded", {
            itemCount: page.items.length,
            hasMore: page.hasMore,
          });
          return;
        }

        if (!cancelled) {
          setHasLoadedRemoteFeed(true);
          setRemoteFeedItems(fallbackItems);
          setRemoteHasMore(false);
          setRemoteNextPageToken(null);
        }
      } catch (error: any) {
        if (cancelled) {
          return;
        }

        console.log("[feed] feed load failed", {
          variant: resolvedVariant,
          error,
        });
        setHasLoadedRemoteFeed(true);
        setRemoteFeedItems(fallbackItems);
        setRemoteHasMore(false);
        setRemoteNextPageToken(null);
        toast({
          title: "Could not load feed",
          description:
            error?.response?.data?.error ||
            error?.message ||
            "The feed could not be loaded.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) {
          setIsLoadingInitial(false);
        }
      }
    };

    void loadFeed();

    return () => {
      cancelled = true;
    };
  }, [
    authorOverrides,
    fallbackItems,
    isHomeFeed,
    isProfileFeed,
    refreshKey,
    resolvedVariant,
    userProfile,
  ]);

  const handleShowMore = async () => {
    if (!remoteHasMore || !remoteNextPageToken || isLoadingMore) {
      return;
    }

    console.log("[feed] loading next page", {
      variant: resolvedVariant,
      nextPageToken: remoteNextPageToken,
    });

    setIsLoadingMore(true);

    try {
      const page =
        isProfileFeed && userProfile?.user.publicId
          ? await feedService.getFeedByUser(
              userProfile.user.publicId,
              {
                pageSize: PROFILE_FEED_PAGE_SIZE,
                pageToken: remoteNextPageToken,
              },
              authorOverrides
            )
          : await feedService.getFeed(
              {
                pageSize: HOME_FEED_PAGE_SIZE,
                pageToken: remoteNextPageToken,
              },
              authorOverrides
            );

      setRemoteFeedItems((current) => [...current, ...page.items]);
      setRemoteHasMore(page.hasMore);
      setRemoteNextPageToken(page.nextPageToken);

      console.log("[feed] next page loaded", {
        variant: resolvedVariant,
        itemCount: page.items.length,
        hasMore: page.hasMore,
      });
    } catch (error: any) {
      console.log("[feed] failed to load next page", {
        variant: resolvedVariant,
        error,
      });
      toast({
        title: "Could not load more posts",
        description:
          error?.response?.data?.error ||
          error?.message ||
          "The next feed page could not be loaded.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
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

        {isLoadingInitial ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6" />
          </div>
        ) : allFeedItems.length === 0 ? (
          <p className="text-sm text-app-muted">
            {isHomeFeed
              ? "The community feed is empty right now."
              : "This user has not posted anything yet."}
          </p>
        ) : (
          <div className="space-y-4">
            {allFeedItems.map((item) => (
              <Post key={item.publicId ?? item.postID} post={item} />
            ))}

            {remoteHasMore ? (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => void handleShowMore()}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Loading..." : "Show more"}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
};
