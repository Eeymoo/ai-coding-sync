import { describe, expect, mock, test } from 'bun:test';
import { LockManager } from '../src/webdav/lock-manager';
import { WebDavClient } from '../src/webdav/client';
import type { WebDavConfig } from '../src/types';

/**
 * Tests for WebDAV client and lock helpers.
 *
 * @since 0.1.0
 * @category Tests
 */
describe('webdav support', () => {
  const config: WebDavConfig = {
    endpoint: 'https://nas.example.com/webdav',
    auth: {
      type: 'env',
      username: '${WEBDAV_USER}',
      password: '${WEBDAV_PASS}',
    },
    remoteRoot: '/ai-sync/${syncId}',
    options: {
      depth: 'infinity',
      verifySsl: true,
      timeout: 30000,
      maxRetries: 2,
      concurrency: 2,
    },
  };

  /**
   * Verifies PROPFIND responses are normalized into resources.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('lists resources via PROPFIND', async () => {
    const fetchMock = mock(
      async () =>
        new Response(
          JSON.stringify([
            {
              path: '/ai-sync/file.txt',
              etag: 'abc',
              lastModified: 'Fri, 03 Apr 2026 11:00:00 GMT',
              isDirectory: false,
            },
          ]),
          { status: 200 }
        )
    );

    const client = new WebDavClient(
      config,
      fetchMock as unknown as typeof fetch
    );

    await expect(client.list('/ai-sync')).resolves.toEqual([
      {
        path: '/ai-sync/file.txt',
        etag: 'abc',
        lastModified: 'Fri, 03 Apr 2026 11:00:00 GMT',
        isDirectory: false,
      },
    ]);
    expect(fetchMock).toHaveBeenCalled();
  });

  /**
   * Verifies uploads use PUT requests.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('uploads payloads with PUT', async () => {
    const fetchMock = mock(async () => new Response(null, { status: 201 }));
    const client = new WebDavClient(
      config,
      fetchMock as unknown as typeof fetch
    );

    await expect(
      client.put('/ai-sync/file.txt', 'hello')
    ).resolves.toBeUndefined();
    const firstCall = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(firstCall[1].method).toBe('PUT');
  });

  /**
   * Verifies lock acquisition returns lock metadata.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('acquires remote locks from lock manager', async () => {
    const client = {
      put: mock(async () => undefined),
    } as unknown as WebDavClient;
    const manager = new LockManager(client);

    const lock = await manager.acquire('device-a');

    expect(lock.owner).toBe('device-a');
    expect(lock.lockPath).toContain('.ai-sync-lock-device-a');
  });
});
