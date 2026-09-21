#!/usr/bin/env bun

import checkPackage from '../lib/package-checker.js';

const args = process.argv.slice(2);
if (args.length !== 1 || args[0].startsWith('-')) {
  process.stderr.write('Usage: bun run check:package <extracted-package-directory>\n');
  process.exitCode = 1;
} else {
  try {
    const result = await checkPackage(args[0]);
    process.stdout.write(
      `Verified ${result.name}@${result.version}: ${result.skills} skills and ${result.commands} commands; no dependency installation.\n`,
    );
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
