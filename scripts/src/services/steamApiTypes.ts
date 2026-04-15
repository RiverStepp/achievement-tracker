// TypeScript interfaces for Steam API responses
// These define the exact shapes returned by various Steam Web API endpoints

import { SteamUser, SteamGame, SteamAchievement } from '../types';

// Response from ISteamUser/ResolveVanityURL
// Used to resolve a custom Steam URL to a Steam ID
export interface ResolveVanityUrlResponse {
  response: {
    steamid?: string;
    success: number; // 1 = success, 42 = no match found
    message?: string;
  };
}

// Response from ISteamUser/GetPlayerSummaries
// Used to get profile information for Steam users
export interface GetPlayerSummariesResponse {
  response: {
    players: SteamUser[];
  };
}

// Response from IPlayerService/GetOwnedGames
// Used to get a list of games owned by a user
export interface GetOwnedGamesResponse {
  response: {
    game_count?: number;
    games?: SteamGame[];
  };
}

// Response from ISteamUserStats/GetPlayerAchievements
// Used to get achievement data for a specific game and user
export interface GetPlayerAchievementsResponse {
  playerstats?: {
    steamID?: string;
    gameName?: string;
    achievements?: SteamAchievement[];
    success?: boolean;
    error?: string;
  };
}

// Response from ISteamUserStats/GetUserStatsForGame
// Used to get user stats for a specific game
export interface GetUserStatsForGameResponse {
  playerstats?: {
    steamID?: string;
    gameName?: string;
    stats?: Array<{
      name: string;
      value: number;
    }>;
    achievements?: SteamAchievement[];
    error?: string;
  };
}

// Response from ISteamUserStats/GetSchemaForGame
// Used to get the schema (metadata) for a game
export interface GetSchemaForGameResponse {
  game?: {
    gameName?: string;
    gameVersion?: string;
    availableGameStats?: {
      stats?: Array<{
        name: string;
        defaultvalue: number;
        displayName: string;
      }>;
      achievements?: Array<{
        name: string;
        defaultvalue: number;
        displayName: string;
        hidden: number;
        description?: string;
        icon?: string;
        icongray?: string;
      }>;
    };
  };
}
