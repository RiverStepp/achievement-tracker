import axios, { AxiosResponse } from 'axios';
import { SteamUser, SteamGame, SteamAchievement, SteamGameStats } from '../types';
import { RateLimiter } from '../utils/rateLimiter';

export class SteamApiService {
  private apiKey: string;
  private rateLimiter: RateLimiter;
  private baseUrl = 'https://api.steampowered.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.rateLimiter = new RateLimiter();
  }

  async getUserProfile(steamId: string): Promise<SteamUser | null> {
    await this.rateLimiter.waitIfNeeded();
    
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/ISteamUser/GetPlayerSummaries/v0002/`,
        {
          params: {
            key: this.apiKey,
            steamids: steamId
          }
        }
      );

      if (response.data.response.players.length === 0) {
        return null;
      }

      return response.data.response.players[0];
    } catch (error) {
      console.error(`Error fetching user profile for ${steamId}:`, error);
      throw error;
    }
  }

  async getUserGames(steamId: string): Promise<SteamGame[]> {
    await this.rateLimiter.waitIfNeeded();
    
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/IPlayerService/GetOwnedGames/v0001/`,
        {
          params: {
            key: this.apiKey,
            steamid: steamId,
            include_appinfo: true,
            include_played_free_games: true
          }
        }
      );

      return response.data.response.games || [];
    } catch (error) {
      console.error(`Error fetching games for ${steamId}:`, error);
      throw error;
    }
  }

  async getUserAchievements(steamId: string, appId: number): Promise<SteamAchievement[]> {
    await this.rateLimiter.waitIfNeeded();
    
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/ISteamUserStats/GetPlayerAchievements/v0001/`,
        {
          params: {
            key: this.apiKey,
            steamid: steamId,
            appid: appId
          }
        }
      );

      return response.data.playerstats?.achievements || [];
    } catch (error) {
      console.error(`Error fetching achievements for ${steamId} in game ${appId}:`, error);
      throw error;
    }
  }

  async getUserStatsForGame(steamId: string, appId: number): Promise<any> {
    await this.rateLimiter.waitIfNeeded();
    
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/ISteamUserStats/GetUserStatsForGame/v0002/`,
        {
          params: {
            key: this.apiKey,
            steamid: steamId,
            appid: appId
          }
        }
      );

      return response.data.playerstats;
    } catch (error) {
      console.error(`Error fetching stats for ${steamId} in game ${appId}:`, error);
      throw error;
    }
  }

  async getGameSchema(appId: number): Promise<any> {
    await this.rateLimiter.waitIfNeeded();
    
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/ISteamUserStats/GetSchemaForGame/v0002/`,
        {
          params: {
            key: this.apiKey,
            appid: appId
          }
        }
      );

      return response.data.game;
    } catch (error) {
      console.error(`Error fetching schema for game ${appId}:`, error);
      throw error;
    }
  }

  getRateLimitInfo() {
    return this.rateLimiter.getRateLimitInfo();
  }
}