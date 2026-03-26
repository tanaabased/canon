#!/usr/bin/env bun

import { formatValidationReport, validateSkillDir } from './skill-author-lib.js';

function usage(code = 0) {
  const lines = [
    'Usage: validate-skill.js --skill-dir <path> [options]',
    '',
    'Validate a canon skill directory against references/skill-standard.md and the canonical local full templates owned by tanaab-skill-author.',
    '',
    'Options:',
    '  --skill-dir <path>      skill directory to validate',
    '  --type <type>           expected type override',
    '  -h, --help              show this message',
  ];
  console.log(lines.join('\n'));
  process.exit(code);
}

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '-h' || arg === '--help') {
      usage(0);
    }

    if (!arg.startsWith('--')) {
      throw new Error(`Positional arguments are not supported: ${arg}`);
    }

    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${arg}`);
    }

    const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    parsed[key] = value;
    index += 1;
  }

  return parsed;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const skillDir = String(options.skillDir ?? '').trim();

  if (!skillDir) {
    throw new Error('Skill directory is required.');
  }

  const result = await validateSkillDir(skillDir, {
    expectedType: options.type,
  });

  console.log(formatValidationReport(result));
  process.exit(result.errors.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  usage(1);
});
