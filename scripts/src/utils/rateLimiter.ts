import { RateLimitInfo } from '../types';

const DEFAULT_MAX_PER_SECOND = 4;
const DEFAULT_MAX_PER_MINUTE = 300;
const DEFAULT_MAX_PER_DAY = 100_000;

export class RateLimiter {
  private readonly maxPerSecond: number;
  private readonly maxPerMinute: number;
  private readonly dailyCap: number;

  private secondWindow: number[] = [];
  private minuteWindow: number[] = [];
  private dailyCount: number = 0;
  private dailyResetAt: number;
  private cooldownUntilMs: number = 0;
  private cancellationToken: { cancelled: boolean } = { cancelled: false };

  constructor() {
    this.maxPerSecond = parseInt(process.env.STEAM_API_MAX_PER_SECOND ?? '') || DEFAULT_MAX_PER_SECOND;
    this.maxPerMinute = parseInt(process.env.STEAM_API_MAX_PER_MINUTE ?? '') || DEFAULT_MAX_PER_MINUTE;
    this.dailyCap = parseInt(process.env.STEAM_API_MAX_PER_DAY ?? '') || DEFAULT_MAX_PER_DAY;
    this.dailyResetAt = Date.now() + 24 * 60 * 60 * 1000;
  }

  setCancellationToken(token: { cancelled: boolean }): void {
    this.cancellationToken = token;
  }

  noteHttp429(headers: unknown): void {
    let retryAfterSec = 60;
    if (headers != null && typeof headers === 'object') {
      const h = headers as Record<string, unknown>;
      const ra = h['retry-after'] ?? h['Retry-After'];
      if (ra != null) {
        const parsed = parseInt(String(ra), 10);
        if (!isNaN(parsed) && parsed > 0) retryAfterSec = parsed;
      }
    }
    const until = Date.now() + retryAfterSec * 1000;
    if (until > this.cooldownUntilMs) {
      this.cooldownUntilMs = until;
    }
    console.warn(`Steam API 429: backing off ${retryAfterSec}s (until ${new Date(this.cooldownUntilMs).toISOString()})`);
  }

  async waitIfNeeded(): Promise<void> {
    this.checkCancelled();

    // 429 cooldown
    const cooldownWait = this.cooldownUntilMs - Date.now();
    if (cooldownWait > 0) {
      console.warn(`Rate limiter: 429 cooldown, waiting ${Math.ceil(cooldownWait / 1000)}s...`);
      await this.sleep(cooldownWait);
      this.checkCancelled();
    }

    // Daily reset
    if (Date.now() >= this.dailyResetAt) {
      this.dailyCount = 0;
      this.dailyResetAt = Date.now() + 24 * 60 * 60 * 1000;
    }

    // Daily cap
    if (this.dailyCount >= this.dailyCap) {
      const wait = this.dailyResetAt - Date.now();
      console.log(`Daily cap (${this.dailyCap}) reached. Waiting ${Math.ceil(wait / 1000 / 60)} min until reset.`);
      await this.sleep(wait);
      this.checkCancelled();
      this.dailyCount = 0;
      this.dailyResetAt = Date.now() + 24 * 60 * 60 * 1000;
    }

    await this.throttle(this.minuteWindow, this.maxPerMinute, 60_000, 'minute');
    await this.throttle(this.secondWindow, this.maxPerSecond, 1_000, 'second');

    const ts = Date.now();
    this.secondWindow.push(ts);
    this.minuteWindow.push(ts);
    this.dailyCount++;
  }

  private async throttle(
    window: number[],
    max: number,
    windowMs: number,
    label: string,
  ): Promise<void> {
    this.pruneWindow(window, windowMs);

    if (window.length >= max) {
      const waitMs = windowMs - (Date.now() - window[0]) + 1;
      if (waitMs > 0) {
        console.log(`Rate limit (per-${label}): waiting ${Math.ceil(waitMs)}ms...`);
        await this.sleep(waitMs);
        this.checkCancelled();
        this.pruneWindow(window, windowMs);
      }
    }
  }

  private pruneWindow(window: number[], windowMs: number): void {
    const cutoff = Date.now() - windowMs;
    let i = 0;
    while (i < window.length && window[i] <= cutoff) i++;
    if (i > 0) window.splice(0, i);
  }

  private checkCancelled(): void {
    if (this.cancellationToken.cancelled) {
      throw new Error('Operation cancelled');
    }
  }

  getRateLimitInfo(): RateLimitInfo {
    const now = Date.now();
    return {
      requestsPer10Seconds: this.secondWindow.filter(t => now - t < 10_000).length,
      requestsPerDay: this.dailyCount,
      currentRequests: this.secondWindow.filter(t => now - t < 1_000).length,
      resetTime: this.dailyResetAt,
      maxPerSecond: this.maxPerSecond,
      maxPerMinute: this.maxPerMinute,
      requestsInLastMinute: this.minuteWindow.filter(t => now - t < 60_000).length,
      dailyCap: this.dailyCap,
      cooldownUntilMs: this.cooldownUntilMs,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
