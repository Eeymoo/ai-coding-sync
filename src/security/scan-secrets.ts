import { readFile } from 'node:fs/promises';

/**
 * Sensitive scan result for a single file.
 *
 * @since 0.1.0
 * @category Security
 */
export interface SensitiveMatch {
  filePath: string;
  reason: string;
}

const SECRET_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /ghp_[a-zA-Z0-9]{36}/, reason: 'GitHub token detected' },
  { pattern: /AKIA[0-9A-Z]{16}/, reason: 'AWS access key detected' },
  {
    pattern: /-----BEGIN (RSA|OPENSSH|PGP) PRIVATE KEY-----/,
    reason: 'Private key detected',
  },
];

/**
 * Scans file contents for known sensitive patterns before sync.
 *
 * @param {string[]} filePaths - Candidate file paths to inspect
 * @returns {Promise<SensitiveMatch[]>} Matched sensitive findings
 * @example
 * const findings = await scanSecrets(['./config.txt']);
 * @since 0.1.0
 * @category Security
 */
export async function scanSecrets(
  filePaths: string[]
): Promise<SensitiveMatch[]> {
  const matches: SensitiveMatch[] = [];

  for (const filePath of filePaths) {
    const content = await readFile(filePath, 'utf8');

    for (const rule of SECRET_PATTERNS) {
      if (rule.pattern.test(content)) {
        matches.push({ filePath, reason: rule.reason });
        break;
      }
    }
  }

  return matches;
}
