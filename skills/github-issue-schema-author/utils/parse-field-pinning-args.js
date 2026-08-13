/** Parse the browser-backed field-pinning plan and authorization commands. */
export function parseFieldPinningArgs(argv) {
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

  const approvedOrganization = take('--approved-organization');
  const approvedDigest = take('--approved-digest');
  const command = args.shift();
  if (!['plan', 'authorize'].includes(command)) {
    throw new Error('Expected command: plan or authorize');
  }
  const target = args.shift();
  if (!target) throw new Error(`${command} requires an explicit OWNER/REPO target.`);
  if (args.length > 0) throw new Error(`Unexpected argument: ${args[0]}`);
  if (command === 'plan' && (approvedOrganization || approvedDigest)) {
    throw new Error('Approval flags are valid only with authorize.');
  }
  if (command === 'authorize' && (!approvedOrganization || !approvedDigest)) {
    throw new Error('authorize requires --approved-organization and --approved-digest.');
  }
  return {
    command,
    target,
    json,
    help: false,
    authorization: { approvedOrganization, approvedDigest },
  };
}
