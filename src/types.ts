/**
 * Supported synchronization modes.
 *
 * @since 0.1.0
 * @category Types
 */
export type SyncMode = 'auto' | 'git' | 'file' | 'link';

/**
 * Supported synchronization strategies.
 *
 * @since 0.1.0
 * @category Types
 */
export type SyncStrategy = 'two-way' | 'push-only' | 'pull-only';

/**
 * Supported conflict resolution policies.
 *
 * @since 0.1.0
 * @category Types
 */
export type ConflictPolicy = 'local' | 'remote' | 'ask' | 'backup';

/**
 * Supported credential source types.
 *
 * @since 0.1.0
 * @category Types
 */
export type AuthType = 'env' | 'file' | 'keychain' | 'prompt';

/**
 * CLI command names supported by the application.
 *
 * @since 0.1.0
 * @category Types
 */
export type CliCommandName =
  | 'init'
  | 'sync'
  | 'push'
  | 'pull'
  | 'status'
  | 'doctor'
  | 'config:get'
  | 'config:set';

/**
 * WebDAV authentication configuration.
 *
 * @since 0.1.0
 * @category Types
 */
export interface WebDavAuthConfig {
  type: AuthType;
  username?: string;
  password?: string | null;
  service?: string;
  account?: string;
  saveToKeychain?: boolean;
}

/**
 * WebDAV runtime options.
 *
 * @since 0.1.0
 * @category Types
 */
export interface WebDavOptions {
  depth: 'infinity' | '1' | '0';
  verifySsl: boolean;
  timeout: number;
  maxRetries: number;
  concurrency: number;
  caCert?: string;
}

/**
 * WebDAV configuration block.
 *
 * @since 0.1.0
 * @category Types
 */
export interface WebDavConfig {
  endpoint: string;
  auth: WebDavAuthConfig;
  remoteRoot: string;
  options: WebDavOptions;
}

/**
 * Profile configuration definition.
 *
 * @since 0.1.0
 * @category Types
 */
export interface ProfileConfig {
  inherit?: boolean;
  syncId?: string | null;
  webdav?: Partial<WebDavConfig>;
  mode?: SyncMode;
  strategy?: SyncStrategy;
  conflict?: ConflictPolicy;
  backupCount?: number;
}

/**
 * Mapping configuration definition.
 *
 * @since 0.1.0
 * @category Types
 */
export interface MappingConfig {
  name: string;
  local: string;
  remotePath: string;
  profile?: string;
  mode?: SyncMode | 'inherit';
  ignore?: string[];
  preSync?: string | null;
  postSync?: string | null;
  respectGitignore?: boolean;
  conflict?: ConflictPolicy;
}

/**
 * Hook configuration definition.
 *
 * @since 0.1.0
 * @category Types
 */
export interface HookConfig {
  'pre-sync'?: string | null;
  'post-sync'?: string | null;
  'on-conflict'?: string | null;
}

/**
 * Root application configuration file structure.
 *
 * @since 0.1.0
 * @category Types
 */
export interface AppConfig {
  version: string;
  syncId: string;
  webdav: WebDavConfig;
  profiles: Record<string, ProfileConfig>;
  mappings: MappingConfig[];
  ignoreGlobal: string[];
  hooks: HookConfig;
}

/**
 * Parsed CLI flags shared across commands.
 *
 * @since 0.1.0
 * @category Types
 */
export interface GlobalCliOptions {
  profile?: string;
  mode?: SyncMode;
  force?: boolean;
  yes?: boolean;
  dryRun?: boolean;
  noBackup?: boolean;
  noHooks?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  endpoint?: string;
  username?: string;
  remoteRoot?: string;
}
