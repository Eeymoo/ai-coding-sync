import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
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
   * Verifies the docs site landing page exists.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('creates a docs index page for published reports', () => {
    const docsIndexPath = join(root, 'docs-site', 'index.html');

    expect(existsSync(docsIndexPath)).toBe(true);
    expect(readFileSync(docsIndexPath, 'utf8')).toContain(
      'AI-Coding-Sync Documentation'
    );
  });

  /**
   * Verifies a GitHub Actions workflow publishes documentation artifacts.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('creates a docs publish workflow', () => {
    const workflowPath = join(root, '.github', 'workflows', 'publish-docs.yml');
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain('Deploy docs to GitHub Pages');
    expect(workflow).toContain('bun test --coverage');
    expect(workflow).toContain('actions/deploy-pages');
  });

  /**
   * Verifies package scripts expose docs site generation.
   *
   * @returns {void} No return value
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('adds scripts for docs site generation', () => {
    const packageJson = JSON.parse(
      readFileSync(join(root, 'package.json'), 'utf8')
    ) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts['docs:site']).toBeDefined();
    expect(packageJson.scripts['docs:metrics']).toBeDefined();
  });
});
