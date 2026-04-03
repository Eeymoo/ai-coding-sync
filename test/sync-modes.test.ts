import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { syncFileMapping } from '../src/sync/file-sync';
import { syncGitMapping } from '../src/sync/git-sync';
import { syncLinkMapping } from '../src/sync/link-sync';
import type { MappingConfig } from '../src/types';

/**
 * Tests for sync mode helpers.
 *
 * @since 0.1.0
 * @category Tests
 */
describe('sync mode helpers', () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), 'ai-sync-modes-'));
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  /**
   * Verifies File mode creates and persists a manifest.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('builds a file manifest from local files', async () => {
    const localPath = join(tempRoot, 'claude');
    await mkdir(localPath, { recursive: true });
    await writeFile(join(localPath, 'settings.json'), '{"a":1}', 'utf8');

    const result = await syncFileMapping({
      name: 'claude',
      local: localPath,
      remotePath: 'claude/v1',
    });

    expect(result.manifest.entries).toHaveLength(1);
    expect(result.manifest.entries[0]?.path).toBe('settings.json');
  });

  /**
   * Verifies Git mode reports repository state.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('evaluates git repository status', async () => {
    const localPath = join(tempRoot, 'repo');
    await mkdir(join(localPath, '.git'), { recursive: true });

    const result = await syncGitMapping({
      name: 'claude',
      local: localPath,
      remotePath: 'claude/v1',
    });

    expect(result.isGitRepository).toBe(true);
    expect(result.backupBranch).toContain('ai-sync-backup');
  });

  /**
   * Verifies Link mode creates a symlink application plan.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('builds link mode cache and symlink plan', async () => {
    const localPath = join(tempRoot, 'cursor');
    const cacheRoot = join(tempRoot, 'cache');
    await mkdir(localPath, { recursive: true });

    const result = await syncLinkMapping({
      name: 'cursor',
      local: localPath,
      remotePath: 'cursor/v1',
      preSync: cacheRoot,
    } as MappingConfig);

    expect(result.cachePath).toContain('cursor');
    expect(result.linkPath).toBe(localPath);
  });
});
