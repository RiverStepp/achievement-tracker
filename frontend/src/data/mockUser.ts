import { UserProfile } from '@/types/user';

export const mockUsers: Record<string, UserProfile> = {
  kaio: {
    id: 'user-001',
    handle: 'kaio',
    avatarUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=facearea&w=256&h=256&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=80',
    bio: 'Speedrunning roguelikes, cataloguing every ridiculous achievement, and helping folks min-max their collections.',
    location: 'Porto Alegre, Brazil',
    joinDate: '2017-08-12T00:00:00.000Z',
    platforms: ['steam', 'pc'],
    linkedAccounts: [
      {
        platform: 'steam',
        usernameOrId: 'KaioPrime',
        profileUrl: 'https://steamcommunity.com/id/kaioprime',
        accountVerified: true
      },
      {
        platform: 'xbox',
        usernameOrId: 'KaioPrimeXBL',
        profileUrl: 'https://account.xbox.com/en-us/profile?gamertag=KaioPrimeXBL',
        accountVerified: false
      }
    ],
    socials: [
      { kind: 'discord', url: 'https://discord.com/users/247000111223' },
      { kind: 'x', url: 'https://x.com/kaio_plays' },
      { kind: 'twitch', url: 'https://twitch.tv/kaio' },
      { kind: 'github', url: 'https://github.com/kaio-dev' },
      { kind: 'website', url: 'https://kaio.gg' }
    ],
    favoriteGenres: ['Roguelike', 'Metroidvania', 'Soulslike', 'Deckbuilder'],
    favoriteGames: [
      'Hades',
      'Dead Cells',
      'Slay the Spire',
      'Hollow Knight',
      'Returnal',
      "Baldur's Gate 3"
    ],
    totalAchievements: 1786,
    hoursPlayed: 3125,
    gamesOwned: 487,
    pins: [
      {
        title: 'Hades',
        statLabel: 'Heat 32 Clear',
        value: 'Zagreus // Twin Fists',
        achievementIconUrl: 'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/1145360/7cdd6cc8c7495a476e4e3ed59b1ce64875b4ac46.jpg'
      },
      {
        title: 'Returnal',
        statLabel: 'No-Death Biome Rush',
        value: '58m 12s'
      },
      {
        title: 'Deep Rock Galactic',
        statLabel: 'Elite Deep Dive',
        value: 'Hazard 5 Solo'
      },
      {
        title: 'Vampire Survivors',
        statLabel: 'Gold Hoard',
        value: '985,410'
      },
      {
        title: 'Slay the Spire',
        statLabel: 'Ascension 20 Silent',
        value: 'Perfected Form'
      },
      {
        title: 'Hollow Knight',
        statLabel: 'Pantheon of Hallownest',
        value: 'Nail Only'
      },
      {
        title: 'Armored Core VI',
        statLabel: 'S-Rank Missions',
        value: '42 / 42'
      }
    ],
    activity: [
      {
        id: 'act-001',
        ts: '2024-06-02T18:42:00.000Z',
        kind: 'achievement',
        title: 'Unlocked "Edge of Oblivion"',
        subtitle: 'Returnal',
        icon: 'sparkles'
      },
      {
        id: 'act-002',
        ts: '2024-05-29T02:14:00.000Z',
        kind: 'achievement',
        title: 'Cleared Heat 32 with the Twin Fists',
        subtitle: 'Hades',
        icon: 'flame'
      },
      {
        id: 'act-003',
        ts: '2024-05-22T21:05:00.000Z',
        kind: 'badge',
        title: 'Seasonal Elite Diver',
        subtitle: 'Deep Rock Galactic badge earned',
        icon: 'shield-check'
      },
      {
        id: 'act-004',
        ts: '2024-05-18T10:30:00.000Z',
        kind: 'achievement',
        title: 'Perfected Form victory on Ascension 20',
        subtitle: 'Slay the Spire',
        icon: 'trophy'
      },
      {
        id: 'act-005',
        ts: '2024-05-14T16:48:00.000Z',
        kind: 'game_added',
        title: 'Added Hades II (Early Access)',
        subtitle: 'Wishlist import',
        icon: 'plus-circle'
      },
      {
        id: 'act-006',
        ts: '2024-05-10T01:24:00.000Z',
        kind: 'achievement',
        title: 'Pantheon of Hallownest complete',
        subtitle: 'Hollow Knight',
        icon: 'sword'
      },
      {
        id: 'act-007',
        ts: '2024-05-06T08:10:00.000Z',
        kind: 'achievement',
        title: 'Armored Core Rank S Marathon',
        subtitle: 'Armored Core VI',
        icon: 'target'
      },
      {
        id: 'act-008',
        ts: '2024-05-02T12:15:00.000Z',
        kind: 'game_added',
        title: "Added \"Another Crab's Treasure\"",
        subtitle: 'Backlog curated',
        icon: 'library'
      }
    ],
    privacy: {
      showStats: true,
      showActivity: true,
      showLinkedAccounts: true
    }
  }
};

export function getMockUser(handle: string): UserProfile | undefined {
  return mockUsers[handle];
}
