const SENSITIVE_KEY_PATTERNS = [
  /pass(word)?/i,
  /secret/i,
  /token/i,
  /auth/i,
  /key/i,
  /bearer/i,
  /credential/i,
  /private/i,
  /cert/i,
];

const SECRET_VALUE_PATTERNS = [
  // API key patterns (e.g. sk-..., ghp_..., sec_..., aistudio...)
  /\b(sk-[a-zA-Z0-9_-]{20,})\b/g,
  /\b(ghp_[a-zA-Z0-9]{30,})\b/g,
  /\b(sec_[a-zA-Z0-9_-]{30,})\b/g,
  /\b(AIzaSy[a-zA-Z0-9_-]{33})\b/g,
  // Bearer tokens
  /\b(Bearer\s+)[a-zA-Z0-9_.\-~+/=]+/gi,
  // SSN-like patterns
  /\b\d{3}-\d{2}-\d{4}\b/g,
  // Credit card patterns
  /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
];

/**
 * Redact sensitive strings in a text value.
 */
export function redactSensitiveText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  let redacted = text;
  for (const pattern of SECRET_VALUE_PATTERNS) {
    redacted = redacted.replace(pattern, '[REDACTED]');
  }
  return redacted;
}

/**
 * Recursively sanitize an arguments object for safe audit logging.
 * Replaces values of sensitive keys or matching sensitive token formats.
 */
export function sanitizeArguments(args: unknown): Record<string, unknown> {
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    return { value: sanitizeValue(args) };
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(args as Record<string, unknown>)) {
    const isKeySensitive = SENSITIVE_KEY_PATTERNS.some((pat) => pat.test(key));
    if (isKeySensitive) {
      result[key] = '[REDACTED_SECRET]';
    } else {
      result[key] = sanitizeValue(val);
    }
  }
  return result;
}

function sanitizeValue(val: unknown): unknown {
  if (typeof val === 'string') {
    return redactSensitiveText(val);
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (val && typeof val === 'object') {
    return sanitizeArguments(val);
  }
  return val;
}
