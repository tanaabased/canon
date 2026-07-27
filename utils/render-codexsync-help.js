import { bold, dim, renderCliHelp } from '../lib/bun-cli-support.js';

/**
 * Renders codexsync help with resolved path defaults.
 *
 * @param {object} context Resolved command metadata and defaults.
 * @param {string} context.cachePath Managed plugin cache path.
 * @param {string[]} context.commands Supported commands.
 * @param {string} context.cliName Executable display name.
 * @param {string} context.repoRoot Source repository root.
 * @param {NodeJS.WritableStream} [stream=process.stdout] Stream used for color decisions.
 * @returns {string} Help text ready to write.
 */
export default function renderCodexsyncHelp(
  { cachePath, commands, cliName, repoRoot },
  stream = process.stdout,
) {
  return renderCliHelp(
    {
      usage: `Usage: ${bold(`${cliName} <${commands.join('|')}>`, stream)} ${dim('[options]', stream)}`,
      commands: [
        '  check      compares source to the managed Codex plugin cache',
        '  validate   validates canon skills, plugin metadata, docs links, and workflow script references',
        '  sync       copies source into the managed Codex plugin cache',
      ],
      options: [
        `  --repo-root <path>    repo root to compare from ${dim(`[default: ${repoRoot}]`, stream)}`,
        `  --cache-path <path>   cache copy to compare or sync ${dim(`[default: ${cachePath}]`, stream)}`,
        '  -h, --help            displays this message',
        '  -V, --version         shows the CLI version',
      ],
    },
    stream,
  );
}
