import { describe, expect, test } from 'bun:test';

/**
 * Smoke tests for initial project skeleton.
 *
 * @since 0.1.0
 * @category Tests
 */
describe('project skeleton', () => {
  /**
   * Verifies the test runner works.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('runs basic assertion', () => {
    expect(1 + 1).toBe(2);
  });
});
