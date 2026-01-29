// mock/profile.mock.ts
import type { UserProfile } from "@/types/profile";
import type { User } from "@/types/models";

export const mockAuthUserBrandonW: User = {
  id: 1,
  steamId: "76561198000000000",
  handle: "brandonw",
  username: "BrandonW",
  profileUrl: "https://steamcommunity.com/id/brandonw",
  avatarUrl:
    "https://images.unsplash.com/photo-1520975682031-a5d4a1cfcf0a?auto=format&fit=crop&w=256&q=60",
  createdAt: "2026-01-12T18:20:00.000Z",
};
export const mockProfile: UserProfile = {
  user: mockAuthUserBrandonW,
  identity: {
    displayName: "BrandonW",
    handle: "brandonw",
    avatarUrl: "https://images.unsplash.com/photo-1520975682031-a5d4a1cfcf0a?auto=format&fit=crop&w=256&q=60",
    bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=60",

    bio: "Achievement hunter with a soft spot for city builders and grindy RPGs. I pin the ones that actually took effort — not the tutorial freebies.",
    location: "Ohio, USA",
    timezone: "America/New_York",
    pronouns: "he/him",

    joinedAt: "2026-01-12T18:20:00.000Z",
  },

  connections: {
    platforms: ["steam", "pc"],
    linkedAccounts: [
      {
        platform: "steam",
        usernameOrId: "76561198000000000",
        profileUrl: "https://steamcommunity.com/id/brandonw",
        accountVerified: true,
      },
      {
        platform: "pc",
        usernameOrId: "brandonw",
        profileUrl: "https://openachievements.app/u/brandonw",
        accountVerified: true,
      },
    ],
    socials: [
      { kind: "discord", url: "https://discord.com/users/123456789012345678" },
      { kind: "github", url: "https://github.com/brandonw" },
      { kind: "website", url: "https://brandonwendell.dev" },
      { kind: "twitch", url: "https://twitch.tv/brandonw" },
    ],
  },

  showcase: {
    pinnedGenreTags: ["RPG", "Roguelike", "City Builder", "Soulslike"],
    pinnedAchievements: [
      {
        id: 91001,
        unlockedAt: "2026-01-20T03:11:00.000Z",
        achievement: {
          id: 91001,
          name: "No-Hit Boss Rush",
          description: "Complete the boss rush without taking damage.",
          iconUrl: "https://example.com/icons/nohit.png",
        } as any,
        game: {
          id: 501,
          name: "Hollow Knight",
          steamAppId: 367520,
          headerImageUrl: "https://example.com/games/hk/header.jpg",
        },
        globalPercentage: 0.3,
        pinnedAt: "2026-01-20T04:00:00.000Z",
      },
      {
        id: 91002,
        unlockedAt: "2026-01-18T22:45:00.000Z",
        achievement: {
          id: 91002,
          name: "100% Completion",
          description: "Unlock all achievements in the game.",
          iconUrl: "https://example.com/icons/complete.png",
        } as any,
        game: {
          id: 777,
          name: "Elden Ring",
          steamAppId: 1245620,
          headerImageUrl: "https://example.com/games/elden/header.jpg",
        },
        globalPercentage: 6.2,
        pinnedAt: "2026-01-19T01:10:00.000Z",
      },
      {
        id: 91003,
        unlockedAt: "2026-01-14T01:02:00.000Z",
        achievement: {
          id: 91003,
          name: "Nightmare Clear",
          description: "Beat the game on the hardest difficulty.",
          iconUrl: "https://example.com/icons/nightmare.png",
        } as any,
        game: {
          id: 222,
          name: "Hades",
          steamAppId: 1145360,
          headerImageUrl: "https://example.com/games/hades/header.jpg",
        },
        globalPercentage: 1.1,
        pinnedAt: "2026-01-14T02:00:00.000Z",
      },
    ],
  },

  summary: {
    totalAchievements: 3482,
    gamesTracked: 164,
    hoursPlayed: 1920,
  },

  recentAchievements: [
    {
      id: "ra_001",
      ts: "2026-01-26T23:10:00.000Z",
      achievement: {
        id: 92001,
        unlockedAt: "2026-01-26T23:10:00.000Z",
        achievement: {
          id: 92001,
          name: "Master Cartographer",
          description: "Reveal the entire map.",
          iconUrl: "https://example.com/icons/map.png",
        } as any,
        game: {
          id: 501,
          name: "Hollow Knight",
          steamAppId: 367520,
          headerImageUrl: "https://example.com/games/hk/header.jpg",
        },
        globalPercentage: 4.7,
      },
    },
    {
      id: "ra_002",
      ts: "2026-01-24T18:05:00.000Z",
      achievement: {
        id: 92002,
        unlockedAt: "2026-01-24T18:05:00.000Z",
        achievement: {
          id: 92002,
          name: "Perfect Parry",
          description: "Parry 50 attacks without missing.",
          iconUrl: "https://example.com/icons/parry.png",
        } as any,
        game: {
          id: 777,
          name: "Elden Ring",
          steamAppId: 1245620,
          headerImageUrl: "https://example.com/games/elden/header.jpg",
        },
        globalPercentage: 2.2,
      },
    },
    {
      id: "ra_003",
      ts: "2026-01-21T02:40:00.000Z",
      achievement: {
        id: 92003,
        unlockedAt: "2026-01-21T02:40:00.000Z",
        achievement: {
          id: 92003,
          name: "Collector’s Cache",
          description: "Collect 250 unique items.",
          iconUrl: "https://example.com/icons/cache.png",
        } as any,
        game: {
          id: 999,
          name: "Slay the Spire",
          steamAppId: 646570,
          headerImageUrl: "https://example.com/games/sts/header.jpg",
        },
        globalPercentage: 7.9,
      },
    },
  ],

  feed: {
    items: [
      {
        id: "post_001",
        createdAt: "2026-01-27T14:12:00.000Z",
        body: "Finally cleaned up a bunch of backlog achievements. That map grind was brutal.",
        attachedAchievement: {
          id: 92001,
          unlockedAt: "2026-01-26T23:10:00.000Z",
          achievement: {
            id: 92001,
            name: "Master Cartographer",
            description: "Reveal the entire map.",
            iconUrl: "https://example.com/icons/map.png",
          } as any,
          game: {
            id: 501,
            name: "Hollow Knight",
            steamAppId: 367520,
            headerImageUrl: "https://example.com/games/hk/header.jpg",
          },
          globalPercentage: 4.7,
        },
        likeCount: 12,
        replyCount: 3,
        viewerHasLiked: false,
      },
      {
        id: "post_002",
        createdAt: "2026-01-22T19:08:00.000Z",
        body: "Pinned a few achievements that actually felt earned. Not the ‘press start’ kind.",
        likeCount: 28,
        replyCount: 6,
        viewerHasLiked: true,
      },
      {
        id: "post_003",
        createdAt: "2026-01-18T02:31:00.000Z",
        body: "City builders are still my comfort zone. Achievement runs make them way more fun.",
        likeCount: 8,
        replyCount: 1,
        viewerHasLiked: false,
      },
    ],
    nextCursor: "cursor_002",
  },

  privacy: {
    showStats: true,
    showRecentAchievements: true,
    showLinkedAccounts: true,
    showSocialLinks: true,
    showFeed: true,
  },

  viewer: {
    isSelf: false,
    //friendStatus: "none",
    canMessage: false,
    canSendFriendRequest: true,
    canAcceptFriendRequest: false,
  },
};