import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  lstat,
  mkdir,
  mkdtemp,
  readlink,
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
  test('copies source files into target directory for copy deploy mode', async () => {
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

    expect(result.manifest.entries).toHaveLength(1);
    expect(result.manifest.entries[0]?.path).toBe('settings.json');
    expect(Bun.file(join(targetPath, 'settings.json'))).toBeDefined();
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
  test('evaluates git repository status from source directory', async () => {
    const sourcePath = join(tempRoot, '.ai-coding-sync', 'repo');
    const targetPath = join(tempRoot, 'targets', 'repo');
    await mkdir(join(sourcePath, '.git'), { recursive: true });

    const result = await syncGitMapping({
      name: 'claude',
      local: targetPath,
      remotePath: 'claude/v1',
      sourcePath,
    } as MappingConfig);

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
  test('creates a symlink from target to source for link deploy mode', async () => {
    const sourcePath = join(tempRoot, '.ai-coding-sync', 'cursor');
    const targetPath = join(tempRoot, 'targets', 'cursor');
    await mkdir(sourcePath, { recursive: true });

    const result = await syncLinkMapping({
      name: 'cursor',
      local: targetPath,
      remotePath: 'cursor/v1',
      sourcePath,
      deployMode: 'link',
    } as MappingConfig);

    const stats = await lstat(targetPath);
    expect(stats.isSymbolicLink()).toBe(true);
    expect(await readlink(targetPath)).toBe(sourcePath);
    expect(result.linkPath).toBe(targetPath);
  });
});
