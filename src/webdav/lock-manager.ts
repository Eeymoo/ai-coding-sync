import { WebDavClient, type WebDavResource } from './client';

/**
 * Remote lock state description.
 *
 * @since 0.1.0
 * @category WebDAV
 */
export interface RemoteLock {
  lockPath: string;
  owner: string;
  expiresAt: string;
}

/**
 * Coordinates distributed lock lifecycle for remote sync operations.
 *
 * @class LockManager
 * @since 0.1.0
 * @category WebDAV
 */
export class LockManager {
  /**
   * Creates a lock manager instance.
   *
   * @param {WebDavClient} client - WebDAV client used for lock operations
   */
  public constructor(private readonly client: WebDavClient) {}

  private isExpiredLock(resource: WebDavResource): boolean {
    if (!resource.lastModified) {
      return false;
    }

    return (
      Date.now() - new Date(resource.lastModified).getTime() > 5 * 60 * 1000
    );
  }

  private async listLocks(): Promise<WebDavResource[]> {
    if (typeof this.client.list !== 'function') {
      return [];
    }

    return this.client.list('/');
  }

  /**
   * Acquires a remote lock for the given sync identity.
   *
   * @param {string} syncId - Sync identity requesting the lock
   * @returns {Promise<RemoteLock>} Acquired lock metadata
   * @example
   * const lock = await manager.acquire('macbook');
   * @since 0.1.0
   * @category WebDAV
   */
  public async acquire(syncId: string): Promise<RemoteLock> {
    const lockResources = await this.listLocks();

    for (const resource of lockResources) {
      if (
        resource.path.startsWith('.ai-sync-lock-') &&
        this.isExpiredLock(resource) &&
        typeof this.client.delete === 'function'
      ) {
        await this.client.delete(resource.path);
      }
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const lockPath = `.ai-sync-lock-${syncId}`;

    await this.client.put(
      lockPath,
      JSON.stringify({ owner: syncId, expiresAt })
    );

    return {
      lockPath,
      owner: syncId,
      expiresAt,
    };
  }

  /**
   * Starts a heartbeat loop to renew an active lock.
   *
   * @param {RemoteLock} lock - Active lock metadata
   * @returns {Promise<void>} Promise resolved when heartbeat is scheduled
   * @example
   * await manager.heartbeat(lock);
   * @since 0.1.0
   * @category WebDAV
   */
  public async heartbeat(lock: RemoteLock): Promise<void> {
    const nextExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await this.client.put(
      lock.lockPath,
      JSON.stringify({ owner: lock.owner, expiresAt: nextExpiry })
    );
  }
}
