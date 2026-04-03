import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveCredentials } from '../src/credentials/providers';
import type { AppConfig } from '../src/types';

/**
 * Tests for remaining credential provider behaviors.
 *
 * @since 0.1.0
 * @category Tests
 */
describe('advanced credential providers', () => {
  let tempHome: string;
  let originalHome: string | undefined;

  beforeEach(async () => {
    originalHome = process.env.HOME;
    tempHome = await mkdtemp(join(tmpdir(), 'ai-sync-creds-advanced-'));
    process.env.HOME = tempHome;
  });

  afterEach(async () => {
    process.env.HOME = originalHome;
    await rm(tempHome, { recursive: true, force: true });
  });

  const baseConfig: AppConfig = {
    version: '1.0.0',
    syncId: 'device-a',
    webdav: {
      endpoint: 'https://nas.example.com/webdav',
      auth: {
        type: 'keychain',
        service: 'ai-coding-sync',
        account: 'default',
      },
      remoteRoot: '/ai-sync/${syncId}',
      options: {
        depth: 'infinity',
        verifySsl: true,
        timeout: 30000,
        maxRetries: 3,
        concurrency: 2,
      },
    },
    profiles: {},
    mappings: [],
    ignoreGlobal: [],
    hooks: {},
  };

  /**
   * Verifies keychain mode can resolve credentials through a command abstraction.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('resolves keychain credentials through provider abstraction', async () => {
    await expect(
      resolveCredentials(baseConfig, {
        runKeychainCommand: async () => 'key-user:key-pass',
      })
    ).resolves.toEqual({
      username: 'key-user',
      password: 'key-pass',
    });
  });
});
