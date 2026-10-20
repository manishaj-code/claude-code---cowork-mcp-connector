interface RateLimitRecord {
  timestamps: number[];
}

export class ConnectorRateLimiter {
  private limits = new Map<string, RateLimitRecord>();

  /**
   * Check if request is allowed for a connector key ID
   * @param keyId Unique connector key ID
   * @param limit Maximum calls allowed in window
   * @param windowMinutes Window duration in minutes
   */
  checkLimit(
    keyId: string,
    limit: number = 120,
    windowMinutes: number = 10
  ): { allowed: boolean; remaining: number; resetInSeconds: number } {
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    const windowStart = now - windowMs;

    let record = this.limits.get(keyId);
    if (!record) {
      record = { timestamps: [] };
      this.limits.set(keyId, record);
    }

    // Filter out timestamps outside current sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= limit) {
      const oldest = record.timestamps[0];
      const resetInSeconds = Math.ceil((oldest + windowMs - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds: Math.max(1, resetInSeconds),
      };
    }

    // Record this call
    record.timestamps.push(now);
    const remaining = Math.max(0, limit - record.timestamps.length);

    return {
      allowed: true,
      remaining,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  /**
   * Reset rate limit state for a key
   */
  reset(keyId?: string) {
    if (keyId) {
      this.limits.delete(keyId);
    } else {
      this.limits.clear();
    }
  }
}

export const rateLimiter = new ConnectorRateLimiter();
