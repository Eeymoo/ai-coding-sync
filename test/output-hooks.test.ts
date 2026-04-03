import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from 'bun:test';
import { runHook } from '../src/hooks/run-hook';
import { renderProgress } from '../src/output/progress';

/**
 * Tests for progress output and hook execution.
 *
 * @since 0.1.0
 * @category Tests
 */
describe('output and hooks', () => {
  let stdoutSpy: ReturnType<typeof spyOn>;
  let originalIsTTY: boolean;

  beforeEach(() => {
    stdoutSpy = spyOn(console, 'log').mockImplementation(() => undefined);
    originalIsTTY = process.stdout.isTTY;
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    process.stdout.isTTY = originalIsTTY;
  });

  /**
   * Verifies TTY progress output renders a readable line.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('renders tty progress output', () => {
    process.stdout.isTTY = true;

    renderProgress('claude', { current: 1, total: 4, file: 'settings.json' });

    expect(stdoutSpy).toHaveBeenCalledWith(
      'Syncing claude... [1/4] settings.json (25%)'
    );
  });

  /**
   * Verifies non-TTY output uses JSON lines.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('renders json progress output outside tty', () => {
    process.stdout.isTTY = false;

    renderProgress('claude', { current: 2, total: 4, file: 'settings.json' });

    expect(stdoutSpy).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'progress',
        mapping: 'claude',
        current: 2,
        total: 4,
        file: 'settings.json',
      })
    );
  });

  /**
   * Verifies hooks execute a configured command.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('runs lifecycle hook commands', async () => {
    const spawnMock = mock(() => ({ exited: Promise.resolve(0) }));

    await expect(
      runHook(
        'pre-sync',
        { mapping: 'claude' },
        'echo test',
        spawnMock as never
      )
    ).resolves.toBeUndefined();
    expect(spawnMock).toHaveBeenCalled();
  });
});
