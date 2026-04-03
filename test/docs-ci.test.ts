import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const root = join(testDirectory, '..');

/**
 * Tests for documentation publishing configuration.
 *
 * @since 0.1.0
 * @category Tests
 */
describe('documentation publishing setup', () => {
  /**
   * Verifies a GitHub Actions workflow publishes generated TypeDoc output.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('publishes docs directory directly to GitHub Pages', () => {
    const workflowPath = join(root, '.github', 'workflows', 'publish-docs.yml');
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain('Deploy docs to GitHub Pages');
    expect(workflow).toContain('bun run check');
    expect(workflow).toContain('bun run docs');
    expect(workflow).toContain('path: docs');
    expect(workflow).not.toContain('docs-site');
  });

  /**
   * Verifies package scripts expose direct TypeDoc generation commands.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('keeps direct docs scripts without docs-site packaging helpers', () => {
    const packageJson = JSON.parse(
      readFileSync(join(root, 'package.json'), 'utf8')
    ) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts.docs).toBe('typedoc');
    expect(packageJson.scripts['docs:check']).toContain('typedoc --json');
    expect(packageJson.scripts['docs:site']).toBeUndefined();
    expect(packageJson.scripts['docs:metrics']).toBeUndefined();
  });
});
