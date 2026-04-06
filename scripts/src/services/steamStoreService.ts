import axios from 'axios';

const STORE_API_TIMEOUT_MS = 10_000;
const STORE_API_BASE_URL = 'https://store.steampowered.com/api';

export interface StoreGameDetails {
  name: string;
  short_description?: string;
  header_image_url?: string;
  developers: string[];
  publishers: string[];
  genres: string[];
  categories: string[];
  platforms: string[];
  release_date?: Date;
  metacritic_score?: number;
}

export class SteamStoreService {
  async getAppDetails(appId: number): Promise<StoreGameDetails | null> {
    try {
      const response = await axios.get<Record<string, unknown>>(`${STORE_API_BASE_URL}/appdetails`, {
        params: { appids: appId, cc: 'us', l: 'en' },
        timeout: STORE_API_TIMEOUT_MS,
      });

      const entry = response.data?.[String(appId)];
      if (typeof entry !== 'object' || entry === null) return null;
      const e = entry as Record<string, unknown>;
      if (!e['success']) return null;

      const d = e['data'] as Record<string, unknown> | undefined;
      if (!d) return null;

      const platforms: string[] = [];
      const p = d['platforms'] as Record<string, unknown> | undefined;
      if (p?.['windows']) platforms.push('windows');
      if (p?.['mac']) platforms.push('mac');
      if (p?.['linux']) platforms.push('linux');

      let release_date: Date | undefined;
      const rd = d['release_date'] as Record<string, unknown> | undefined;
      if (rd && !rd['coming_soon'] && typeof rd['date'] === 'string') {
        const parsed = new Date(rd['date']);
        if (!isNaN(parsed.getTime())) release_date = parsed;
      }

      const toStringArray = (raw: unknown, key: string): string[] =>
        Array.isArray(raw)
          ? raw
              .map((item: unknown) =>
                typeof item === 'object' && item !== null
                  ? String((item as Record<string, unknown>)[key] ?? '')
                  : '',
              )
              .filter(Boolean)
          : [];

      const mc = d['metacritic'] as Record<string, unknown> | undefined;

      return {
        name: typeof d['name'] === 'string' ? d['name'] : '',
        short_description: typeof d['short_description'] === 'string' ? d['short_description'] : undefined,
        header_image_url: typeof d['header_image'] === 'string' ? d['header_image'] : undefined,
        developers: Array.isArray(d['developers']) ? (d['developers'] as string[]) : [],
        publishers: Array.isArray(d['publishers']) ? (d['publishers'] as string[]) : [],
        genres: toStringArray(d['genres'], 'description'),
        categories: toStringArray(d['categories'], 'description'),
        platforms,
        release_date,
        metacritic_score: typeof mc?.['score'] === 'number' ? (mc['score'] as number) : undefined,
      };
    } catch (error) {
      console.error(
        `Steam Store API error for appId ${appId}:`,
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  }
}
