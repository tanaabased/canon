/** Run one parsed, report-producing schema command with consistent stream handling. */
export function runSchemaMutationCli(
  argv,
  dependencies,
  { execute, failureStatuses, parse, render, runtimeErrorWithUsage = false, usage },
) {
  const stdout = dependencies.stdout ?? process.stdout;
  const stderr = dependencies.stderr ?? process.stderr;
  let parsed;
  try {
    parsed = parse(argv);
  } catch (error) {
    stderr.write(`${error.message}\n\n${usage()}\n`);
    return 1;
  }
  if (parsed.help) {
    stdout.write(`${usage()}\n`);
    return 0;
  }

  try {
    const report = execute(parsed.target, {
      ...dependencies,
      authorization: parsed.authorization,
    });
    stdout.write(parsed.json ? `${JSON.stringify(report, null, 2)}\n` : render(report));
    return failureStatuses.includes(report.status) ? 1 : 0;
  } catch (error) {
    stderr.write(
      runtimeErrorWithUsage ? `${error.message}\n\n${usage()}\n` : `error: ${error.message}\n`,
    );
    return 1;
  }
}
