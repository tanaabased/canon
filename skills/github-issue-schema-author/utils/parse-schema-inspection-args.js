/** Parse the narrow internal Schema Author inspection command. */
export function parseSchemaInspectionArgs(argv) {
  if (argv.includes('--help') || argv.includes('-h')) return { help: true };

  const args = [...argv];
  const jsonIndex = args.indexOf('--json');
  const json = jsonIndex !== -1;
  if (json) args.splice(jsonIndex, 1);

  const command = args.shift();
  if (command !== 'inspect') {
    throw new Error('Expected command: inspect');
  }
  const target = args.shift();
  if (!target) throw new Error('inspect requires an explicit OWNER/REPO target.');
  if (args.length > 0) throw new Error(`Unexpected argument: ${args[0]}`);
  return { command, target, json, help: false };
}
