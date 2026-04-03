import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { syncFileMapping } from '../src/sync/file-sync';
import { syncGitMapping } from '../src/sync/git-sync';
import { syncLinkMapping } from '../src/sync/link-sync';
import type { MappingConfig } from '../src/types';

/**
 * Tests for advanced sync workflows.
 *
 * @since 0.1.0
 * @category Tests
 */
describe('advanced sync workflows', () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), 'ai-sync-advanced-'));
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  /**
   * Verifies File mode writes a manifest cache file.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('persists a manifest cache for file mode', async () => {
    const localPath = join(tempRoot, 'claude');
    await mkdir(localPath, { recursive: true });
    await writeFile(join(localPath, 'settings.json'), '{"a":1}', 'utf8');

    const result = await syncFileMapping({
      name: 'claude',
      local: localPath,
      remotePath: 'claude/v1',
    });

    const manifestContent = await readFile(result.manifestPath, 'utf8');
    expect(JSON.parse(manifestContent).entries).toHaveLength(1);
  });

  /**
   * Verifies Git mode reports dirty state.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('reports dirty git repositories', async () => {
    const localPath = join(tempRoot, 'repo');
    await mkdir(join(localPath, '.git'), { recursive: true });
    await writeFile(join(localPath, '.git', 'DIRTY'), '1', 'utf8');

    const result = await syncGitMapping({
      name: 'claude',
      local: localPath,
      remotePath: 'claude/v1',
    });

    expect(result.isDirty).toBe(true);
  });

  /**
   * Verifies Link mode can materialize a target symlink.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('creates a symlink when applying link mode plan', async () => {
    const localPath = join(tempRoot, 'cursor-link');
    const cacheRoot = join(tempRoot, 'cache');
    await mkdir(cacheRoot, { recursive: true });

    const result = await syncLinkMapping({
      name: 'cursor',
      local: localPath,
      remotePath: 'cursor/v1',
      preSync: cacheRoot,
    } as MappingConfig);

    expect(result.applied).toBe(true);
  });
});
