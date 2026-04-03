import { cp, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import type { MappingConfig } from '../types';

/**
 * File manifest entry stored locally and remotely.
 *
 * @since 0.1.0
 * @category Sync
 */
export interface ManifestEntry {
  path: string;
  checksum: string;
  mtime: number;
  size: number;
  device?: string;
}

/**
 * File-mode sync result summary.
 *
 * @since 0.1.0
 * @category Sync
 */
export interface FileSyncResult {
  manifest: {
    entries: ManifestEntry[];
  };
  manifestPath: string;
}

/**
 * Recursively collects files from a root directory.
 *
 * @param {string} root - Directory to scan
 * @returns {Promise<string[]>} Absolute file paths under the directory
 * @example
 * const files = await collectFiles('/tmp/source');
 * @since 0.1.0
 * @category Sync
 */
async function collectFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(root, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Resolves the source directory for file deployment.
 *
 * @param {MappingConfig} mapping - Mapping being synchronized
 * @returns {string} Source directory path
 * @example
 * const sourceRoot = resolveSourceRoot(mapping);
 * @since 0.1.0
 * @category Sync
 */
function resolveSourceRoot(mapping: MappingConfig): string {
  return mapping.sourcePath ?? mapping.local;
}

/**
 * Applies copy deployment from source to target when needed.
 *
 * @param {MappingConfig} mapping - Mapping being synchronized
 * @returns {Promise<string>} Effective root used for manifest generation
 * @example
 * const effectiveRoot = await applyCopyDeployment(mapping);
 * @since 0.1.0
 * @category Sync
 */
async function applyCopyDeployment(mapping: MappingConfig): Promise<string> {
  const sourceRoot = resolveSourceRoot(mapping);

  if (mapping.deployMode === 'copy' && sourceRoot !== mapping.local) {
    await mkdir(mapping.local, { recursive: true });
    await cp(sourceRoot, mapping.local, { recursive: true, force: true });
    return mapping.local;
  }

  return sourceRoot;
}

/**
 * Plans File mode synchronization operations.
 *
 * @param {MappingConfig} mapping - Mapping to evaluate
 * @returns {Promise<FileSyncResult>} Planned file sync result summary
 * @example
 * await syncFileMapping(mapping);
 * @since 0.1.0
 * @category Sync
 */
export async function syncFileMapping(
  mapping: MappingConfig
): Promise<FileSyncResult> {
  const effectiveRoot = await applyCopyDeployment(mapping);
  const files = await collectFiles(effectiveRoot);
  const entries = await Promise.all(
    files.map(async (filePath) => {
      const file = Bun.file(filePath);
      const fileStats = await stat(filePath);
      const checksum = createHash('sha256')
        .update(await file.text())
        .digest('hex');

      return {
        path: relative(effectiveRoot, filePath),
        checksum,
        mtime: fileStats.mtimeMs,
        size: fileStats.size,
      } satisfies ManifestEntry;
    })
  );

  const manifest = {
    entries,
  };
  const manifestDirectory = join(mapping.local, '.ai-coding-sync');
  const manifestPath = join(manifestDirectory, `${mapping.name}-manifest.json`);
  await mkdir(manifestDirectory, { recursive: true });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  return {
    manifest,
    manifestPath,
  };
}
