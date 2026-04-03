import { describe, expect, test } from 'bun:test';
import { appConfigSchema, webDavAuthSchema } from '../src/config/schema';

/**
 * Tests for configuration schema validation.
 *
 * @since 0.1.0
 * @category Tests
 */
describe('configuration schemas', () => {
  /**
   * Verifies a valid env auth configuration is accepted.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('accepts valid auth configuration', () => {
    expect(
      webDavAuthSchema.parse({
        type: 'env',
        username: '${WEBDAV_USER}',
        password: '${WEBDAV_PASS}',
      })
    ).toEqual({
      type: 'env',
      username: '${WEBDAV_USER}',
      password: '${WEBDAV_PASS}',
    });
  });

  /**
   * Verifies invalid auth type is rejected.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('rejects unsupported auth type', () => {
    expect(() =>
      webDavAuthSchema.parse({
        type: 'oauth',
      })
    ).toThrow();
  });

  /**
   * Verifies a full application config can be parsed.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('accepts complete application configuration', () => {
    expect(
      appConfigSchema.parse({
        version: '1.0.0',
        syncId: 'macbook-pro-m3',
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
            concurrency: 3,
          },
        },
        profiles: {
          default: {
            inherit: true,
            sourceType: 'auto',
            deployMode: 'link',
            strategy: 'two-way',
            conflict: 'ask',
            backupCount: 5,
          },
        },
        mappings: [
          {
            name: 'claude',
            local: '~/.claude',
            remotePath: 'claude/v1',
            profile: 'default',
            sourceType: 'inherit',
            deployMode: 'inherit',
            ignore: ['.DS_Store'],
          },
        ],
        ignoreGlobal: ['.DS_Store'],
        hooks: {
          'pre-sync': null,
          'post-sync': null,
          'on-conflict': null,
        },
      })
    ).toBeDefined();
  });

  /**
   * Verifies invalid mapping source type is rejected.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('rejects invalid mapping source type', () => {
    expect(() =>
      appConfigSchema.parse({
        version: '1.0.0',
        syncId: 'device',
        webdav: {
          endpoint: 'https://nas.example.com/webdav',
          auth: {
            type: 'env',
            username: '${WEBDAV_USER}',
            password: '${WEBDAV_PASS}',
          },
          remoteRoot: '/ai-sync/${syncId}',
          options: {
            depth: '1',
            verifySsl: true,
            timeout: 30000,
            maxRetries: 3,
            concurrency: 1,
          },
        },
        profiles: {},
        mappings: [
          {
            name: 'claude',
            local: '~/.claude',
            remotePath: 'claude/v1',
            sourceType: 'broken-mode',
          },
        ],
        ignoreGlobal: [],
        hooks: {},
      })
    ).toThrow();
  });

  /**
   * Verifies legacy mode fields are rejected in the new schema.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('rejects legacy mode fields in profiles and mappings', () => {
    expect(() =>
      appConfigSchema.parse({
        version: '1.0.0',
        syncId: 'device',
        webdav: {
          endpoint: 'https://nas.example.com/webdav',
          auth: {
            type: 'env',
            username: '${WEBDAV_USER}',
            password: '${WEBDAV_PASS}',
          },
          remoteRoot: '/ai-sync/${syncId}',
          options: {
            depth: '1',
            verifySsl: true,
            timeout: 30000,
            maxRetries: 3,
            concurrency: 1,
          },
        },
        profiles: {
          default: {
            mode: 'git',
          },
        },
        mappings: [
          {
            name: 'claude',
            local: '~/.claude',
            remotePath: 'claude/v1',
            mode: 'link',
          },
        ],
        ignoreGlobal: [],
        hooks: {},
      })
    ).toThrow();
  });
});
