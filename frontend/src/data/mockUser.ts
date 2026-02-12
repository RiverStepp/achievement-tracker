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
    "https://i.pinimg.com/736x/3b/9d/50/3b9d50a32ed833d9cdc73978e98c8fc2.jpg",
  createdAt: "2026-01-12T18:20:00.000Z",
};

export const mockProfile: UserProfile = {
  user: mockAuthUserBrandonW,
  identity: {
    displayName: "BrandonW",
    handle: "brandonw",
    avatarUrl:
      "https://images.unsplash.com/photo-1520975682031-a5d4a1cfcf0a?auto=format&fit=crop&w=256&q=60",
    bannerUrl:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=60",
    bio: "Achievement hunter with a soft spot for city builders and grindy RPGs. I pin the ones that actually took effort, not the tutorial freebies.",
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
        usernameOrId: "BixMC",
        profileUrl: "https://steamcommunity.com/id/bixmc",
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
  summary: {
    totalAchievements: 3482,
    gamesTracked: 164,
    hoursPlayed: 1920,
  },
  achievements: [
    {
      id: 92001,
      unlockedAt: "2026-01-26T23:10:00.000Z",
      isPinned: true,
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
    {
      id: 92002,
      unlockedAt: "2026-01-24T18:05:00.000Z",
      isPinned: false,
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
    {
      id: 92003,
      unlockedAt: "2026-01-21T02:40:00.000Z",
      isPinned: true,
      achievement: {
        id: 92003,
        name: "Collector's Cache",
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
  ],
  feed: {
    items: [],
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
  },
};
