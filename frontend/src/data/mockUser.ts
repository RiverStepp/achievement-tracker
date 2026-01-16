import type { User } from "@/types/models";
import type { UserProfile, ProfileAchievement } from "@/types/profile";

export const DEV_MOCK_USER: User = {
  id: 1,
  steamId: "76561198004182947",
  handle: "SakaKishiyami",
  username: "SakaKishiyami",
  profileUrl: "https://steamcommunity.com/id/SakaKishiyami",
  avatarUrl: "/assets/avatars/saka-kishiyami.png",
  createdAt: "2026-01-13T00:00:00.000Z",
};

const mockLatestAchievements: ProfileAchievement[] = [
  {
    id: 1,
    unlockedAt: "2025-10-15T00:00:00.000Z",
    globalPercentage: 12.3,
    achievement: {
      id: 1,
      gameId: 101,
      steamApiname: "LADY_OF_THE_HOUSE",
      name: "Lady of the House",
      description: "Earned in Marvel Rivals",
      iconUrl: "/assets/achievements/marvel-rivals-lady-of-the-house.png",
      isHidden: false,
    },
    game: {
      id: 101,
      steamAppId: 123456,
      name: "Marvel Rivals",
      headerImageUrl: "/assets/games/marvel-rivals-header.jpg",
    },
  },
  // … add the Fruit Salad / Among Us examples the same way
];

export const mockUserProfile: UserProfile = {
  user: DEV_MOCK_USER,
  joinDate: DEV_MOCK_USER.createdAt ?? "2026-01-13T00:00:00.000Z",
  platforms: ["steam"],
  linkedAccounts: [
    {
      platform: "steam",
      usernameOrId: "SakaKishiyami",
      profileUrl: "https://steamcommunity.com/id/SakaKishiyami",
      accountVerified: true,
    },
  ],
  socials: [
    { kind: "discord", url: "https://discordapp.com/users/1234567890" },
    { kind: "x", url: "https://x.com/SakaKishiyami" },
  ],
  favoriteGenres: ["Action", "Co-op", "Rogue-lite"],
  favoriteGames: ["Marvel Rivals", "Fruit Salad", "Among Us"],

  summary: {
    totalAchievements: 217,
    hoursPlayed: 0,
    gamesOwned: 13,
  },

  pins: [
    {
      title: "Marvel Rivals",
      statLabel: "Latest Achievement",
      value: "Lady of the House",
      achievementIconUrl:
        "/assets/achievements/marvel-rivals-lady-of-the-house.png",
    },
  ],

  latestAchievements: mockLatestAchievements,

  activity: [
    {
      id: "act-1",
      ts: "2025-10-15T00:00:00.000Z",
      kind: "achievement",
      title: "Lady of the House",
      subtitle: "Marvel Rivals",
      icon: "trophy",
    },
    // etc…
  ],

  privacy: {
    showStats: true,
    showActivity: true,
    showLinkedAccounts: true,
  },
};
