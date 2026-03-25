import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  CANON_DESCRIPTION_PREFIX,
  CANON_SKILL_BRAND_COLOR,
  CANON_SKILL_OWNER,
  CANON_SKILL_PREFIX_WITH_HYPHEN,
} from './skill-owner.js';
import { isKnownCategoryTag } from './skill-tags.js';
import { formatSkillTypeIds, getSkillType, isKnownSkillType } from './skill-types.js';

const AUXILIARY_DOCS = [
  'README.md',
  'CHANGELOG.md',
  'INSTALLATION.md',
  'INSTALLATION_GUIDE.md',
  'QUICK_REFERENCE.md',
];

function unquoteYaml(value) {
  const trimmed = String(value ?? '').trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return null;
  }

  const entries = {};
  const lines = match[1].split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const frontmatterMatch = line.match(/^([a-z_]+):(.*)$/);
    if (!frontmatterMatch) {
      continue;
    }

    const [, key, rawValue] = frontmatterMatch;
    const value = rawValue.trim();

    if (!value) {
      const listItems = [];
      while (index + 1 < lines.length) {
        const nextLine = lines[index + 1];
        const listMatch = nextLine.match(/^\s*-\s+(.+)$/);
        if (!listMatch) {
          break;
        }

        listItems.push(unquoteYaml(listMatch[1]));
        index += 1;
      }

      entries[key] = listItems;
      continue;
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      const items = value
        .slice(1, -1)
        .split(',')
        .map((item) => unquoteYaml(item))
        .filter(Boolean);
      entries[key] = items;
      continue;
    }

    entries[key] = unquoteYaml(value);
  }

  return entries;
}

function parseInterfaceYaml(content) {
  const lines = content.split('\n');
  const interfaceValues = {};
  let inInterface = false;

  for (const line of lines) {
    if (!inInterface) {
      if (line.trim() === 'interface:') {
        inInterface = true;
      }
      continue;
    }

    if (!line.trim()) {
      continue;
    }

    if (!line.startsWith('  ')) {
      break;
    }

    const match = line.match(/^  ([a-z_]+):\s*(.+)$/);
    if (!match) {
      continue;
    }

    interfaceValues[match[1]] = unquoteYaml(match[2]);
  }

  return interfaceValues;
}

function isRelativePath(value) {
  const trimmed = String(value ?? '').trim();
  return Boolean(trimmed) && !path.isAbsolute(trimmed) && !/^[a-z]+:\/\//i.test(trimmed);
}

function extractRelativeLinks(markdown) {
  const links = [];
  const pattern = /\[[^\]]*\]\(([^)]+)\)/g;

  for (const match of markdown.matchAll(pattern)) {
    const rawTarget = match[1].trim();
    const target = rawTarget.split(/\s+/)[0];

    if (
      !target ||
      target.startsWith('#') ||
      target.startsWith('mailto:') ||
      target.startsWith('data:') ||
      /^[a-z]+:\/\//i.test(target)
    ) {
      continue;
    }

    links.push(target);
  }

  return links;
}

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function extractTopLevelHeadings(content) {
  return content
    .split('\n')
    .filter((line) => /^#{1,2}\s/.test(line))
    .map((line) => line.trim());
}

function hasOrderedSections(content, orderedHeadings) {
  const headings = extractTopLevelHeadings(content);

  if (headings.length !== orderedHeadings.length) {
    return false;
  }

  return orderedHeadings.every((expectedHeading, index) => {
    const actualHeading = headings[index];
    if (expectedHeading === '# ') {
      return /^#\s/.test(actualHeading);
    }

    return actualHeading === expectedHeading;
  });
}

function hasTanaabBasedPrefix(value) {
  return /^tanaab[- ]based\s+/i.test(String(value ?? '').trim());
}

function buildManualChecks({ expectedType }) {
  const checks = [
    'Check that the description clearly says what the skill does and when to use it.',
    'Check that the skill owns one narrow, concrete surface.',
    'Check that bundled resources are truly unique to this skill and shared canon has been hoisted to repo root.',
    'Check that bulk standardization preserved the skill purpose unless a behavioral rewrite was requested.',
  ];

  if (expectedType) {
    checks.unshift(`Check that the selected type \`${expectedType}\` is still the smallest fit.`);
  }

  return checks;
}

function formatList(title, items) {
  if (items.length === 0) {
    return `${title}: none`;
  }

  return `${title}:\n${items.map((item) => `- ${item}`).join('\n')}`;
}

export function formatValidationReport(result) {
  return [
    `skill: ${result.skillDir}`,
    `status: ${result.errors.length === 0 ? 'ok' : 'failed'}`,
    formatList('errors', result.errors),
    formatList('warnings', result.warnings),
    formatList('manual_checks', result.manualChecks),
  ].join('\n');
}

export async function validateSkillDir(skillDir, options = {}) {
  const requestedType = String(options.expectedType ?? '').trim().toLowerCase();
  const skillPath = path.resolve(skillDir);
  const folderName = path.basename(skillPath);
  const errors = [];
  const warnings = [];
  let actualType = requestedType || 'generic';
  let actualOwner = CANON_SKILL_OWNER;

  if (requestedType && !isKnownSkillType(requestedType)) {
    errors.push(`Requested type must be one of: ${formatSkillTypeIds()}`);
  }

  const skillMdPath = path.join(skillPath, 'SKILL.md');
  const openAiYamlPath = path.join(skillPath, 'agents', 'openai.yaml');

  if (!(await pathExists(skillMdPath))) {
    errors.push('Missing SKILL.md.');
  }

  if (!(await pathExists(openAiYamlPath))) {
    errors.push('Missing agents/openai.yaml.');
  }

  let skillContent = '';
  let frontmatter = null;
  if (await pathExists(skillMdPath)) {
    skillContent = await readFile(skillMdPath, 'utf8');
    if (!skillContent.startsWith('---\n')) {
      errors.push('SKILL.md must start with YAML frontmatter.');
    }

    frontmatter = parseFrontmatter(skillContent);
    if (!frontmatter) {
      errors.push('SKILL.md frontmatter is missing or malformed.');
    } else {
      if (!frontmatter.name) {
        errors.push("SKILL.md frontmatter must contain 'name'.");
      }
      if (!frontmatter.description) {
        errors.push("SKILL.md frontmatter must contain 'description'.");
      }
      if (!frontmatter.type) {
        errors.push("SKILL.md frontmatter must contain 'type'.");
      }
      if (!frontmatter.owner) {
        errors.push("SKILL.md frontmatter must contain 'owner'.");
      }
      if (!frontmatter.tags) {
        errors.push("SKILL.md frontmatter must contain 'tags'.");
      }

      if (frontmatter.type && typeof frontmatter.type !== 'string') {
        errors.push("SKILL.md frontmatter 'type' must be a string.");
      }
      if (frontmatter.owner && typeof frontmatter.owner !== 'string') {
        errors.push("SKILL.md frontmatter 'owner' must be a string.");
      }

      if (typeof frontmatter.type === 'string') {
        actualType = frontmatter.type.trim().toLowerCase() || actualType;
      }
      if (typeof frontmatter.owner === 'string') {
        actualOwner = frontmatter.owner.trim().toLowerCase() || actualOwner;
      }

      if (requestedType && frontmatter.type && frontmatter.type !== requestedType) {
        errors.push(`Frontmatter type must match the requested type: expected \`${requestedType}\`.`);
      }
      if (frontmatter.owner && frontmatter.owner !== CANON_SKILL_OWNER) {
        errors.push(`Frontmatter owner must be \`${CANON_SKILL_OWNER}\`.`);
      }
      if (frontmatter.type && !isKnownSkillType(frontmatter.type)) {
        errors.push(`Frontmatter type must be one of: ${formatSkillTypeIds()}`);
      }
      if (frontmatter.description && !hasTanaabBasedPrefix(frontmatter.description)) {
        errors.push(`Frontmatter description must start with \`${CANON_DESCRIPTION_PREFIX.trim()}\`.`);
      }

      if (frontmatter.name && frontmatter.name !== folderName) {
        errors.push(`Frontmatter name must match the folder name exactly: expected \`${folderName}\`.`);
      }
      if (frontmatter.name && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(frontmatter.name)) {
        errors.push('Frontmatter name must use lowercase letters, digits, and single hyphens only.');
      }

      if (frontmatter.tags && !Array.isArray(frontmatter.tags)) {
        errors.push("SKILL.md frontmatter 'tags' must be a list of strings.");
      }

      if (Array.isArray(frontmatter.tags)) {
        const normalizedTags = frontmatter.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean);
        if (normalizedTags.length === 0) {
          errors.push("SKILL.md frontmatter 'tags' must not be empty.");
        }
        if (new Set(normalizedTags).size !== normalizedTags.length) {
          errors.push("SKILL.md frontmatter 'tags' must not contain duplicates.");
        }
        for (const tag of normalizedTags) {
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag)) {
            errors.push(`Skill tag must use lowercase letters, digits, and hyphens only: ${tag}`);
          }
        }
        if (actualOwner && !normalizedTags.includes(actualOwner)) {
          errors.push(`Skill tags must include the selected owner tag: ${actualOwner}`);
        }
        if (actualType && !normalizedTags.includes(actualType)) {
          errors.push(`Skill tags must include the selected type tag: ${actualType}`);
        }
        if (!normalizedTags.some((tag) => isKnownCategoryTag(tag))) {
          errors.push('Skill tags must include at least one canonical category tag from references/skill-tags.md.');
        }
        if (normalizedTags.length > 5) {
          warnings.push('Keep skill tags short. Prefer a minimal tag set instead of a keyword dump.');
        }
      }
    }

    const typeDefinition = getSkillType(actualType);
    if (typeDefinition && !hasOrderedSections(skillContent, typeDefinition.sectionOrder)) {
      errors.push(
        `\`${actualType}\` skills must use the section order defined in references/skill-types.md.`,
      );
    }

    for (const relativeTarget of extractRelativeLinks(skillContent)) {
      const [targetPath] = relativeTarget.split('#', 1);
      const resolvedTarget = path.resolve(skillPath, targetPath);
      if (!(await pathExists(resolvedTarget))) {
        errors.push(`Broken relative link in SKILL.md: ${relativeTarget}`);
      }
    }

    if (skillContent.includes('## Relationship to Other Skills')) {
      warnings.push('Avoid `## Relationship to Other Skills` unless the scope has already been challenged.');
    }
  }

  const manualChecks = buildManualChecks({ expectedType: actualType });

  if (!folderName.startsWith(CANON_SKILL_PREFIX_WITH_HYPHEN)) {
    errors.push(`Skill folder must use the owner prefix \`${CANON_SKILL_PREFIX_WITH_HYPHEN}\`.`);
  }
  if (folderName.startsWith(`${CANON_SKILL_PREFIX_WITH_HYPHEN}${CANON_SKILL_PREFIX_WITH_HYPHEN}`)) {
    errors.push(`Skill folder repeats the owner prefix: ${folderName}`);
  }
  if (frontmatter?.name && frontmatter.name.startsWith(`${CANON_SKILL_PREFIX_WITH_HYPHEN}${CANON_SKILL_PREFIX_WITH_HYPHEN}`)) {
    errors.push(`Frontmatter name repeats the owner prefix: ${frontmatter.name}`);
  }

  if (await pathExists(openAiYamlPath)) {
    const openAiContent = await readFile(openAiYamlPath, 'utf8');
    const interfaceValues = parseInterfaceYaml(openAiContent);
    for (const key of ['display_name', 'short_description', 'icon_small', 'icon_large', 'default_prompt', 'brand_color']) {
      if (!interfaceValues[key]) {
        errors.push(`agents/openai.yaml is missing interface.${key}.`);
      }
    }

    if (interfaceValues.default_prompt && frontmatter?.name) {
      if (!interfaceValues.default_prompt.includes(`$${frontmatter.name}`)) {
        errors.push('interface.default_prompt must explicitly mention the skill by `$<machine-id>`.');
      }
    }

    if (interfaceValues.brand_color && interfaceValues.brand_color !== CANON_SKILL_BRAND_COLOR) {
      errors.push(`interface.brand_color must equal \`${CANON_SKILL_BRAND_COLOR}\`.`);
    }

    for (const key of ['icon_small', 'icon_large']) {
      const iconPath = interfaceValues[key];
      if (!iconPath) {
        continue;
      }

      if (!isRelativePath(iconPath)) {
        errors.push(`interface.${key} must be a relative skill path.`);
        continue;
      }

      const resolvedIconPath = path.resolve(skillPath, iconPath);
      if (!(await pathExists(resolvedIconPath))) {
        errors.push(`interface.${key} points to a missing file: ${iconPath}`);
      }
    }

    if (actualOwner && interfaceValues.display_name) {
      const ownerLabel = `${actualOwner[0].toUpperCase()}${actualOwner.slice(1)} `;
      if (interfaceValues.display_name.startsWith(ownerLabel)) {
        warnings.push('display_name is owner-prefixed. Keep display_name unprefixed unless explicitly requested.');
      }
    }

    if (interfaceValues.short_description && !hasTanaabBasedPrefix(interfaceValues.short_description)) {
      errors.push(`interface.short_description must start with \`${CANON_DESCRIPTION_PREFIX.trim()}\`.`);
    }
  }

  for (const docName of AUXILIARY_DOCS) {
    if (await pathExists(path.join(skillPath, docName))) {
      warnings.push(`Auxiliary repo-style doc present inside the skill: ${docName}`);
    }
  }

  for (const resourceName of ['templates', 'assets', 'references', 'scripts']) {
    const resourcePath = path.join(skillPath, resourceName);
    if (!(await pathExists(resourcePath))) {
      continue;
    }

    const entries = await readdir(resourcePath);
    if (entries.length === 0) {
      warnings.push(`Empty optional resource directory: ${resourceName}/`);
    }

    if (resourceName !== 'scripts') {
      for (const entry of entries) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*(\.[a-z0-9]+)?$/.test(entry) && !entry.includes('.')) {
          warnings.push(`Repo-authored helper name should prefer kebab-case: ${resourceName}/${entry}`);
        }
      }
    }
  }

  return {
    errors,
    manualChecks,
    skillDir: skillPath,
    warnings,
  };
}
