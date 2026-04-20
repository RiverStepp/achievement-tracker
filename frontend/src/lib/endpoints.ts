export const endpoints = {
  auth: {
    steamLogin: "/auth/steam/login",
    steamCallback: "/auth/steam/callback",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
  },
  me: {
    get: "/me",
    socialIdentity: "/me/social-identity",
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
  },
} as const;
