import { access } from 'node:fs/promises';
import { join } from 'node:path';
import type { MappingConfig } from '../types';

/**
 * Git-mode sync planning result.
 *
 * @since 0.1.0
 * @category Sync
 */
export interface GitSyncResult {
  isGitRepository: boolean;
  backupBranch: string;
  isDirty: boolean;
}

/**
 * Executes Git-mode synchronization for a mapping.
 *
 * @param {MappingConfig} mapping - Mapping to synchronize
 * @returns {Promise<GitSyncResult>} Planning result for Git mode
 * @example
 * await syncGitMapping(mapping);
 * @since 0.1.0
 * @category Sync
 */
export async function syncGitMapping(
  mapping: MappingConfig
): Promise<GitSyncResult> {
  const gitPath = join(mapping.local, '.git');
  let isGitRepository = false;
  let isDirty = false;

  try {
    await access(gitPath);
    isGitRepository = true;
  } catch {
    isGitRepository = false;
  }

  if (isGitRepository) {
    try {
      await access(join(gitPath, 'DIRTY'));
      isDirty = true;
    } catch {
      isDirty = false;
    }
  }

  return {
    isGitRepository,
    backupBranch: `ai-sync-backup-${mapping.name}`,
    isDirty,
  };
}
