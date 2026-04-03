import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  loadConfig,
  resolveMapping,
  resolveProfile,
} from '../src/config/load-config';
import type { AppConfig, MappingConfig } from '../src/types';

/**
 * Tests for configuration loading and resolution.
 *
 * @since 0.1.0
 * @category Tests
 */
describe('configuration loading and resolution', () => {
  let tempHome: string;
  let originalHome: string | undefined;

  beforeEach(async () => {
    originalHome = process.env.HOME;
    tempHome = await mkdtemp(join(tmpdir(), 'ai-sync-config-'));
    process.env.HOME = tempHome;
    await mkdir(join(tempHome, '.config', 'ai-coding-sync'), {
      recursive: true,
    });
  });

  afterEach(async () => {
    process.env.HOME = originalHome;
    await rm(tempHome, { recursive: true, force: true });
  });

  /**
   * Verifies the config file is loaded from the default config path.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('loads the root config from the default directory', async () => {
    const config: AppConfig = {
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
      profiles: {
        default: {
          inherit: true,
          mode: 'auto',
          strategy: 'two-way',
          conflict: 'ask',
          backupCount: 5,
        },
      },
      mappings: [],
      ignoreGlobal: ['.DS_Store'],
      hooks: {},
    };

    await writeFile(
      join(tempHome, '.config', 'ai-coding-sync', 'config.json'),
      JSON.stringify(config, null, 2),
      'utf8'
    );

    await expect(loadConfig()).resolves.toEqual(config);
  });

  /**
   * Verifies profile inheritance merges from the default profile.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('resolves inherited profiles from default profile', () => {
    const config: AppConfig = {
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
      profiles: {
        default: {
          inherit: true,
          mode: 'auto',
          strategy: 'two-way',
          conflict: 'ask',
          backupCount: 5,
        },
        company: {
          inherit: true,
          syncId: 'workstation-01',
          mode: 'git',
          conflict: 'remote',
        },
      },
      mappings: [],
      ignoreGlobal: [],
      hooks: {},
    };

    expect(resolveProfile(config, 'company')).toEqual({
      inherit: true,
      mode: 'git',
      strategy: 'two-way',
      conflict: 'remote',
      backupCount: 5,
      syncId: 'workstation-01',
    });
  });

  /**
   * Verifies mapping resolution applies profile and CLI overrides.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('resolves effective mapping with overrides and auto mode fallback', () => {
    const config: AppConfig = {
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
      profiles: {
        default: {
          inherit: true,
          mode: 'auto',
          strategy: 'two-way',
          conflict: 'ask',
          backupCount: 5,
        },
        company: {
          inherit: true,
          syncId: 'workstation-01',
          mode: 'git',
          conflict: 'remote',
        },
      },
      mappings: [],
      ignoreGlobal: [],
      hooks: {},
    };
    const mapping: MappingConfig = {
      name: 'claude',
      local: '~/.claude',
      remotePath: 'claude/v1',
      profile: 'company',
      mode: 'inherit',
      conflict: 'backup',
    };

    expect(
      resolveMapping(config, mapping, { profile: 'company', mode: 'file' })
    ).toMatchObject({
      name: 'claude',
      resolvedProfile: 'company',
      resolvedSyncId: 'workstation-01',
      resolvedMode: 'file',
      resolvedConflict: 'backup',
    });
  });
});
