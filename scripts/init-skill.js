#!/usr/bin/env bun

import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CANON_DESCRIPTION_PREFIX,
  CANON_ICON_LARGE_TEMPLATE,
  CANON_ICON_SMALL_TEMPLATE,
  CANON_SKILL_BRAND_COLOR,
  CANON_SKILL_OWNER,
  CANON_SKILL_PREFIX_WITH_HYPHEN,
} from './skill-owner.js';
import { inferCategoryTag, isKnownCategoryTag } from './skill-tags.js';
import { formatSkillTypeIds, getSkillType } from './skill-types.js';
import { formatValidationReport, validateSkillDir } from './skill-validation.js';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function usage(code = 0) {
  const lines = [
    'Usage: init-skill.js --type <type> --slug <slug> --display-name <name> --description <text> [options]',
    '',
    'Initialize a Tanaab skill from the shared base template and typed section partials.',
    '',
    'Options:',
    `  --type <type>           skill type such as ${formatSkillTypeIds()}`,
    '  --category-tag <tag>    category tag override such as skills or validation',
    '  --slug <slug>           skill slug without the tanaab- prefix',
    '  --display-name <name>   human-readable skill display name',
    '  --description <text>    skill description text',
    '  --prompt <text>         default prompt for agents/openai.yaml',
    '  --output-dir <path>     parent directory for generated skills [default: skills]',
    '  --force                 overwrite an existing generated skill directory',
    '  -h, --help              show this message',
  ];
  console.log(lines.join('\n'));
  process.exit(code);
}

function parseArgs(argv) {
  const parsed = {
    outputDir: 'skills',
    type: 'generic',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '-h' || arg === '--help') {
      usage(0);
    }

    if (arg === '--force') {
      parsed.force = true;
      continue;
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

function normalizeSlug(value) {
  const slug = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) {
    throw new Error('Slug must contain at least one letter or digit.');
  }

  return slug;
}

function stripDuplicateOwnerPrefix(slug) {
  if (slug.startsWith(CANON_SKILL_PREFIX_WITH_HYPHEN)) {
    return slug.slice(CANON_SKILL_PREFIX_WITH_HYPHEN.length);
  }

  return slug;
}

function quoteYaml(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function normalizeTanaabBasedDescription(value) {
  const trimmed = String(value ?? '').trim();
  const withoutPrefix = trimmed.replace(/^tanaab[- ]based\s+/i, '');
  return `${CANON_DESCRIPTION_PREFIX}${withoutPrefix}`;
}

function makeShortDescription(description) {
  const cleaned = normalizeTanaabBasedDescription(description).replace(/\.$/, '');
  if (cleaned.length <= 64) {
    return cleaned;
  }

  const remainder = cleaned.slice(CANON_DESCRIPTION_PREFIX.length);
  const maxRemainderLength = 64 - CANON_DESCRIPTION_PREFIX.length - 3;
  return `${CANON_DESCRIPTION_PREFIX}${remainder.slice(0, maxRemainderLength).trimEnd()}...`;
}

function makeDefaultPrompt(skillId, description) {
  const cleaned = String(description ?? '')
    .trim()
    .replace(/^tanaab[- ]based\s+/i, '')
    .replace(/\.$/, '');
  const normalized = cleaned ? `${cleaned[0].toLowerCase()}${cleaned.slice(1)}` : cleaned;
  return `Use $${skillId} when you need to ${normalized}.`;
}

function renderTemplate(template, replacements) {
  return template.replaceAll(/\{\{([a-z_]+)\}\}/g, (match, key) => replacements[key] ?? match);
}

function renderTagsYaml(tags) {
  return tags.map((tag) => `  - ${tag}`).join('\n');
}

async function readBaseTemplate() {
  const templatePath = path.join(REPO_ROOT, 'templates', 'skill-generic-skill.md');
  return {
    content: await readFile(templatePath, 'utf8'),
    path: templatePath,
  };
}

async function readOptionalFile(relativePath) {
  if (!relativePath) {
    return {
      content: '',
      path: null,
    };
  }

  const absolutePath = path.join(REPO_ROOT, relativePath);
  return {
    content: await readFile(absolutePath, 'utf8'),
    path: absolutePath,
  };
}

async function exists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function makeOpenAiYaml({ displayName, shortDescription, defaultPrompt }) {
  return `interface:
  display_name: ${quoteYaml(displayName)}
  short_description: ${quoteYaml(shortDescription)}
  icon_small: "./assets/icon-small.svg"
  icon_large: "./assets/icon-large.png"
  brand_color: ${quoteYaml(CANON_SKILL_BRAND_COLOR)}
  default_prompt: ${quoteYaml(defaultPrompt)}
`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const type = String(options.type ?? '').trim().toLowerCase();
  const rawSlug = normalizeSlug(options.slug ?? '');
  const categoryTagOverride = String(options.categoryTag ?? '').trim().toLowerCase();
  const displayName = String(options.displayName ?? '').trim();
  const description = String(options.description ?? '').trim();

  if (!type) {
    throw new Error('Type is required.');
  }

  if (!displayName) {
    throw new Error('Display name is required.');
  }

  if (!description) {
    throw new Error('Description is required.');
  }

  const normalizedDescription = normalizeTanaabBasedDescription(description);

  const typeDefinition = getSkillType(type);
  if (!typeDefinition) {
    throw new Error(`Unknown type: ${type}. Allowed types: ${formatSkillTypeIds()}`);
  }

  if (categoryTagOverride && !isKnownCategoryTag(categoryTagOverride)) {
    throw new Error(`Unknown category tag: ${categoryTagOverride}`);
  }

  const [template, preWorkflowSections, postWorkflowSections] = await Promise.all([
    readBaseTemplate(),
    readOptionalFile(typeDefinition.preWorkflowSectionPath),
    readOptionalFile(typeDefinition.postWorkflowSectionPath),
  ]);

  const slug = stripDuplicateOwnerPrefix(rawSlug);
  const skillId = `${CANON_SKILL_PREFIX_WITH_HYPHEN}${slug}`;
  const categoryTag =
    categoryTagOverride ||
    inferCategoryTag({ description: normalizedDescription, displayName, slug: skillId }) ||
    typeDefinition.defaultCategoryTag;
  const tags = [...new Set([CANON_SKILL_OWNER, type, categoryTag])];
  const skillDir = path.resolve(options.outputDir ?? 'skills', skillId);
  const agentsDir = path.join(skillDir, 'agents');
  const assetsDir = path.join(skillDir, 'assets');

  if ((await exists(skillDir)) && !options.force) {
    throw new Error(`Skill directory already exists: ${skillDir}`);
  }

  if (options.force) {
    await rm(skillDir, { force: true, recursive: true });
  }

  await mkdir(agentsDir, { recursive: true });
  await mkdir(assetsDir, { recursive: true });

  const skillMarkdown = renderTemplate(template.content, {
    description: normalizedDescription,
    display_name: displayName,
    owner: CANON_SKILL_OWNER,
    post_workflow_sections: postWorkflowSections.content ? `${postWorkflowSections.content}\n` : '',
    skill_id: skillId,
    tags_yaml: renderTagsYaml(tags),
    type,
    type_sections: preWorkflowSections.content ? `${preWorkflowSections.content}\n` : '',
  });
  const shortDescription = makeShortDescription(normalizedDescription);
  const defaultPrompt = String(options.prompt ?? '').trim() || makeDefaultPrompt(skillId, normalizedDescription);

  await writeFile(path.join(skillDir, 'SKILL.md'), skillMarkdown, 'utf8');
  await writeFile(
    path.join(agentsDir, 'openai.yaml'),
    makeOpenAiYaml({ defaultPrompt, displayName, shortDescription }),
    'utf8',
  );
  await copyFile(path.join(REPO_ROOT, CANON_ICON_SMALL_TEMPLATE), path.join(assetsDir, 'icon-small.svg'));
  await copyFile(path.join(REPO_ROOT, CANON_ICON_LARGE_TEMPLATE), path.join(assetsDir, 'icon-large.png'));

  const validation = await validateSkillDir(skillDir, {
    expectedType: type,
  });

  console.log(
    [
      `created ${skillId}`,
      `- ${path.join(skillDir, 'SKILL.md')}`,
      `- ${path.join(agentsDir, 'openai.yaml')}`,
      `- ${path.join(assetsDir, 'icon-small.svg')}`,
      `- ${path.join(assetsDir, 'icon-large.png')}`,
      `- base-template: ${template.path}`,
      `- pre-workflow-sections: ${preWorkflowSections.path ?? '(none)'}`,
      `- post-workflow-sections: ${postWorkflowSections.path ?? '(none)'}`,
      `- owner: ${CANON_SKILL_OWNER}`,
      `- category-tag: ${categoryTag}`,
      formatValidationReport(validation),
    ].join('\n'),
  );

  if (validation.errors.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  usage(1);
});
