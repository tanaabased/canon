/** Parse an explicit organization and/or repository set without granting plan-mode writes. */
export function parseLabelBatchArgs(argv) {
  if (argv.includes('--help') || argv.includes('-h')) return { help: true };
  const args = [...argv];
  const mode = args.shift();
  if (!['inspect', 'plan', 'apply'].includes(mode)) {
    throw new Error('Expected command: inspect, plan, or apply.');
  }
  const target = { mode, organization: null, repositories: [] };
  let json = false;
  let approvedDigest = null;
  while (args.length > 0) {
    const flag = args.shift();
    if (flag === '--json' && !json) {
      json = true;
      continue;
    }
    if (!['--organization', '--repository', '--approved-digest'].includes(flag)) {
      throw new Error(`Unexpected argument: ${flag}`);
    }
    const value = args.shift();
    if (!value || value.startsWith('-')) throw new Error(`${flag} requires a value.`);
    if (flag === '--repository') target.repositories.push(value);
    if (flag === '--organization') {
      if (target.organization) throw new Error('Specify --organization only once.');
      target.organization = value;
    }
    if (flag === '--approved-digest') {
      if (approvedDigest) throw new Error('Specify --approved-digest only once.');
      approvedDigest = value;
    }
  }
  if (!target.organization && target.repositories.length === 0) {
    throw new Error('Specify --organization and/or at least one --repository.');
  }
  if (mode === 'apply' && !approvedDigest) throw new Error('apply requires --approved-digest.');
  if (mode !== 'apply' && approvedDigest) {
    throw new Error('Approval flags are valid only with apply.');
  }
  return { target, json, authorization: { approvedDigest } };
}
