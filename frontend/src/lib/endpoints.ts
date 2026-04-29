export const endpoints = {
  auth: {
    steamLogin: "/auth/steam/login",
    steamCallback: "/auth/steam/callback",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
  },
  social: {
    feed: "/social/feed",
    feedByUser: (authorPublicId: string) => `/social/feed/users/${authorPublicId}`,
    createPost: "/social/post",
    uploadImage: "/social/upload/image",
    postComments: (postPublicId: string) => `/social/posts/${postPublicId}/comments`,
    createComment: (postPublicId: string) => `/social/posts/${postPublicId}/comment`,
    setReaction: (postPublicId: string) => `/social/posts/${postPublicId}/reaction`,
  },
  me: {
    get: "/me",
    socialIdentity: "/me/social-identity",
    pinAchievement: "/me/pin-achievement",
    unpinAchievement: (pinnedAchievementId: number) =>
      `/me/pinned-achievement/${pinnedAchievementId}`,
    settings: "/me/settings",
    settingsMedia: "/me/settings/media",
  },
  settingsLookup: {
    countries: "/settings/lookup/countries",
    stateRegions: (countryId: number) =>
      `/settings/lookup/countries/${countryId}/state-regions`,
    cities: (stateRegionId: number) =>
      `/settings/lookup/state-regions/${stateRegionId}/cities`,
    ianaTimeZones: "/settings/lookup/iana-time-zones",
    pronouns: "/settings/lookup/pronouns",
  },
  profileScraping: {
    update: "/profile-scraping/update",
  },
  steamWebApiProxy: {
    resolveVanityUrl: "/steam/proxy/ISteamUser/ResolveVanityURL/v0001",
    getPlayerSummaries: "/steam/proxy/ISteamUser/GetPlayerSummaries/v0002",
    getOwnedGames: "/steam/proxy/IPlayerService/GetOwnedGames/v0001",
    getPlayerAchievements:
      "/steam/proxy/ISteamUserStats/GetPlayerAchievements/v0001",
    getUserStatsForGame:
      "/steam/proxy/ISteamUserStats/GetUserStatsForGame/v0002",
    getSchemaForGame: "/steam/proxy/ISteamUserStats/GetSchemaForGame/v0002",
  },
  userProfiles: {
    getProfile: (publicId: string) => `/users/${publicId}/profile`,
    getPublicIdByHandle: (handle: string) =>
      `/users/handles/${encodeURIComponent(handle.replace(/^@/, ""))}/public-id`,
    search: "/users/search",
  },
  steamGames: {
    getDetails: (gameId: number) => `/steam/games/${gameId}`,
  },
  dm: {
    conversations: "/dm/conversations",
    messages: (conversationId: number) => `/dm/conversations/${conversationId}/messages`,
    send: "/dm/send",
    markRead: (conversationId: number) => `/dm/conversations/${conversationId}/read`,
  },
} as const;
