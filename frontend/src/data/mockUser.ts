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
        globalPercentage: 44.7,
      },
      game: {
        id: 501,
        name: "GTA V",
        steamAppId: 367520,
        iconUrl: "https://cdn2.steamgriddb.com/icon/7bc92f6201181058e1bcc262894c3d26/32/256x256.png",
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
        iconUrl: "https://cdn2.steamgriddb.com/icon/dd055f53a45702fe05e449c30ac80df9/32/256x256.png",
        headerImageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg",
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
        iconUrl: "https://shared.cloudflare.steamstatic.com/steamcommunity/public/images/apps/646570/e7e4f9c4e271f5f95f4ff8e8f6beef1f6e1a1d8d.jpg",
        globalPercentage: 7.9,
      },
      game: {
        id: 999,
        name: "Slay the Spire",
        steamAppId: 646570,
        iconUrl: "https://cdn2.steamgriddb.com/icon/8d0f15a991f2336c3844a6cb34b16f22/32/256x256.png",
        headerImageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/646570/header.jpg",
      },
    },
    {
      id: 92004,
      unlockedAt: "2026-01-19T19:22:00.000Z",
      achievement: {
        id: 92004,
        gameId: 1101,
        steamApiname: "CITY_ON_THE_MOVE",
        name: "City on the Move",
        description: "Maintain positive public transport income for 12 months.",
        iconUrl: "https://shared.fastly.steamstatic.com/community_assets/images/apps/255710/d3b6bd3142aa2c711f9c236f9f0ddf07ff2cf7a1.jpg",
        globalPercentage: 14.1,
      },
      game: {
        id: 1101,
        name: "Cities: Skylines",
        steamAppId: 255710,
        iconUrl: "https://cdn2.steamgriddb.com/icon/4b90f0dbf3f0f9f95f4a0cb29f6d5f85/32/256x256.png",
        headerImageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/255710/header.jpg",
      },
    },
    {
      id: 92005,
      unlockedAt: "2026-01-16T12:40:00.000Z",
      achievement: {
        id: 92005,
        gameId: 1201,
        steamApiname: "BOSS_CELL_2",
        name: "Ascender",
        description: "Beat the game on 2 Boss Cells.",
        iconUrl: "https://shared.fastly.steamstatic.com/steamcommunity/public/images/apps/588650/91f5cd27f02933dff7f613f1f91d82a4f29f20b5.jpg",
        globalPercentage: 9.6,
      },
      game: {
        id: 1201,
        name: "Dead Cells",
        steamAppId: 588650,
        iconUrl: "https://cdn2.steamgriddb.com/icon/8ec6fef4f1c9f4a2c6c0f1dff98a7b35/32/256x256.png",
        headerImageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/588650/header.jpg",
      },
    },
    {
      id: 92006,
      unlockedAt: "2026-01-14T05:11:00.000Z",
      achievement: {
        id: 92006,
        gameId: 1301,
        steamApiname: "MOONLANDING",
        name: "One Small Step",
        description: "Land on the Mun.",
        iconUrl: "https://shared.cloudflare.steamstatic.com/steamcommunity/public/images/apps/220200/12033cf7d36db6f8fba2f4b1f6a9003efa7f8be6.jpg",
        globalPercentage: 26.3,
      },
      game: {
        id: 1301,
        name: "Kerbal Space Program",
        steamAppId: 220200,
        iconUrl: "https://cdn2.steamgriddb.com/icon/c7ad0b7ec4f5ac2f6e4b19222b5f2a88/32/256x256.png",
        headerImageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/220200/header.jpg",
      },
    },
    {
      id: 92007,
      unlockedAt: "2026-01-12T17:08:00.000Z",
      achievement: {
        id: 92007,
        gameId: 1401,
        steamApiname: "NO_DAMAGE_RUN",
        name: "Untouchable",
        description: "Defeat a boss without taking damage.",
        iconUrl: "https://shared.fastly.steamstatic.com/community_assets/images/apps/367520/486d55c6aa2c3d8f17d2fe9f116ca8f3c7f47af3.jpg",
        globalPercentage: 5.8,
      },
      game: {
        id: 1401,
        name: "Hollow Knight",
        steamAppId: 367520,
        iconUrl: "https://cdn2.steamgriddb.com/icon/7bc92f6201181058e1bcc262894c3d26/32/256x256.png",
        headerImageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/367520/header.jpg",
      },
    },
    {
      id: 92008,
      unlockedAt: "2026-01-10T10:45:00.000Z",
      achievement: {
        id: 92008,
        gameId: 1501,
        steamApiname: "PATHFINDER",
        name: "Pathfinder",
        description: "Discover all landmarks in one region.",
        iconUrl: "https://shared.fastly.steamstatic.com/community_assets/images/apps/1174180/41329589f8f9cbe2f69b7f7c2b56a74f2b7cb3d4.jpg",
        globalPercentage: 19.4,
      },
      game: {
        id: 1501,
        name: "Red Dead Redemption 2",
        steamAppId: 1174180,
        iconUrl: "https://cdn2.steamgriddb.com/icon/5db79864d99a183f8b3dfab59f82bc8d/32/256x256.png",
        headerImageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg",
      },
    },
    {
      id: 92009,
      unlockedAt: "2026-01-08T09:20:00.000Z",
      achievement: {
        id: 92009,
        gameId: 1601,
        steamApiname: "THE_CLOCKWORK",
        name: "Clockwork Precision",
        description: "Complete a mission with 100% stealth.",
        iconUrl: "https://shared.fastly.steamstatic.com/community_assets/images/apps/412020/7f69e725f9b09bcf476d5f4f89b95f6da46cbe38.jpg",
        globalPercentage: 11.7,
      },
      game: {
        id: 1601,
        name: "Metro Exodus",
        steamAppId: 412020,
        iconUrl: "https://cdn2.steamgriddb.com/icon/6f2f0d4d7c2fe59f0d12353f2b5dcb2f/32/256x256.png",
        headerImageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/412020/header.jpg",
      },
    },
    {
      id: 92010,
      unlockedAt: "2026-01-06T20:13:00.000Z",
      achievement: {
        id: 92010,
        gameId: 1701,
        steamApiname: "BLUEPRINT_MASTER",
        name: "Blueprint Master",
        description: "Craft 100 unique recipes.",
        iconUrl: "https://shared.fastly.steamstatic.com/community_assets/images/apps/105600/f3dc89f1edba9f1df5ed3b4794bd2074fa3437ea.jpg",
        globalPercentage: 8.2,
      },
      game: {
        id: 1701,
        name: "Terraria",
        steamAppId: 105600,
        iconUrl: "https://cdn2.steamgriddb.com/icon/f718499c1c8cef6734fd6f7235b1677f/32/256x256.png",
        headerImageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/105600/header.jpg",
      },
    },
    {
      id: 92011,
      unlockedAt: "2026-01-05T14:02:00.000Z",
      achievement: {
        id: 92011,
        gameId: 1801,
        steamApiname: "MASTER_ANGLER",
        name: "Master Angler",
        description: "Catch 50 rare fish.",
        iconUrl: "https://shared.fastly.steamstatic.com/community_assets/images/apps/271590/6d8f25b5965f7a5d2c8a370be2e17c4e24fb7f78.jpg",
        globalPercentage: 6.4,
      },
      game: {
        id: 1801,
        name: "Stardew Valley",
        steamAppId: 413150,
        iconUrl: "https://cdn2.steamgriddb.com/icon/55ec4d0f81ea89f2a9ce0eec2206f432/32/256x256.png",
        headerImageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg",
      },
    },
    {
      id: 92012,
      unlockedAt: "2026-01-04T07:35:00.000Z",
      achievement: {
        id: 92012,
        gameId: 1901,
        steamApiname: "BULLETHELL_SURVIVOR",
        name: "Bullet Hell Survivor",
        description: "Finish Chapter 3 without dying.",
        iconUrl: "https://shared.fastly.steamstatic.com/community_assets/images/apps/1145360/2b6d4f7db9c1f4de2deac8e0d375008651675835.jpg",
        globalPercentage: 4.1,
      },
      game: {
        id: 1901,
        name: "Hades",
        steamAppId: 1145360,
        iconUrl: "https://cdn2.steamgriddb.com/icon/0f9fe9046a1c4eb3de2f91f95d930c6e/32/256x256.png",
        headerImageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg",
      },
    },
    {
      id: 92013,
      unlockedAt: "2026-01-03T03:12:00.000Z",
      achievement: {
        id: 92013,
        gameId: 2001,
        steamApiname: "DEEP_DIVER",
        name: "Deep Diver",
        description: "Reach biome depth level 8.",
        iconUrl: "https://shared.fastly.steamstatic.com/community_assets/images/apps/264710/9763be016d69c7cf5f68daef8223790fb70d0e8b.jpg",
        globalPercentage: 17.3,
      },
      game: {
        id: 2001,
        name: "Subnautica",
        steamAppId: 264710,
        iconUrl: "https://cdn2.steamgriddb.com/icon/f97c5d29941f9bf2a7272e12f4b338d4/32/256x256.png",
        headerImageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/264710/header.jpg",
      },
    },
    {
      id: 92014,
      unlockedAt: "2026-01-02T22:41:00.000Z",
      achievement: {
        id: 92014,
        gameId: 2101,
        steamApiname: "DOMINION",
        name: "Dominion",
        description: "Capture 20 territories in one match.",
        iconUrl: "https://shared.fastly.steamstatic.com/community_assets/images/apps/570/8f9f13bf6ca8e8a7d0c81dcbf58c7fd2c2d6d123.jpg",
        globalPercentage: 12.8,
      },
      game: {
        id: 2101,
        name: "Dota 2",
        steamAppId: 570,
        iconUrl: "https://cdn2.steamgriddb.com/icon/31fc2cc95f4ab4d0f77a228f43bd81c1/32/256x256.png",
        headerImageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg",
      },
    },
    {
      id: 92015,
      unlockedAt: "2026-01-01T15:18:00.000Z",
      achievement: {
        id: 92015,
        gameId: 2201,
        steamApiname: "ECO_WARRIOR",
        name: "Eco Warrior",
        description: "Power your base with only renewable energy for 24h.",
        iconUrl: "https://shared.fastly.steamstatic.com/community_assets/images/apps/238960/7f8f1d58e87a2c3bb32d2f5742d16bbf5a95e56d.jpg",
        globalPercentage: 22.1,
      },
      game: {
        id: 2201,
        name: "Path of Exile",
        steamAppId: 238960,
        iconUrl: "https://cdn2.steamgriddb.com/icon/8bbf305a24f5a68fcbef6a4c16b0f3fa/32/256x256.png",
        headerImageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/238960/header.jpg",
      },
    },
    {
      id: 92016,
      unlockedAt: "2025-12-30T11:00:00.000Z",
      achievement: {
        id: 92016,
        gameId: 2301,
        steamApiname: "WORKSHOP_MASTER",
        name: "Workshop Master",
        description: "Craft every advanced tool tier.",
        iconUrl: "https://shared.fastly.steamstatic.com/community_assets/images/apps/275850/f8f3d88a87e32f5a9a4bf0cf42b1b4bb4d8a3e3b.jpg",
        globalPercentage: 13.5,
      },
      game: {
        id: 2301,
        name: "No Man's Sky",
        steamAppId: 275850,
        iconUrl: "https://cdn2.steamgriddb.com/icon/8e2082ce3f43e66c5cc0f26f3b79c563/32/256x256.png",
        headerImageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/275850/header.jpg",
      },
    },
    {
      id: 92017,
      unlockedAt: "2025-12-28T08:27:00.000Z",
      achievement: {
        id: 92017,
        gameId: 2401,
        steamApiname: "GRANDMASTER",
        name: "Grandmaster",
        description: "Complete all challenge arenas.",
        iconUrl: "https://shared.fastly.steamstatic.com/community_assets/images/apps/292030/4d4850b0da4c5a8a913f5b96bcf2a42928de0b44.jpg",
        globalPercentage: 3.9,
      },
      game: {
        id: 2401,
        name: "The Witcher 3: Wild Hunt",
        steamAppId: 292030,
        iconUrl: "https://cdn2.steamgriddb.com/icon/4c8f8b0aaf7b92936256e5b0f5d59e68/32/256x256.png",
        headerImageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg",
      },
    },
  ],
  feed: {
    items: [
      {
        postID: 301,
        author: {
          userID: 1,
          displayName: "BrandonW",
          handle: "brandonw",
          avatarUrl:
            "https://miro.medium.com/1*YqfVlyCe06DfcPsR3kpYrw.jpeg",
        },
        content: {
          text: "Finally finished my no-hit boss run tonight. Hands were shaking.",
        },
        metadata: {
          createdAt: "2026-01-27T00:15:00.000Z",
          updatedAt: null,
        },
        likes: {
          count: 18,
          users: [],
          userHasLiked: false,
        },
      },
      {
        postID: 302,
        author: {
          userID: 1,
          displayName: "BrandonW",
          handle: "brandonw",
          avatarUrl:
            "https://miro.medium.com/1*YqfVlyCe06DfcPsR3kpYrw.jpeg",
        },
        content: {
          text: "Cities: Skylines traffic is finally under control. Roundabouts are king.",
        },
        metadata: {
          createdAt: "2026-01-20T19:42:00.000Z",
          updatedAt: null,
        },
        likes: {
          count: 7,
          users: [],
          userHasLiked: false,
        },
      },
      {
        postID: 303,
        author: {
          userID: 1,
          displayName: "BrandonW",
          handle: "brandonw",
          avatarUrl:
            "https://miro.medium.com/1*YqfVlyCe06DfcPsR3kpYrw.jpeg",
        },
        content: {
          text: "New backlog rule: no buying games until I clear at least 20 achievements this month.",
        },
        metadata: {
          createdAt: "2026-01-11T13:10:00.000Z",
          updatedAt: null,
        },
        likes: {
          count: 11,
          users: [],
          userHasLiked: false,
        },
      },
    ],
    comments: [
      {
        commentID: 401,
        author: {
          userID: 1,
          displayName: "BrandonW",
          handle: "brandonw",
          avatarUrl:
            "https://miro.medium.com/1*YqfVlyCe06DfcPsR3kpYrw.jpeg",
        },
        content: {
          text: "That parry timing window is tiny, but it feels great once it clicks.",
        },
        createdAt: {
          createdAt: "2026-01-25T08:30:00.000Z",
          updatedAt: null,
        },
      },
      {
        commentID: 402,
        author: {
          userID: 1,
          displayName: "BrandonW",
          handle: "brandonw",
          avatarUrl:
            "https://miro.medium.com/1*YqfVlyCe06DfcPsR3kpYrw.jpeg",
        },
        content: {
          text: "Collector's Cache took forever, but I finally got it done.",
        },
        createdAt: {
          createdAt: "2026-01-22T03:10:00.000Z",
          updatedAt: null,
        },
      },
      {
        commentID: 403,
        author: {
          userID: 1,
          displayName: "BrandonW",
          handle: "brandonw",
          avatarUrl:
            "https://miro.medium.com/1*YqfVlyCe06DfcPsR3kpYrw.jpeg",
        },
        content: {
          text: "If you're going for rare achievements, keep backups and plan route order first.",
        },
        createdAt: {
          createdAt: "2026-01-09T16:50:00.000Z",
          updatedAt: null,
        },
      },
    ],
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

