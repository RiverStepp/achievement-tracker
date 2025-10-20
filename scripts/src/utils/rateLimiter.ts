import { RateLimitInfo } from '../types';

export class RateLimiter {
  private requests: number[] = [];
  private dailyRequests: number = 0;
  private lastReset: number = Date.now();
  private readonly maxRequestsPer10Seconds = 10;
  private readonly maxRequestsPerDay = 100000;
  private readonly resetInterval = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Reset daily counter if it's been more than 24 hours
    this.resetIfNeeded();
  }

  private resetIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastReset > this.resetInterval) {
      this.dailyRequests = 0;
      this.lastReset = now;
    }
  }

  async waitIfNeeded(): Promise<void> {
    this.resetIfNeeded();
    
    const now = Date.now();
    
    // Remove requests older than 10 seconds
    this.requests = this.requests.filter(time => now - time < 10000);
    
    // Check if we've hit the daily limit
    if (this.dailyRequests >= this.maxRequestsPerDay) {
      const timeUntilReset = this.resetInterval - (now - this.lastReset);
      console.log(`Daily rate limit reached. Waiting ${Math.ceil(timeUntilReset / 1000 / 60)} minutes until reset.`);
      await this.sleep(timeUntilReset);
      this.resetIfNeeded();
    }
    
    // Check if we've hit the 10-second limit
    if (this.requests.length >= this.maxRequestsPer10Seconds) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = 10000 - (now - oldestRequest);
      if (waitTime > 0) {
        console.log(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
        await this.sleep(waitTime);
      }
    }
    
    // Record this request
    this.requests.push(now);
    this.dailyRequests++;
  }

  getRateLimitInfo(): RateLimitInfo {
    this.resetIfNeeded();
    const now = Date.now();
    const requestsInLast10Seconds = this.requests.filter(time => now - time < 10000).length;
    
    return {
      requestsPer10Seconds: requestsInLast10Seconds,
      requestsPerDay: this.dailyRequests,
      currentRequests: requestsInLast10Seconds,
      resetTime: this.lastReset + this.resetInterval
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}