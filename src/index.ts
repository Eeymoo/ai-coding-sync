import { AppError } from './utils/errors';
import { runCli } from './cli/run-cli';

/**
 * CLI entry point for AI-Coding-Sync.
 *
 * @returns {Promise<void>} Promise resolved when execution completes
 * @example
 * await main();
 * @since 0.1.0
 * @category CLI
 */
async function main(): Promise<void> {
  try {
    await runCli(process.argv.slice(2));
  } catch (error) {
    if (error instanceof AppError) {
      console.error(`${error.code}: ${error.message}`);
      process.exit(error.exitCode);
    }

    throw error;
  }
}

await main();
