// mock/profile.mock.ts
import type { UserProfile } from "@/types/profile";
import type { AppUser } from "@/types/models";
import type { SteamUser } from "@/types/auth";

export const mockAppUserBrandonW: AppUser = {
  id: 1,
  publicId: "f4c3a9df-9ae9-4c2e-9fcb-1d9d3ef5148a",
  roles: ["Admin"],
  isListedOnLeaderboards: true,
  lastLoginDate: "2026-01-26T23:10:00.000Z",
};

export const mockSteamUser: SteamUser = {
  steamId: "76561198000000000",
  personaName: "BrandonW",
  profileUrl: "https://steamcommunity.com/id/brandonw",
  avatarSmallUrl:
    "https://i.pinimg.com/736x/3b/9d/50/3b9d50a32ed833d9cdc73978e98c8fc2.jpg",
  avatarMediumUrl:
    "https://i.pinimg.com/736x/3b/9d/50/3b9d50a32ed833d9cdc73978e98c8fc2.jpg",
  avatarFullUrl:
    "https://i.pinimg.com/736x/3b/9d/50/3b9d50a32ed833d9cdc73978e98c8fc2.jpg",
};

export const mockUserProfile: UserProfile = {
  user: mockAppUserBrandonW,
  steam: mockSteamUser,
  displayName: "BrandonW",
  handle: "brandonw",
  avatarUrl:
    "https://miro.medium.com/1*YqfVlyCe06DfcPsR3kpYrw.jpeg",
  bannerUrl:
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=60",
  bio: "Achievement hunter with a soft spot for city builders and grindy RPGs. I pin the ones that actually took effort, not the tutorial freebies.",
  location: "Ohio, USA",
  timezone: "America/New_York",
  pronouns: "he/him",
  joinedAt: "2026-01-12T18:20:00.000Z",
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
        gameId: 501,
        steamApiname: "THREE_BIT_GANGSTER",
        name: "Three-Bit Gangster",
        description: "GTA Online: Reach Rank 25",
        iconUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8_6-j3l4flImDP-nYEaU6N-oDp6ZC3HFIqA&s",
        globalPercentage: 4.7,
      },
      game: {
        id: 501,
        name: "GTA V",
        steamAppId: 367520,
        headerImageUrl: "https://example.com/games/hk/header.jpg",
      },
      
    },
    {
      id: 92002,
      unlockedAt: "2026-01-24T18:05:00.000Z",
      isPinned: true,
      achievement: {
        id: 92002,
        gameId: 777,
        steamApiname: "PERFECT_PARRY",
        name: "Perfect Parry",
        description: "Parry 50 attacks without missing.",
        iconUrl: "https://shared.fastly.steamstatic.com/community_assets/images/apps/1557740/849c37eda4098dcb577aaf2b47617d3bc4b0fb2b.jpg",
        globalPercentage: 2.2,
      },
      game: {
        id: 777,
        name: "Elden Ring",
        steamAppId: 1245620,
        headerImageUrl: "https://static.wikia.nocookie.net/subnautica/images/d/db/Dressed_For_The_Weather_Achievement.png/revision/latest?cb=20210806191910",
      },
    },
    {
      id: 92003,
      unlockedAt: "2026-01-21T02:40:00.000Z",
      isPinned: true,
      achievement: {
        id: 92003,
        gameId: 999,
        steamApiname: "COLLECTORS_CACHE",
        name: "Collector's Cache",
        description: "Collect 250 unique items.",
        iconUrl: "https://images.steamusercontent.com/ugc/825757737336151813/C3FA192E55550A832729D378DC7CDB09E8F289BD/?imw=512&imh=511&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true",
        globalPercentage: 7.9,
      },
      game: {
        id: 999,
        name: "Slay the Spire",
        steamAppId: 646570,
        headerImageUrl: "https://example.com/games/sts/header.jpg",
      },
      
    },
    {
      id: 92003,
      unlockedAt: "2026-01-21T02:40:00.000Z",
      isPinned: true,
      achievement: {
        id: 92003,
        gameId: 999,
        steamApiname: "COLLECTORS_CACHE",
        name: "Collector's Cache",
        description: "Collect 250 unique items.",
        iconUrl: "https://static.wikia.nocookie.net/subnautica/images/3/39/Out_of_Mind_Achievement.png/revision/latest?cb=20210807003633",
        globalPercentage: 7.9,
      },
      game: {
        id: 999,
        name: "Slay the Spire",
        steamAppId: 646570,
        headerImageUrl: "https://example.com/games/sts/header.jpg",
      },
      
    },
    {
      id: 92003,
      unlockedAt: "2026-01-21T02:40:00.000Z",
      isPinned: true,
      achievement: {
        id: 92003,
        gameId: 999,
        steamApiname: "COLLECTORS_CACHE",
        name: "Collector's Cache",
        description: "Collect 250 unique items.",
        iconUrl: "https://cdn2.steamgriddb.com/icon/dd055f53a45702fe05e449c30ac80df9/32/256x256.png",
        globalPercentage: 7.9,
      },
      game: {
        id: 999,
        name: "Slay the Spire",
        steamAppId: 646570,
        headerImageUrl: "https://example.com/games/sts/header.jpg",
      },
      
    },
    {
      id: 92003,
      unlockedAt: "2026-01-21T02:40:00.000Z",
      isPinned: true,
      achievement: {
        id: 92003,
        gameId: 999,
        steamApiname: "COLLECTORS_CACHE",
        name: "Collector's Cache",
        description: "Collect 250 unique items.",
        iconUrl: "https://example.com/icons/cache.png",
        globalPercentage: 7.9,
      },
      game: {
        id: 999,
        name: "Slay the Spire",
        steamAppId: 646570,
        headerImageUrl: "https://example.com/games/sts/header.jpg",
      },
      
    },
    {
      id: 92003,
      unlockedAt: "2026-01-21T02:40:00.000Z",
      isPinned: true,
      achievement: {
        id: 92003,
        gameId: 999,
        steamApiname: "COLLECTORS_CACHE",
        name: "Collector's Cache",
        description: "Collect 250 unique items.",
        iconUrl: "https://example.com/icons/cache.png",
        globalPercentage: 7.9,
      },
      game: {
        id: 999,
        name: "Slay the Spire",
        steamAppId: 646570,
        headerImageUrl: "https://example.com/games/sts/header.jpg",
      },
      
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
