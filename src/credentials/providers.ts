import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { AppError } from '../utils/errors';
import type { AppConfig } from '../types';
import { expandUserPath } from '../utils/path-utils';

/**
 * Resolved credentials for WebDAV authentication.
 *
 * @since 0.1.0
 * @category Credentials
 */
export interface ResolvedCredentials {
  username: string;
  password: string;
}

/**
 * Dependency overrides for credential providers.
 *
 * @since 0.1.0
 * @category Credentials
 */
export interface CredentialProviderDeps {
  runKeychainCommand?: (service?: string, account?: string) => Promise<string>;
}

function resolveEnvReference(
  value: string | undefined | null
): string | undefined {
  if (!value) {
    return undefined;
  }

  const envMatch = value.match(/^\$\{([^}]+)\}$/);

  if (!envMatch) {
    return value;
  }

  return process.env[envMatch[1]];
}

async function readCredentialFile(): Promise<ResolvedCredentials> {
  const homeDirectory = process.env.HOME ?? process.env.USERPROFILE;

  if (!homeDirectory) {
    throw new AppError(
      'E_CREDENTIAL_NOT_FOUND',
      'Unable to determine home directory.',
      2
    );
  }

  const credentialsPath = join(
    expandUserPath(homeDirectory),
    '.config',
    'ai-coding-sync',
    '.credentials'
  );
  const fileStat = await stat(credentialsPath);
  const mode = fileStat.mode & 0o777;

  if (mode !== 0o600) {
    throw new AppError(
      'E_CREDENTIAL_NOT_FOUND',
      'E_CREDENTIAL_PERMISSION: credentials file must use 0600 permissions.',
      2
    );
  }

  const content = await readFile(credentialsPath, 'utf8');
  const lines = Object.fromEntries(
    content
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const [key, ...rest] = line.split(':');
        return [key.trim(), rest.join(':').trim()];
      })
  );

  return {
    username: lines.username,
    password: lines.password,
  };
}

function parseKeychainCredentials(payload: string): ResolvedCredentials {
  const [username, ...passwordParts] = payload.trim().split(':');
  return {
    username,
    password: passwordParts.join(':'),
  };
}

/**
 * Resolves credentials from the configured authentication source.
 *
 * @param {AppConfig} config - Root application config containing auth strategy
 * @param {CredentialProviderDeps} deps - Dependency overrides for provider side effects
 * @returns {Promise<ResolvedCredentials>} Resolved username and password
 * @example
 * const credentials = await resolveCredentials(config);
 * @since 0.1.0
 * @category Credentials
 */
export async function resolveCredentials(
  config: AppConfig,
  deps: CredentialProviderDeps = {}
): Promise<ResolvedCredentials> {
  const auth = config.webdav.auth;

  switch (auth.type) {
    case 'env': {
      const username = resolveEnvReference(auth.username);
      const password = resolveEnvReference(auth.password);

      if (!username || !password) {
        throw new AppError(
          'E_CREDENTIAL_NOT_FOUND',
          'Missing env credentials for WebDAV authentication.',
          2
        );
      }

      return { username, password };
    }
    case 'file': {
      return readCredentialFile();
    }
    case 'keychain': {
      if (!deps.runKeychainCommand) {
        throw new AppError(
          'E_CREDENTIAL_NOT_FOUND',
          'Keychain integration is not implemented yet.',
          2
        );
      }

      const payload = await deps.runKeychainCommand(auth.service, auth.account);
      return parseKeychainCredentials(payload);
    }
    case 'prompt': {
      const username = globalThis.prompt?.('WebDAV username') ?? undefined;
      const password = globalThis.prompt?.('WebDAV password') ?? undefined;

      if (!username || !password) {
        throw new AppError(
          'E_CREDENTIAL_NOT_FOUND',
          'Prompt credentials were not provided.',
          2
        );
      }

      return { username, password };
    }
  }
}
