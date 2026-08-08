#!/usr/bin/env bun

import { bold, dim, renderCliHelp, writeLine } from '../../../lib/bun-cli-support.js';
import { CANON_SKILL_PREFIX, formatSkillContainerIds } from '../lib/skill-contract.js';
import { validateSkillDir } from '../lib/skill-validator.js';
import formatSkillValidationReport from '../utils/format-skill-validation-report.js';
import parseValidateSkillArgs from '../utils/parse-validate-skill-args.js';

function renderUsage(stream = process.stdout) {
  return renderCliHelp(
    {
      usage: `Usage: ${bold('validate-skill.js', stream)} ${dim('--skill-dir <path> [options]', stream)}`,
      summary:
        'Validate a canon-shaped skill directory against references/skill-standard.md and the local full templates owned by tanaab-skill-author.',
      options: [
        '  --skill-dir <path>      skill directory to validate',
        '  --type <type>           expected type override',
        `  --namespace <id>        public skill namespace ${dim(`[default: ${CANON_SKILL_PREFIX}]`, stream)}`,
        `  --container <id>        folder context: ${dim(formatSkillContainerIds(), stream)}; auto-detected when omitted`,
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

  const result = await validateSkillDir(skillDir, {
    container: options.container,
    expectedType: options.type,
    namespace: options.namespace,
  });
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
