import { REPOSITORY_MODES } from '../lib/issue-form-contract.js';

/** Parse render, repository-plan, and digest-authorized repository-apply commands. */
export function parseIssueFormArgs(argv) {
  if (argv.includes('--help') || argv.includes('-h')) return { help: true };
  const args = [...argv];
  const jsonIndex = args.indexOf('--json');
  const json = jsonIndex !== -1;
  if (json) args.splice(jsonIndex, 1);

  function take(name) {
    const index = args.indexOf(name);
    if (index === -1) return null;
    const value = args[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${name} requires a value.`);
    args.splice(index, 2);
    return value;
  }

  const repositoryMode = take('--repository-mode');
  const approvedRepository = take('--approved-repository');
  const approvedBranch = take('--approved-branch');
  const approvedDigest = take('--approved-digest');
  const command = args.shift();
  if (!['render', 'plan', 'apply'].includes(command)) {
    throw new Error('Expected command: render, plan, or apply');
  }
  if (command === 'render') {
    if (!REPOSITORY_MODES.includes(repositoryMode)) {
      throw new Error('render requires --repository-mode <organization|personal>.');
    }
    if (approvedRepository || approvedBranch || approvedDigest) {
      throw new Error('Approval flags are valid only with apply.');
    }
    if (args.length > 0) throw new Error(`Unexpected argument: ${args[0]}`);
    return { command, repositoryMode, json, help: false };
  }

  if (repositoryMode) throw new Error('Repository mode is inferred for plan and apply.');
  const target = args.shift();
  if (!target) throw new Error(`${command} requires an explicit OWNER/REPO target.`);
  if (args.length > 0) throw new Error(`Unexpected argument: ${args[0]}`);
  if (command === 'plan' && (approvedRepository || approvedBranch || approvedDigest)) {
    throw new Error('Approval flags are valid only with apply.');
  }
  if (command === 'apply' && (!approvedRepository || !approvedBranch || !approvedDigest)) {
    throw new Error(
      'apply requires --approved-repository, --approved-branch, and --approved-digest.',
    );
  }
  return {
    command,
    target,
    json,
    help: false,
    authorization: { approvedRepository, approvedBranch, approvedDigest },
  };
}
