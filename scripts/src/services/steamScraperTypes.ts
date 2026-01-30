// Type definitions for Steam Scraper operations

import { SteamGameStats } from '../types';

// Represents an error that occurred while processing a game
export interface GameProcessingError {
  appId: number;
  gameName: string;
  error: string;
  errorType?: string;
}

// Success result from scraping a single Steam profile
export interface ScrapeProfileSuccessResult {
  kind: 'success';
  steamId: string;
  displayName: string;
  gamesProcessed: number;
  achievementsSaved: number;
  gamesWithErrors: GameProcessingError[];
  isIncrementalUpdate: boolean;
}

// Result indicating the Steam profile was not found
export interface ScrapeProfileNotFoundResult {
  kind: 'not_found';
  steamId: string;
}

// Result indicating the Steam profile is private
export interface ScrapeProfilePrivateResult {
  kind: 'private';
  steamId: string;
}

// Result indicating the operation was cancelled
export interface ScrapeProfileCancelledResult {
  kind: 'cancelled';
}

// Result indicating a fatal error occurred
export interface ScrapeProfileErrorResult {
  kind: 'error';
  steamId: string;
  error: string;
  errorType?: string;
  stack?: string;
}

// Union type for all possible scrape results
export type ScrapeProfileResult =
  | ScrapeProfileSuccessResult
  | ScrapeProfileNotFoundResult
  | ScrapeProfilePrivateResult
  | ScrapeProfileCancelledResult
  | ScrapeProfileErrorResult;

// Summary for a single profile scrape operation
export interface ProfileScrapeSummary {
  steamId: string;
  result: ScrapeProfileResult;
}

// Result from scraping multiple profiles
export interface ScrapeMultipleProfilesResult {
  totalProfiles: number;
  successCount: number;
  failureCount: number;
  cancelledCount: number;
  notFoundCount: number;
  privateCount: number;
  profiles: ProfileScrapeSummary[];
}
