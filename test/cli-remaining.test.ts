import { describe, expect, mock, test } from 'bun:test';
import { runCli } from '../src/cli/run-cli';

/**
 * Tests for remaining CLI workflow coverage.
 *
 * @since 0.1.0
 * @category Tests
 */
describe('remaining cli workflows', () => {
  /**
   * Verifies sync is the default command when no subcommand is given.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('routes bare args to sync command', async () => {
    const handler = mock(async () => undefined);

    await runCli(['claude', '--force'], {
      sync: handler,
    });

    expect(handler).toHaveBeenCalledWith({
      command: 'sync',
      args: ['claude'],
      options: {
        force: true,
      },
    });
  });

  /**
   * Verifies config set subcommand is normalized.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('normalizes config set subcommand', async () => {
    const handler = mock(async () => undefined);

    await runCli(['config', 'set', 'profiles.default.deployMode', 'copy'], {
      'config:set': handler,
    });

    expect(handler).toHaveBeenCalledWith({
      command: 'config:set',
      args: ['profiles.default.deployMode', 'copy'],
      options: {},
    });
  });

  /**
   * Verifies doctor command receives quiet and verbose flags.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('parses doctor command flags', async () => {
    const handler = mock(async () => undefined);

    await runCli(['doctor', '--verbose', '--yes'], {
      doctor: handler,
    });

    expect(handler).toHaveBeenCalledWith({
      command: 'doctor',
      args: [],
      options: {
        verbose: true,
        yes: true,
      },
    });
  });

  /**
   * Verifies status command preserves dry-run and explicit mapping args.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('parses status workflow options for dry-run preview', async () => {
    const handler = mock(async () => undefined);

    await runCli(
      ['status', 'claude', 'cursor', '--dry-run', '--profile', 'company'],
      {
        status: handler,
      }
    );

    expect(handler).toHaveBeenCalledWith({
      command: 'status',
      args: ['claude', 'cursor'],
      options: {
        dryRun: true,
        profile: 'company',
      },
    });
  });

  /**
   * Verifies sync command parses source and deploy overrides.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('parses sync command sourceType and deployMode flags', async () => {
    const handler = mock(async () => undefined);

    await runCli(
      ['sync', 'claude', '--source-type', 'file', '--deploy-mode', 'copy'],
      {
        sync: handler,
      }
    );

    expect(handler).toHaveBeenCalledWith({
      command: 'sync',
      args: ['claude'],
      options: {
        sourceType: 'file',
        deployMode: 'copy',
      },
    });
  });
});
