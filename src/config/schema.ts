import { z } from 'zod';

const sourceTypeSchema = z.enum(['auto', 'git', 'file']);
const deployModeSchema = z.enum(['link', 'copy']);
const mappingSourceTypeSchema = z.enum(['inherit', 'auto', 'git', 'file']);
const mappingDeployModeSchema = z.enum(['inherit', 'link', 'copy']);
const strategySchema = z.enum(['two-way', 'push-only', 'pull-only']);
const conflictPolicySchema = z.enum(['local', 'remote', 'ask', 'backup']);

/**
 * Configuration schema for authentication settings.
 *
 * @since 0.1.0
 * @category Config
 */
export const webDavAuthSchema = z.object({
  type: z.enum(['env', 'file', 'keychain', 'prompt']),
  username: z.string().min(1).optional(),
  password: z.string().min(1).nullable().optional(),
  service: z.string().min(1).optional(),
  account: z.string().min(1).optional(),
  saveToKeychain: z.boolean().optional(),
});

const webDavOptionsSchema = z.object({
  depth: z.enum(['infinity', '1', '0']),
  verifySsl: z.boolean(),
  timeout: z.number().int().positive(),
  maxRetries: z.number().int().nonnegative(),
  concurrency: z.number().int().positive(),
  caCert: z.string().min(1).optional(),
});

const webDavConfigSchema = z.object({
  endpoint: z.string().url(),
  auth: webDavAuthSchema,
  remoteRoot: z.string().min(1),
  options: webDavOptionsSchema,
});

const profileConfigSchema = z
  .object({
    inherit: z.boolean().optional(),
    syncId: z.string().min(1).nullable().optional(),
    webdav: webDavConfigSchema.partial().optional(),
    sourceType: sourceTypeSchema.optional(),
    deployMode: deployModeSchema.optional(),
    strategy: strategySchema.optional(),
    conflict: conflictPolicySchema.optional(),
    backupCount: z.number().int().nonnegative().optional(),
  })
  .strict();

const mappingConfigSchema = z
  .object({
    name: z.string().min(1),
    local: z.string().min(1),
    remotePath: z.string().min(1),
    sourcePath: z.string().min(1).optional(),
    profile: z.string().min(1).optional(),
    sourceType: mappingSourceTypeSchema.optional(),
    deployMode: mappingDeployModeSchema.optional(),
    ignore: z.array(z.string().min(1)).optional(),
    preSync: z.string().min(1).nullable().optional(),
    postSync: z.string().min(1).nullable().optional(),
    respectGitignore: z.boolean().optional(),
    conflict: conflictPolicySchema.optional(),
  })
  .strict();

const hooksSchema = z
  .object({
    'pre-sync': z.string().min(1).nullable().optional(),
    'post-sync': z.string().min(1).nullable().optional(),
    'on-conflict': z.string().min(1).nullable().optional(),
  })
  .strict();

/**
 * Root configuration schema for the application.
 *
 * @since 0.1.0
 * @category Config
 */
export const appConfigSchema = z.object({
  version: z.string().min(1),
  syncId: z.string().min(1),
  webdav: webDavConfigSchema,
  profiles: z.record(z.string().min(1), profileConfigSchema),
  mappings: z.array(mappingConfigSchema),
  ignoreGlobal: z.array(z.string().min(1)),
  hooks: hooksSchema,
});
