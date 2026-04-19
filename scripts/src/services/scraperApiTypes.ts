import type { SteamGameStats, ScrapingProgress } from '../types';

export type SteamId64 = bigint;

export type ScrapeUserInput =
  | { kind: 'username'; username: string }
  | { kind: 'steamId'; steamId: SteamId64 };

export type ScrapeUserSuccess = {
  kind: 'success';
  steamId: string;
  username: string;
  outputFile?: string;
  gameStatsCount: number;
};

export type ScrapeUserNotFound = {
  kind: 'not_found';
  input: ScrapeUserInput;
};

export type ScrapeUserPrivateProfile = {
  kind: 'private_profile';
  steamId: string;
  input: ScrapeUserInput;
};

export type ScrapeUserCancelled = {
  kind: 'cancelled';
};

export type ScrapeUserError = {
  kind: 'error';
  input: ScrapeUserInput;
  message: string;
  /**
   * Stack traces/types are preserved here for debugging (server-side).
   * Don't surface this directly to untrusted clients.
   */
  errorType?: string;
  stack?: string;
};

export type ScrapeUserResult =
  | ScrapeUserSuccess
  | ScrapeUserNotFound
  | ScrapeUserPrivateProfile
  | ScrapeUserCancelled
  | ScrapeUserError;

export type ScrapeUsersResult = {
  kind: 'batch_result';
  results: ScrapeUserResult[];
};

export type GetProgressResult = ScrapingProgress;

// Note: SteamScraper now uses types from steamScraperTypes.ts
// This file maintains backward compatibility for the API layer

