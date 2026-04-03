import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { appConfigSchema } from './schema';
import type {
  AppConfig,
  GlobalCliOptions,
  DeployMode,
  MappingConfig,
  ProfileConfig,
  SourceType,
} from '../types';
import { expandUserPath } from '../utils/path-utils';

/**
 * Effective mapping configuration after inheritance resolution.
 *
 * @since 0.1.0
 * @category Config
 */
export interface EffectiveMappingConfig extends MappingConfig {
  resolvedProfile: string;
  resolvedSyncId: string;
  resolvedSourceType: SourceType;
  resolvedDeployMode: DeployMode;
  resolvedConflict: NonNullable<ProfileConfig['conflict']>;
}

const FALLBACK_CONFLICT = 'ask';

/**
 * Loads and validates the root application configuration.
 *
 * @returns {Promise<AppConfig>} Parsed application configuration
 * @example
 * const config = await loadConfig();
 * @since 0.1.0
 * @category Config
 */
export async function loadConfig(): Promise<AppConfig> {
  const homeDirectory = process.env.HOME ?? process.env.USERPROFILE;

  if (!homeDirectory) {
    throw new Error('Unable to determine home directory for config loading.');
  }

  const configPath = join(
    expandUserPath(homeDirectory),
    '.config',
    'ai-coding-sync',
    'config.json'
  );
  const rawConfig = await readFile(configPath, 'utf8');
  const parsedConfig = JSON.parse(rawConfig);

  return appConfigSchema.parse(parsedConfig) as AppConfig;
}

/**
 * Resolves the effective profile configuration for a given profile name.
 *
 * @param {AppConfig} config - Root application config
 * @param {string} profileName - Profile name to resolve
 * @returns {ProfileConfig} Effective profile configuration
 * @example
 * const profile = resolveProfile(config, 'default');
 * @since 0.1.0
 * @category Config
 */
export function resolveProfile(
  config: AppConfig,
  profileName: string
): ProfileConfig {
  const defaultProfile = config.profiles.default ?? {};
  const requestedProfile = config.profiles[profileName] ?? {};

  if (profileName === 'default' || requestedProfile.inherit === false) {
    return { ...requestedProfile };
  }

  return {
    ...defaultProfile,
    ...requestedProfile,
  };
}

/**
 * Resolves the effective source type for a mapping.
 *
 * @param {SourceType | 'inherit' | undefined} sourceType - Requested source type
 * @returns {SourceType} Effective source type
 * @example
 * const sourceType = resolveSourceType('inherit');
 * @since 0.1.0
 * @category Config
 */
function resolveSourceType(
  sourceType: SourceType | 'inherit' | undefined
): SourceType {
  if (!sourceType || sourceType === 'inherit') {
    return 'auto';
  }

  return sourceType;
}

/**
 * Resolves the effective deploy mode for a mapping.
 *
 * @param {DeployMode | 'inherit' | undefined} deployMode - Requested deployment mode
 * @returns {DeployMode} Effective deployment mode
 * @example
 * const mode = resolveDeployMode('inherit');
 * @since 0.1.0
 * @category Config
 */
function resolveDeployMode(
  deployMode: DeployMode | 'inherit' | undefined
): DeployMode {
  if (!deployMode || deployMode === 'inherit') {
    return 'copy';
  }

  return deployMode;
}

/**
 * Resolves the effective mapping configuration with profile and CLI overrides.
 *
 * @param {AppConfig} config - Root application config
 * @param {MappingConfig} mapping - Mapping definition to resolve
 * @param {GlobalCliOptions} options - Global CLI overrides
 * @returns {EffectiveMappingConfig} Fully resolved mapping configuration
 * @example
 * const effective = resolveMapping(config, mapping, { profile: 'default' });
 * @since 0.1.0
 * @category Config
 */
export function resolveMapping(
  config: AppConfig,
  mapping: MappingConfig,
  options: GlobalCliOptions
): EffectiveMappingConfig {
  const resolvedProfileName = options.profile ?? mapping.profile ?? 'default';
  const profile = resolveProfile(config, resolvedProfileName);
  const effectiveSourceType = resolveSourceType(
    options.sourceType ?? mapping.sourceType ?? profile.sourceType
  );
  const effectiveDeployMode = resolveDeployMode(
    options.deployMode ?? mapping.deployMode ?? profile.deployMode
  );

  return {
    ...mapping,
    resolvedProfile: resolvedProfileName,
    resolvedSyncId: profile.syncId ?? config.syncId,
    resolvedSourceType: effectiveSourceType,
    resolvedDeployMode: effectiveDeployMode,
    resolvedConflict: mapping.conflict ?? profile.conflict ?? FALLBACK_CONFLICT,
  };
}
