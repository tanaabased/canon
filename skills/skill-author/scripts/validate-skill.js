#!/usr/bin/env bun

import { bold, dim, renderCliHelp, writeLine } from '../../../lib/bun-cli-support.js';
import { validateSkillDir } from '../lib/skill-validator.js';
import formatSkillValidationReport from '../utils/format-skill-validation-report.js';
import parseValidateSkillArgs from '../utils/parse-validate-skill-args.js';

function renderUsage(stream = process.stdout) {
  return renderCliHelp(
    {
      usage: `Usage: ${bold('validate-skill.js', stream)} ${dim('--skill-dir <path> [options]', stream)}`,
      summary:
        'Validate a canon skill directory against references/skill-standard.md and the canonical local full templates owned by tanaab-skill-author.',
      options: [
        '  --skill-dir <path>      skill directory to validate',
        '  --type <type>           expected type override',
        '  -h, --help              show this message',
      ],
    },
    stream,
  );
}

async function main() {
  const options = parseValidateSkillArgs(process.argv.slice(2));
  if (options.help) {
    writeLine(process.stdout, renderUsage());
    return true;
  }

  const skillDir = String(options.skillDir ?? '').trim();
  if (!skillDir) throw new Error('Skill directory is required.');

  const result = await validateSkillDir(skillDir, { expectedType: options.type });
  writeLine(process.stdout, formatSkillValidationReport(result));
  return result.errors.length === 0;
}

try {
  const ok = await main();
  if (!ok) process.exitCode = 1;
} catch (error) {
  writeLine(process.stderr, error instanceof Error ? error.message : String(error));
  writeLine(process.stderr, renderUsage(process.stderr));
  process.exitCode = 1;
}
