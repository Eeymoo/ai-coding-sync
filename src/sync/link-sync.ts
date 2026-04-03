import { mkdir, rm, symlink } from 'node:fs/promises';
import { dirname } from 'node:path';
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
 * Resolves the source directory for link deployment.
 *
 * @param {MappingConfig} mapping - Mapping being synchronized
 * @returns {string} Source directory path
 * @example
 * const root = resolveLinkSourceRoot(mapping);
 * @since 0.1.0
 * @category Sync
 */
function resolveLinkSourceRoot(mapping: MappingConfig): string {
  return mapping.sourcePath ?? mapping.local;
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
  const sourceRoot = resolveLinkSourceRoot(mapping);

  await mkdir(sourceRoot, { recursive: true });
  await mkdir(dirname(mapping.local), { recursive: true });
  await rm(mapping.local, { recursive: true, force: true });
  await symlink(sourceRoot, mapping.local, 'dir');

  return {
    cachePath: sourceRoot,
    linkPath: mapping.local,
    applied: true,
  };
}
