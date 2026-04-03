import { describe, expect, mock, test } from 'bun:test';
import { LockManager } from '../src/webdav/lock-manager';
import { WebDavClient } from '../src/webdav/client';
import type { WebDavConfig } from '../src/types';

/**
 * Tests for advanced WebDAV behavior.
 *
 * @since 0.1.0
 * @category Tests
 */
describe('advanced webdav workflows', () => {
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
      maxRetries: 3,
      concurrency: 2,
    },
  };

  /**
   * Verifies transient PUT failures are retried.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('retries transient upload failures', async () => {
    const fetchMock = mock()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 201 }));
    const client = new WebDavClient(
      config,
      fetchMock as unknown as typeof fetch
    );

    await expect(
      client.put('/nested/file.txt', 'hello')
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  /**
   * Verifies remote paths normalize against the configured endpoint.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('normalizes remote urls for requests', async () => {
    const fetchMock = mock(
      async () => new Response(JSON.stringify([]), { status: 200 })
    );
    const client = new WebDavClient(
      config,
      fetchMock as unknown as typeof fetch
    );

    await client.list('nested/dir');

    const firstCall = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(firstCall[0]).toBe('https://nas.example.com/nested/dir');
  });

  /**
   * Verifies stale locks can be reclaimed.
   *
   * @returns {Promise<void>} Promise resolved when assertion completes
   * @example
   * // Executed by Bun test
   * @since 0.1.0
   * @category Tests
   */
  test('reclaims expired locks before acquiring a new one', async () => {
    const client = {
      list: mock(async () => [
        {
          path: '.ai-sync-lock-device-a',
          isDirectory: false,
          lastModified: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        },
      ]),
      put: mock(async () => undefined),
      delete: mock(async () => undefined),
    } as unknown as WebDavClient;
    const manager = new LockManager(client);

    const lock = await manager.acquire('device-b');

    expect(lock.owner).toBe('device-b');
    expect(
      (client as unknown as { delete: ReturnType<typeof mock> }).delete
    ).toHaveBeenCalled();
  });
});
