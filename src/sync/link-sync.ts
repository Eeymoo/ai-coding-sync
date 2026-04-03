import { mkdir, symlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { MappingConfig } from '../types';

/**
 * Link-mode sync planning result.
 *
 * @since 0.1.0
 * @category Sync
 */
export interface LinkSyncResult {
  cachePath: string;
  linkPath: string;
  applied: boolean;
}

/**
 * Executes Link-mode synchronization for a mapping.
 *
 * @param {MappingConfig} mapping - Mapping to synchronize
 * @returns {Promise<LinkSyncResult>} Link-mode planning result
 * @example
 * await syncLinkMapping(mapping);
 * @since 0.1.0
 * @category Sync
 */
export async function syncLinkMapping(
  mapping: MappingConfig
): Promise<LinkSyncResult> {
  const cacheRoot = mapping.preSync ?? '~/.config/ai-coding-sync/cache/links';
  const cachePath = join(cacheRoot, mapping.name);

  await mkdir(cachePath, { recursive: true });
  await mkdir(dirname(mapping.local), { recursive: true });

  try {
    await symlink(cachePath, mapping.local, 'dir');
  } catch {
    // Link may already exist or platform may reject duplicate creation in repeated runs.
  }

  return {
    cachePath,
    linkPath: mapping.local,
    applied: true,
  };
}
