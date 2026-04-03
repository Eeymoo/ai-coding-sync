import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
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
  test('persists a manifest cache for copied source files', async () => {
    const sourcePath = join(tempRoot, '.ai-coding-sync', 'claude');
    const targetPath = join(tempRoot, 'targets', 'claude');
    await mkdir(sourcePath, { recursive: true });
    await writeFile(join(sourcePath, 'settings.json'), '{"a":1}', 'utf8');

    const result = await syncFileMapping({
      name: 'claude',
      local: targetPath,
      remotePath: 'claude/v1',
      sourcePath,
      deployMode: 'copy',
    } as MappingConfig);

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
  test('reports dirty git repositories from source path', async () => {
    const sourcePath = join(tempRoot, '.ai-coding-sync', 'repo');
    const targetPath = join(tempRoot, 'targets', 'repo');
    await mkdir(join(sourcePath, '.git'), { recursive: true });
    await writeFile(join(sourcePath, '.git', 'DIRTY'), '1', 'utf8');

    const result = await syncGitMapping({
      name: 'claude',
      local: targetPath,
      remotePath: 'claude/v1',
      sourcePath,
    } as MappingConfig);

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
  test('creates a real symbolic link for link deploy mode', async () => {
    const sourcePath = join(tempRoot, '.ai-coding-sync', 'cursor');
    const targetPath = join(tempRoot, 'targets', 'cursor-link');
    await mkdir(sourcePath, { recursive: true });

    const result = await syncLinkMapping({
      name: 'cursor',
      local: targetPath,
      remotePath: 'cursor/v1',
      sourcePath,
      deployMode: 'link',
    } as MappingConfig);

    expect(result.applied).toBe(true);
    expect((await lstat(targetPath)).isSymbolicLink()).toBe(true);
  });
});
