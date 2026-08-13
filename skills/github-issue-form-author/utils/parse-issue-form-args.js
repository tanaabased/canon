import { REPOSITORY_MODES } from '../lib/issue-form-contract.js';

/** Parse the narrow, render-only Issue Form Author command. */
export function parseIssueFormArgs(argv) {
  if (argv.includes('--help') || argv.includes('-h')) return { help: true };
  const args = [...argv];
  const jsonIndex = args.indexOf('--json');
  const json = jsonIndex !== -1;
  if (json) args.splice(jsonIndex, 1);

  const command = args.shift();
  if (command !== 'render') throw new Error('Expected command: render');
  const modeFlag = args.shift();
  if (modeFlag !== '--repository-mode') {
    throw new Error('render requires --repository-mode <organization|personal>.');
  }
  const repositoryMode = args.shift();
  if (!REPOSITORY_MODES.includes(repositoryMode)) {
    throw new Error(`repository mode must be one of: ${REPOSITORY_MODES.join(', ')}.`);
  }
  if (args.length > 0) throw new Error(`Unexpected argument: ${args[0]}`);
  return { command, repositoryMode, json, help: false };
}
