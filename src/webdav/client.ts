import type { WebDavConfig } from '../types';

/**
 * Metadata describing a remote WebDAV resource.
 *
 * @since 0.1.0
 * @category WebDAV
 */
export interface WebDavResource {
  path: string;
  etag?: string;
  lastModified?: string;
  isDirectory: boolean;
}

/**
 * WebDAV client abstraction used by sync modes.
 *
 * @class WebDavClient
 * @since 0.1.0
 * @category WebDAV
 */
export class WebDavClient {
  /**
   * Creates a WebDAV client instance.
   *
   * @param {WebDavConfig} config - Effective WebDAV configuration
   * @param {typeof fetch} fetcher - Fetch implementation used for HTTP requests
   */
  public constructor(
    private readonly config: WebDavConfig,
    private readonly fetcher: typeof fetch = fetch
  ) {}

  private buildUrl(remotePath: string): string {
    const normalizedPath = remotePath.startsWith('/')
      ? remotePath
      : `/${remotePath}`;
    const baseUrl = new URL(this.config.endpoint);
    return new URL(normalizedPath, `${baseUrl.origin}/`).toString();
  }

  private async requestWithRetry(
    remotePath: string,
    init: RequestInit,
    attempt = 0
  ): Promise<Response> {
    const response = await this.fetcher(this.buildUrl(remotePath), init);

    if (
      response.ok ||
      attempt >= this.config.options.maxRetries ||
      ![429, 503].includes(response.status)
    ) {
      return response;
    }

    return this.requestWithRetry(remotePath, init, attempt + 1);
  }

  /**
   * Lists remote resources under a path.
   *
   * @param {string} remotePath - Remote path to query
   * @returns {Promise<WebDavResource[]>} Remote resources returned by PROPFIND
   * @example
   * const entries = await client.list('/ai-sync');
   * @since 0.1.0
   * @category WebDAV
   */
  public async list(remotePath: string): Promise<WebDavResource[]> {
    const response = await this.requestWithRetry(remotePath, {
      method: 'PROPFIND',
      headers: {
        Depth: this.config.options.depth,
      },
    });

    if (!response.ok) {
      throw new Error(`PROPFIND failed with status ${response.status}`);
    }

    return (await response.json()) as WebDavResource[];
  }

  /**
   * Uploads a local payload to a remote path.
   *
   * @param {string} remotePath - Destination path on the WebDAV server
   * @param {Blob | ArrayBuffer | string} body - Payload to upload
   * @returns {Promise<void>} Promise resolved when upload completes
   * @example
   * await client.put('/ai-sync/file.txt', 'content');
   * @since 0.1.0
   * @category WebDAV
   */
  public async put(
    remotePath: string,
    body: Blob | ArrayBuffer | string
  ): Promise<void> {
    const response = await this.requestWithRetry(remotePath, {
      method: 'PUT',
      body,
    });

    if (!response.ok) {
      throw new Error(`PUT failed with status ${response.status}`);
    }
  }

  /**
   * Deletes a remote resource path.
   *
   * @param {string} remotePath - Remote path to delete
   * @returns {Promise<void>} Promise resolved when deletion completes
   * @example
   * await client.delete('/ai-sync/lock');
   * @since 0.1.0
   * @category WebDAV
   */
  public async delete(remotePath: string): Promise<void> {
    const response = await this.requestWithRetry(remotePath, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`DELETE failed with status ${response.status}`);
    }
  }
}
