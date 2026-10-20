import crypto from 'crypto';

/**
 * Generate a cryptographically secure, URL-safe secret token with at least 32 random bytes.
 */
export function generateConnectorSecret(): string {
  // 32 random bytes converted to URL-safe base64 (approx 43 chars)
  const randomBytes = crypto.randomBytes(32);
  const rawSecret = randomBytes.toString('base64url');
  return `sec_${rawSecret}`;
}

/**
 * Hash a secret using SHA-256. Only this hash is stored persistently.
 */
export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

/**
 * Extract a non-secret prefix for admin display.
 * e.g. "sec_ab12cd34..."
 */
export function getSecretPrefix(secret: string): string {
  if (secret.length <= 12) {
    return 'sec_***';
  }
  return `${secret.slice(0, 10)}...`;
}

/**
 * Generate a random UUID v4 string.
 */
export function generateId(): string {
  return crypto.randomUUID();
}
