import { RepositoryPolicyClient, RepositoryPolicyError } from '../lib/repository-policy-client.js';
import parseRepositoryPolicyArgs from '../utils/parse-repository-policy-args.js';
import renderRepositoryPolicyReport from '../utils/render-repository-policy-report.js';

function usage() {
  return `Usage: bun repository-policy.js <inspect|apply|create> OWNER/REPO [options]

Commands:
  inspect OWNER/REPO          Read managed settings and report canonical drift
  apply OWNER/REPO            Apply managed settings, then verify canonical state
  create OWNER/REPO           Create a public README-initialized repo, apply, and verify

Options:
  --json                      Print machine-readable JSON
  --initialize                Allow apply to initialize an existing empty repository
  --rename-default            Allow apply to rename the current default branch to main
  -h, --help                  Show this help
`;
}

function renderError(error) {
  const payload = {
    error: error.message,
  };
  if (error.step) {
    payload.step = error.step;
  }
  if (error.report) {
    payload.report = error.report;
  }
  return payload;
}

/**
 * Runs the non-interactive repository-policy command.
 *
 * @param {string[]} argv Command arguments without the executable path.
 * @param {object} [dependencies] Injectable client and output streams for tests.
 * @returns {number} Process-style exit status.
 */
export function runCli(argv, dependencies = {}) {
  const stdout = dependencies.stdout ?? process.stdout;
  const stderr = dependencies.stderr ?? process.stderr;
  let parsed;

  try {
    parsed = parseRepositoryPolicyArgs(argv);
  } catch (error) {
    stderr.write(`${error.message}\n\n${usage()}`);
    return 1;
  }

  if (parsed.help) {
    stdout.write(usage());
    return 0;
  }

  const { command, slug } = parsed;
  const client = dependencies.client ?? new RepositoryPolicyClient();

  try {
    const report =
      command === 'inspect'
        ? client.inspect(slug)
        : command === 'create'
          ? client.create(slug)
          : client.apply(slug, {
              initialize: parsed.initialize,
              renameDefault: parsed.renameDefault,
            });
    stdout.write(
      parsed.json ? `${JSON.stringify(report, null, 2)}\n` : renderRepositoryPolicyReport(report),
    );
    return 0;
  } catch (error) {
    const knownError =
      error instanceof RepositoryPolicyError ? error : new RepositoryPolicyError(error.message);
    if (parsed.json) {
      stderr.write(`${JSON.stringify(renderError(knownError), null, 2)}\n`);
    } else {
      stderr.write(`error: ${knownError.message}\n`);
      if (knownError.step) {
        stderr.write(`step: ${knownError.step}\n`);
      }
      if (knownError.report) {
        stderr.write(renderRepositoryPolicyReport(knownError.report));
      }
    }
    return 1;
  }
}

if (import.meta.main) {
  process.exitCode = runCli(process.argv.slice(2));
}
