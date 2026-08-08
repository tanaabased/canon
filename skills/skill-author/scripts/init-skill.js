#!/usr/bin/env bun

import { bold, dim, renderCliHelp, writeLine } from '../../../lib/bun-cli-support.js';
import {
  CANON_SKILL_BRAND_COLOR,
  CANON_SKILL_PREFIX,
  SKILLS_ROOT_DIR,
  formatSkillContainerIds,
  formatSkillTypeIds,
} from '../lib/skill-contract.js';
import { initializeSkill } from '../lib/skill-scaffolder.js';
import formatSkillValidationReport from '../utils/format-skill-validation-report.js';
import parseInitSkillArgs from '../utils/parse-init-skill-args.js';

function renderUsage(stream = process.stdout) {
  return renderCliHelp(
    {
      usage: `Usage: ${bold('init-skill.js', stream)} ${dim('--type <type> --slug <slug> --display-name <name> --description <text> --openclaw-emoji <emoji> [options]', stream)}`,
      summary:
        'Initialize a canon-shaped skill from the local full templates owned by tanaab-skill-author.',
      options: [
        `  --type <type>           skill type such as ${dim(formatSkillTypeIds(), stream)}`,
        `  --namespace <id>        public skill namespace ${dim(`[default: ${CANON_SKILL_PREFIX}]`, stream)}`,
        `  --container <id>        folder context: ${dim(formatSkillContainerIds(), stream)}; auto-detected when omitted`,
        '  --category-tag <tag>    category tag override; must add one tag beyond owner and type',
        '  --slug <slug>           skill slug without the configured namespace prefix',
        '  --display-name <name>   human-readable skill display name',
        '  --description <text>    skill description text',
        `  --brand-color <hex>     agents/openai.yaml brand color ${dim(`[default: ${CANON_SKILL_BRAND_COLOR}]`, stream)}`,
        '  --openclaw-emoji <emoji> skill-specific emoji for metadata.openclaw',
        '  --openclaw-homepage <url> homepage override; required for a custom output directory',
        '  --prompt <text>         default prompt for agents/openai.yaml',
        `  --output-dir <path>     parent directory for generated skills ${dim(`[default: ${SKILLS_ROOT_DIR}]`, stream)}`,
        '  --force                 overwrite an existing generated skill directory',
        '  -h, --help              show this message',
      ],
    },
    stream,
  );
}

async function main() {
  const options = parseInitSkillArgs(process.argv.slice(2), SKILLS_ROOT_DIR);
  if (options.help) {
    writeLine(process.stdout, renderUsage());
    return true;
  }

  const { result, skillDir } = await initializeSkill(options);
  writeLine(process.stdout, `Created skill at ${skillDir}`);
  if (result.warnings.length > 0 || result.manualChecks.length > 0) {
    writeLine(process.stdout, formatSkillValidationReport(result));
  }
  return true;
}

try {
  await main();
} catch (error) {
  writeLine(process.stderr, error instanceof Error ? error.message : String(error));
  writeLine(process.stderr, renderUsage(process.stderr));
  process.exitCode = 1;
}
