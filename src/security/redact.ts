const URL_CREDENTIAL_PATTERN = /(https?:\/\/[^:\s]+):([^@\s]+)@/g;
const AUTHORIZATION_PATTERN = /Authorization:\s*[^\n\r]+/gi;

/**
 * Redacts sensitive values from logs and URLs.
 *
 * @param {string} value - Raw value that may contain credentials or authorization data
 * @returns {string} Redacted string safe for logs
 * @example
 * redactSensitive('https://user:pass@example.com');
 * @since 0.1.0
 * @category Security
 */
export function redactSensitive(value: string): string {
  return value
    .replace(URL_CREDENTIAL_PATTERN, '$1:****@')
    .replace(AUTHORIZATION_PATTERN, 'Authorization: [REDACTED]');
}
