import { describe, expect, test } from 'bun:test';
import { interpolateTemplate } from '../src/config/interpolate';
import { expandUserPath } from '../src/utils/path-utils';

/**
 * Tests for interpolation and path utility behavior.
 *
 * @since 0.1.0
 * @category Tests
 */
describe('config utility helpers', () => {
  /**
   * Verifies all supported template variables are interpolated.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('interpolates supported template variables', () => {
    expect(
      interpolateTemplate(
        '/root/${syncId}/${hostname}/${username}/${profile}/${date}/${time}',
        {
          syncId: 'macbook-pro-m3',
          hostname: 'host-a',
          username: 'alice',
          profile: 'default',
          date: '2026-04-03',
          time: '2026-04-03T11:00:00',
        }
      )
    ).toBe(
      '/root/macbook-pro-m3/host-a/alice/default/2026-04-03/2026-04-03T11:00:00'
    );
  });

  /**
   * Verifies unsupported placeholders are preserved.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('preserves unknown placeholders', () => {
    expect(
      interpolateTemplate('/root/${syncId}/${unknown}', {
        syncId: 'device-1',
        hostname: 'host-a',
        username: 'alice',
        profile: 'default',
        date: '2026-04-03',
        time: '2026-04-03T11:00:00',
      })
    ).toBe('/root/device-1/${unknown}');
  });

  /**
   * Verifies tilde paths expand to the current home directory.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('expands tilde to the home directory', () => {
    process.env.HOME = '/tmp/test-home';

    expect(expandUserPath('~/.config/ai-coding-sync')).toBe(
      '/tmp/test-home/.config/ai-coding-sync'
    );
  });

  /**
   * Verifies environment variables are expanded.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('expands environment variable placeholders', () => {
    process.env.AI_SYNC_ROOT = '/var/lib/ai-sync';

    expect(expandUserPath('${AI_SYNC_ROOT}/cache')).toBe(
      '/var/lib/ai-sync/cache'
    );
  });

  /**
   * Verifies mixed tilde and env references can coexist.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('expands mixed values and keeps plain paths unchanged', () => {
    process.env.HOME = '/tmp/test-home';
    process.env.NESTED_DIR = 'projects';

    expect(expandUserPath('~/${NESTED_DIR}/sync')).toBe(
      '/tmp/test-home/projects/sync'
    );
    expect(expandUserPath('/plain/path')).toBe('/plain/path');
  });
});
