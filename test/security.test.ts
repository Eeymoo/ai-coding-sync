import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { redactSensitive } from '../src/security/redact';
import { scanSecrets } from '../src/security/scan-secrets';

/**
 * Tests for security scanning and redaction.
 *
 * @since 0.1.0
 * @category Tests
 */
describe('security helpers', () => {
  const tempDirectories: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempDirectories.map((directory) =>
        rm(directory, { recursive: true, force: true })
      )
    );
    tempDirectories.length = 0;
  });

  /**
   * Verifies known secrets are detected in file contents.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('detects GitHub tokens and private keys', async () => {
    const tempDirectory = await mkdtemp(join(tmpdir(), 'ai-sync-sec-'));
    tempDirectories.push(tempDirectory);
    const tokenFile = join(tempDirectory, 'token.txt');
    const keyFile = join(tempDirectory, 'key.pem');

    await writeFile(
      tokenFile,
      'token=ghp_abcdefghijklmnopqrstuvwxyz1234567890',
      'utf8'
    );
    await writeFile(
      keyFile,
      '-----BEGIN RSA PRIVATE KEY-----\nsecret\n-----END RSA PRIVATE KEY-----',
      'utf8'
    );

    const results = await scanSecrets([tokenFile, keyFile]);

    expect(results).toHaveLength(2);
    expect(results.map((item) => item.filePath).sort()).toEqual(
      [keyFile, tokenFile].sort()
    );
  });

  /**
   * Verifies safe files do not produce matches.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('returns no matches for safe files', async () => {
    const tempDirectory = await mkdtemp(join(tmpdir(), 'ai-sync-safe-'));
    tempDirectories.push(tempDirectory);
    const safeFile = join(tempDirectory, 'config.txt');

    await writeFile(safeFile, 'hello world', 'utf8');

    await expect(scanSecrets([safeFile])).resolves.toEqual([]);
  });

  /**
   * Verifies URL credentials and authorization headers are redacted.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('redacts sensitive URLs and authorization values', () => {
    expect(redactSensitive('https://user:pass@example.com/webdav')).toBe(
      'https://user:****@example.com/webdav'
    );
    expect(redactSensitive('Authorization: Basic abc123')).toBe(
      'Authorization: [REDACTED]'
    );
  });
});
