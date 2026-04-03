import { access } from 'node:fs/promises';
import type { EffectiveMappingConfig } from '../config/load-config';
import { syncFileMapping, type FileSyncResult } from './file-sync';
import { syncGitMapping, type GitSyncResult } from './git-sync';
import { syncLinkMapping, type LinkSyncResult } from './link-sync';

/**
 * Runtime deployment result returned by the unified sync executor.
 *
 * @since 0.1.0
 * @category Sync
 */
export type DeployExecutionResult =
  | { kind: 'copy'; result: FileSyncResult }
  | { kind: 'link'; result: LinkSyncResult };

/**
 * Runtime sync execution result with resolved source semantics.
 *
 * @since 0.1.0
 * @category Sync
 */
export interface SyncExecutionResult {
  runtimeSourceType: 'git' | 'file';
  gitResult?: GitSyncResult;
  deployResult: DeployExecutionResult;
}

/**
 * Resolves the source path used at runtime.
 *
 * @param {EffectiveMappingConfig} mapping - Resolved mapping configuration
 * @returns {string} Source directory path
 * @example
 * const sourcePath = resolveSourcePath(mapping);
 * @since 0.1.0
 * @category Sync
 */
function resolveSourcePath(mapping: EffectiveMappingConfig): string {
  return mapping.sourcePath ?? mapping.local;
}

/**
 * Resolves the runtime source type, expanding auto based on .git presence.
 *
 * @param {EffectiveMappingConfig} mapping - Resolved mapping configuration
 * @returns {Promise<'git' | 'file'>} Runtime source type
 * @example
 * const sourceType = await resolveRuntimeSourceType(mapping);
 * @since 0.1.0
 * @category Sync
 */
export async function resolveRuntimeSourceType(
  mapping: EffectiveMappingConfig
): Promise<'git' | 'file'> {
  if (mapping.resolvedSourceType !== 'auto') {
    return mapping.resolvedSourceType;
  }

  try {
    await access(`${resolveSourcePath(mapping)}/.git`);
    return 'git';
  } catch {
    return 'file';
  }
}

/**
 * Executes unified sync planning and deployment for a resolved mapping.
 *
 * @param {EffectiveMappingConfig} mapping - Fully resolved mapping configuration
 * @returns {Promise<SyncExecutionResult>} Runtime execution result
 * @example
 * const result = await executeSyncPlan(mapping);
 * @since 0.1.0
 * @category Sync
 */
export async function executeSyncPlan(
  mapping: EffectiveMappingConfig
): Promise<SyncExecutionResult> {
  const runtimeSourceType = await resolveRuntimeSourceType(mapping);
  const gitResult =
    runtimeSourceType === 'git' ? await syncGitMapping(mapping) : undefined;

  if (mapping.resolvedDeployMode === 'link') {
    const result = await syncLinkMapping({
      ...mapping,
      deployMode: 'link',
    });

    return {
      runtimeSourceType,
      gitResult,
      deployResult: {
        kind: 'link',
        result,
      },
    };
  }

  const result = await syncFileMapping({
    ...mapping,
    deployMode: 'copy',
  });

  return {
    runtimeSourceType,
    gitResult,
    deployResult: {
      kind: 'copy',
      result,
    },
  };
}
