import { RateLimitInfo } from '../types';

export class RateLimiter {
  private requests: number[] = [];
  private dailyRequests: number = 0;
  private lastReset: number = Date.now();
  private readonly maxRequestsPerSecond = 1; // 1 request per second
  private readonly maxRequestsPerDay = 100000;
  private readonly resetInterval = 24 * 60 * 60 * 1000; // 24 hours
  private cancellationToken: { cancelled: boolean } = { cancelled: false };

  constructor() {
    // Reset daily counter if it's been more than 24 hours
    this.resetIfNeeded();
  }

  setCancellationToken(token: { cancelled: boolean }): void {
    this.cancellationToken = token;
  }

  private resetIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastReset > this.resetInterval) {
      this.dailyRequests = 0;
      this.lastReset = now;
    }
  }

  async waitIfNeeded(): Promise<void> {
    // Check for cancellation
    if (this.cancellationToken.cancelled) {
      throw new Error('Operation cancelled');
    }

    this.resetIfNeeded();
    
    const now = Date.now();
    
    // Remove requests older than 1 second (for 1 req/sec limit)
    this.requests = this.requests.filter(time => now - time < 1000);
    
    // Check if we've hit the daily limit
    if (this.dailyRequests >= this.maxRequestsPerDay) {
      const timeUntilReset = this.resetInterval - (now - this.lastReset);
      console.log(`Daily rate limit reached. Waiting ${Math.ceil(timeUntilReset / 1000 / 60)} minutes until reset.`);
      await this.sleep(timeUntilReset);
      this.resetIfNeeded();
    }
    
    // Check if we've hit the 1-second limit (1 request per second)
    if (this.requests.length >= this.maxRequestsPerSecond) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = 1000 - (now - oldestRequest);
      if (waitTime > 0) {
        console.log(`Rate limit: Waiting ${Math.ceil(waitTime)}ms before next request...`);
        await this.sleep(waitTime);
        
        // Check for cancellation after waiting
        if (this.cancellationToken.cancelled) {
          throw new Error('Operation cancelled');
        }
      }
    }
    
    // Record this request
    this.requests.push(now);
    this.dailyRequests++;
  }

  getRateLimitInfo(): RateLimitInfo {
    this.resetIfNeeded();
    const now = Date.now();
    const requestsInLastSecond = this.requests.filter(time => now - time < 1000).length;
    
    return {
      requestsPer10Seconds: requestsInLastSecond, // Keep for compatibility, but represents per-second now
      requestsPerDay: this.dailyRequests,
      currentRequests: requestsInLastSecond,
      resetTime: this.lastReset + this.resetInterval
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}