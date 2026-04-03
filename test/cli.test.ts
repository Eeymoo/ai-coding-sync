import { describe, expect, mock, test } from 'bun:test';
import { runCli } from '../src/cli/run-cli';

/**
 * Tests for CLI routing behavior.
 *
 * @since 0.1.0
 * @category Tests
 */
describe('cli routing', () => {
  /**
   * Verifies the status command is parsed and dispatched.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('parses status command with source and deploy options', async () => {
    const handler = mock(async () => undefined);

    await runCli(
      [
        'status',
        'claude',
        '--profile',
        'company',
        '--source-type',
        'git',
        '--deploy-mode',
        'link',
        '--dry-run',
      ],
      {
        status: handler,
      }
    );

    expect(handler).toHaveBeenCalledWith({
      command: 'status',
      args: ['claude'],
      options: {
        profile: 'company',
        sourceType: 'git',
        deployMode: 'link',
        dryRun: true,
      },
    });
  });

  /**
   * Verifies config get command is normalized.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('normalizes config get subcommand', async () => {
    const handler = mock(async () => undefined);

    await runCli(['config', 'get', 'profiles.default.sourceType'], {
      'config:get': handler,
    });

    expect(handler).toHaveBeenCalledWith({
      command: 'config:get',
      args: ['profiles.default.sourceType'],
      options: {},
    });
  });
});
