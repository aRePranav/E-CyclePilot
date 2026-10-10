// ============================================================================
// E-CyclePilot: In-Memory Client Rate Limiter for AI Endpoints
// ============================================================================

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 15,
  windowMs: 60_000, // 1 minute
};

class InMemoryRateLimiter {
  private timestamps: Map<string, number[]> = new Map();
  private config: RateLimitConfig = { ...DEFAULT_CONFIG };

  public configure(customConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...customConfig };
  }

  public check(clientKey: string): { allowed: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const list = this.timestamps.get(clientKey) || [];
    // Prune timestamps older than current window
    const validTimestamps = list.filter((ts) => ts > windowStart);

    if (validTimestamps.length >= this.config.maxRequests) {
      const oldestValid = validTimestamps[0] ?? now;
      const retryAfterMs = oldestValid + this.config.windowMs - now;
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
      return { allowed: false, retryAfterSeconds };
    }

    validTimestamps.push(now);
    this.timestamps.set(clientKey, validTimestamps);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  public reset(): void {
    this.timestamps.clear();
    this.config = { ...DEFAULT_CONFIG };
  }
}

export const aiRateLimiter = new InMemoryRateLimiter();
