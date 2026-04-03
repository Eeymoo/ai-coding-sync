import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readlink, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  executeSyncPlan,
  resolveRuntimeSourceType,
} from '../src/sync/execute-sync';
import type { EffectiveMappingConfig } from '../src/config/load-config';

/**
 * Tests for productized sync execution flow.
 *
 * @since 0.1.0
 * @category Tests
 */
describe('productized sync execution', () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), 'ai-sync-product-'));
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  /**
   * Verifies auto source detection resolves git repositories.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('resolves auto sourceType to git when source contains .git', async () => {
    const sourcePath = join(tempRoot, '.ai-coding-sync', 'claude');
    await mkdir(join(sourcePath, '.git'), { recursive: true });

    await expect(
      resolveRuntimeSourceType({
        name: 'claude',
        local: join(tempRoot, 'targets', 'claude'),
        remotePath: '/configs/claude',
        sourcePath,
        resolvedProfile: 'default',
        resolvedSyncId: 'device-a',
        resolvedSourceType: 'auto',
        resolvedDeployMode: 'copy',
        resolvedConflict: 'ask',
      })
    ).resolves.toBe('git');
  });

  /**
   * Verifies auto source detection resolves plain file sources.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('resolves auto sourceType to file when source is not a git repository', async () => {
    const sourcePath = join(tempRoot, '.ai-coding-sync', 'cursor');
    await mkdir(sourcePath, { recursive: true });

    await expect(
      resolveRuntimeSourceType({
        name: 'cursor',
        local: join(tempRoot, 'targets', 'cursor'),
        remotePath: '/configs/cursor',
        sourcePath,
        resolvedProfile: 'default',
        resolvedSyncId: 'device-a',
        resolvedSourceType: 'auto',
        resolvedDeployMode: 'copy',
        resolvedConflict: 'ask',
      })
    ).resolves.toBe('file');
  });

  /**
   * Verifies the unified executor applies copy deployment.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('executes copy deployment through unified sync executor', async () => {
    const sourcePath = join(tempRoot, '.ai-coding-sync', 'claude');
    const targetPath = join(tempRoot, 'targets', 'claude');
    await mkdir(sourcePath, { recursive: true });
    await writeFile(
      join(sourcePath, 'settings.json'),
      '{"theme":"dark"}',
      'utf8'
    );

    const result = await executeSyncPlan({
      name: 'claude',
      local: targetPath,
      remotePath: '/configs/claude',
      sourcePath,
      resolvedProfile: 'default',
      resolvedSyncId: 'device-a',
      resolvedSourceType: 'auto',
      resolvedDeployMode: 'copy',
      resolvedConflict: 'ask',
    } satisfies EffectiveMappingConfig);

    expect(result.runtimeSourceType).toBe('file');
    expect(result.deployResult.kind).toBe('copy');
    expect(await Bun.file(join(targetPath, 'settings.json')).text()).toContain(
      'dark'
    );
  });

  /**
   * Verifies the unified executor applies link deployment.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('executes link deployment through unified sync executor', async () => {
    const sourcePath = join(tempRoot, '.ai-coding-sync', 'cursor');
    const targetPath = join(tempRoot, 'targets', 'cursor');
    await mkdir(sourcePath, { recursive: true });

    const result = await executeSyncPlan({
      name: 'cursor',
      local: targetPath,
      remotePath: '/configs/cursor',
      sourcePath,
      resolvedProfile: 'default',
      resolvedSyncId: 'device-a',
      resolvedSourceType: 'file',
      resolvedDeployMode: 'link',
      resolvedConflict: 'ask',
    } satisfies EffectiveMappingConfig);

    expect(result.runtimeSourceType).toBe('file');
    expect(result.deployResult.kind).toBe('link');
    expect(await readlink(targetPath)).toBe(sourcePath);
  });
});
