import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
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
  const files = await collectFiles(mapping.local);
  const entries = await Promise.all(
    files.map(async (filePath) => {
      const file = Bun.file(filePath);
      const fileStats = await stat(filePath);
      const checksum = createHash('sha256')
        .update(await file.text())
        .digest('hex');

      return {
        path: relative(mapping.local, filePath),
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
