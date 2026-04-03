/**
 * Supported lifecycle hooks.
 *
 * @since 0.1.0
 * @category Hooks
 */
export type HookName = 'pre-sync' | 'post-sync' | 'on-conflict';

export type SpawnLike = (options: {
  cmd: string[];
  env: Record<string, string | undefined>;
  stdout: 'inherit';
  stderr: 'inherit';
}) => {
  exited: Promise<number>;
};

/**
 * Runs a configured lifecycle hook.
 *
 * @param {HookName} hookName - Hook to execute
 * @param {Record<string, string>} env - Hook environment payload
 * @param {string | null} command - Command string to execute
 * @param {SpawnLike} spawnFn - Spawn implementation used to launch the hook
 * @returns {Promise<void>} Promise resolved when hook exits successfully
 * @example
 * await runHook('pre-sync', { mapping: 'claude' }, 'echo ok');
 * @since 0.1.0
 * @category Hooks
 */
export async function runHook(
  hookName: HookName,
  env: Record<string, string>,
  command: string | null = null,
  spawnFn: SpawnLike = Bun.spawn
): Promise<void> {
  if (!command) {
    return;
  }

  const child = spawnFn({
    cmd: ['sh', '-c', command],
    env: {
      ...process.env,
      AI_CODING_SYNC_HOOK: hookName,
      ...env,
    },
    stdout: 'inherit',
    stderr: 'inherit',
  });

  const exitCode = await child.exited;

  if (exitCode !== 0) {
    throw new Error(`Hook failed with exit code ${exitCode}`);
  }
}
