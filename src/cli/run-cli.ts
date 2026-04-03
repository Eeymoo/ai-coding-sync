import type { CliCommandName, GlobalCliOptions } from '../types';

/**
 * Parsed command payload.
 *
 * @since 0.1.0
 * @category CLI
 */
export interface ParsedCliInput {
  command: CliCommandName;
  args: string[];
  options: GlobalCliOptions;
}

export type CliHandler = (input: ParsedCliInput) => Promise<void>;
export type CliHandlerMap = Partial<Record<CliCommandName, CliHandler>>;

const COMMAND_SET = new Set<CliCommandName>([
  'init',
  'sync',
  'push',
  'pull',
  'status',
  'doctor',
  'config:get',
  'config:set',
]);

/**
 * Parses shared global CLI options from argv tokens.
 *
 * @param {string[]} args - Raw command arguments
 * @returns {{ args: string[]; options: GlobalCliOptions }} Positional args and parsed options
 * @example
 * const parsed = parseGlobalOptions(['--profile', 'work']);
 * @since 0.1.0
 * @category CLI
 */
function parseGlobalOptions(args: string[]): {
  args: string[];
  options: GlobalCliOptions;
} {
  const positional: string[] = [];
  const options: GlobalCliOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];

    if (!token.startsWith('--')) {
      positional.push(token);
      continue;
    }

    switch (token) {
      case '--profile':
        options.profile = args[index + 1];
        index += 1;
        break;
      case '--source-type':
        options.sourceType = args[index + 1] as GlobalCliOptions['sourceType'];
        index += 1;
        break;
      case '--deploy-mode':
        options.deployMode = args[index + 1] as GlobalCliOptions['deployMode'];
        index += 1;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--force':
        options.force = true;
        break;
      case '--yes':
        options.yes = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      default:
        break;
    }
  }

  return { args: positional, options };
}

/**
 * Normalizes argv into a supported command and remainder tokens.
 *
 * @param {string[]} argv - Raw CLI tokens
 * @returns {{ command: CliCommandName; remainder: string[] }} Normalized command tuple
 * @example
 * const normalized = normalizeCommand(['config', 'get', 'syncId']);
 * @since 0.1.0
 * @category CLI
 */
function normalizeCommand(argv: string[]): {
  command: CliCommandName;
  remainder: string[];
} {
  if (argv[0] === 'config' && argv[1] === 'get') {
    return { command: 'config:get', remainder: argv.slice(2) };
  }

  if (argv[0] === 'config' && argv[1] === 'set') {
    return { command: 'config:set', remainder: argv.slice(2) };
  }

  const firstToken = argv[0];

  if (!firstToken || !COMMAND_SET.has(firstToken as CliCommandName)) {
    return { command: 'sync', remainder: argv };
  }

  return { command: firstToken as CliCommandName, remainder: argv.slice(1) };
}

/**
 * Runs the application CLI with raw argv input.
 *
 * @param {string[]} argv - Raw CLI arguments excluding node/bun executable prefix
 * @param {CliHandlerMap} handlers - Optional command handlers for dispatch
 * @returns {Promise<void>} Promise resolved when command execution completes
 * @example
 * await runCli(['status']);
 * @since 0.1.0
 * @category CLI
 */
export async function runCli(
  argv: string[],
  handlers: CliHandlerMap = {}
): Promise<void> {
  const { command, remainder } = normalizeCommand(argv);
  const { args, options } = parseGlobalOptions(remainder);
  const payload: ParsedCliInput = {
    command,
    args,
    options,
  };

  const handler = handlers[command];

  if (handler) {
    await handler(payload);
  }
}
