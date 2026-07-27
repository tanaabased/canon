#!/usr/bin/env bun

import { fail, ts, writeLine } from '../lib/bun-cli-support.js';
import {
  CLI_NAME,
  COMMANDS,
  DEFAULT_REPO_ROOT,
  getScriptVersion,
  resolveCodexsyncContext,
} from '../lib/codexsync-context.js';
import { runCheck } from '../lib/codexsync-check.js';
import { runSync } from '../lib/codexsync-sync.js';
import { runValidate } from '../lib/codexsync-validate.js';
import csvDisplay from '../utils/csv-display.js';
import parseCodexsyncArgs from '../utils/parse-codexsync-args.js';
import renderCodexsyncHelp from '../utils/render-codexsync-help.js';

async function main() {
  const { command, extraPositionals, options } = parseCodexsyncArgs(process.argv.slice(2), {
    defaultRepoRoot: DEFAULT_REPO_ROOT,
  });
  const context = await resolveCodexsyncContext({
    cachePathOverride: options.cachePath,
    repoRoot: options.repoRoot,
  });

  if (options.help) {
    writeLine(
      process.stdout,
      renderCodexsyncHelp({
        cachePath: context.cachePath,
        cliName: CLI_NAME,
        commands: COMMANDS,
        repoRoot: options.repoRoot,
      }),
    );
    return true;
  }

  if (options.version) {
    writeLine(process.stdout, await getScriptVersion(DEFAULT_REPO_ROOT));
    return true;
  }

  if (!command) {
    fail(`expected a command (${COMMANDS.map((entry) => ts(entry)).join(', ')})`);
    writeLine(process.stderr, '');
    writeLine(
      process.stderr,
      renderCodexsyncHelp(
        {
          cachePath: context.cachePath,
          cliName: CLI_NAME,
          commands: COMMANDS,
          repoRoot: options.repoRoot,
        },
        process.stderr,
      ),
    );
    return false;
  }

  if (extraPositionals.length > 0) {
    return fail(`unexpected positional arguments: ${csvDisplay(extraPositionals)}`);
  }

  if (command === 'check') {
    return runCheck(context);
  }

  if (command === 'validate') {
    return runValidate(context);
  }

  if (command === 'sync') {
    return runSync(context);
  }

  return fail(`unknown command: ${command}`);
}

try {
  const ok = await main();
  if (!ok) {
    process.exitCode = 1;
  }
} catch (error) {
  fail(error.message);
  process.exitCode = 1;
}
