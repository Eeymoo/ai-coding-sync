const ENV_VARIABLE_PATTERN = /\$\{([A-Z0-9_]+)\}/gi;

/**
 * Expands a user path containing home or environment variable references.
 *
 * @param {string} inputPath - Path that may include ~ or ${VAR} placeholders
 * @returns {string} Expanded absolute or normalized path string
 * @example
 * expandUserPath('~/.config');
 * @since 0.1.0
 * @category Utils
 */
export function expandUserPath(inputPath: string): string {
  const withHome = inputPath.startsWith('~')
    ? inputPath.replace('~', process.env.HOME ?? process.env.USERPROFILE ?? '~')
    : inputPath;

  return withHome.replace(
    ENV_VARIABLE_PATTERN,
    (match, variableName: string) => {
      return process.env[variableName] ?? match;
    }
  );
}
