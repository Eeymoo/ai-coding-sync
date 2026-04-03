import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveCredentials } from '../src/credentials/providers';
import type { AppConfig } from '../src/types';

/**
 * Tests for credential provider resolution.
 *
 * @since 0.1.0
 * @category Tests
 */
describe('credential providers', () => {
  let tempHome: string;
  let originalHome: string | undefined;
  let originalPrompt: typeof globalThis.prompt;

  beforeEach(async () => {
    originalHome = process.env.HOME;
    originalPrompt = globalThis.prompt;
    tempHome = await mkdtemp(join(tmpdir(), 'ai-sync-creds-'));
    process.env.HOME = tempHome;
    await mkdir(join(tempHome, '.config', 'ai-coding-sync'), {
      recursive: true,
    });
  });

  afterEach(async () => {
    process.env.HOME = originalHome;
    if (originalPrompt) {
      globalThis.prompt = originalPrompt;
    }
    delete process.env.WEBDAV_USER;
    delete process.env.WEBDAV_PASS;
    await rm(tempHome, { recursive: true, force: true });
  });

  const baseConfig: AppConfig = {
    version: '1.0.0',
    syncId: 'device-a',
    webdav: {
      endpoint: 'https://nas.example.com/webdav',
      auth: {
        type: 'env',
        username: '${WEBDAV_USER}',
        password: '${WEBDAV_PASS}',
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
   * Verifies env credentials are resolved from environment variables.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('resolves env credentials from placeholders', async () => {
    process.env.WEBDAV_USER = 'alice';
    process.env.WEBDAV_PASS = 'secret';

    await expect(resolveCredentials(baseConfig)).resolves.toEqual({
      username: 'alice',
      password: 'secret',
    });
  });

  /**
   * Verifies file credentials load from the default credentials file.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('loads file credentials with strict permissions', async () => {
    const credentialsPath = join(
      tempHome,
      '.config',
      'ai-coding-sync',
      '.credentials'
    );
    await writeFile(
      credentialsPath,
      'username:file-user\npassword:file-pass\n',
      'utf8'
    );
    await chmod(credentialsPath, 0o600);

    await expect(
      resolveCredentials({
        ...baseConfig,
        webdav: {
          ...baseConfig.webdav,
          auth: {
            type: 'file',
          },
        },
      })
    ).resolves.toEqual({ username: 'file-user', password: 'file-pass' });
  });

  /**
   * Verifies insecure file permissions are rejected.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('rejects credentials files without 0600 permissions', async () => {
    const credentialsPath = join(
      tempHome,
      '.config',
      'ai-coding-sync',
      '.credentials'
    );
    await writeFile(
      credentialsPath,
      'username:file-user\npassword:file-pass\n',
      'utf8'
    );
    await chmod(credentialsPath, 0o644);

    await expect(
      resolveCredentials({
        ...baseConfig,
        webdav: {
          ...baseConfig.webdav,
          auth: {
            type: 'file',
          },
        },
      })
    ).rejects.toThrow();
  });

  /**
   * Verifies prompt credentials read from interactive prompts.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('prompts for credentials in prompt mode', async () => {
    const promptSpy = spyOn(globalThis, 'prompt');
    promptSpy
      .mockImplementationOnce(() => 'prompt-user')
      .mockImplementationOnce(() => 'prompt-pass');

    await expect(
      resolveCredentials({
        ...baseConfig,
        webdav: {
          ...baseConfig.webdav,
          auth: {
            type: 'prompt',
            saveToKeychain: false,
          },
        },
      })
    ).resolves.toEqual({ username: 'prompt-user', password: 'prompt-pass' });
  });
});
