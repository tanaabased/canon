import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  CANON_DESCRIPTION_PREFIX,
  CANON_SKILL_BRAND_COLOR,
  CANON_SKILL_LICENSE,
  CANON_SKILL_OWNER,
  CANON_SKILL_PREFIX_WITH_HYPHEN,
} from './skill-contract-lib.js';
import { isKnownCategoryTag } from './skill-tags-lib.js';
import { formatSkillTypeIds, getSkillType, isKnownSkillType } from './skill-types-lib.js';

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

  const lines = match[1].split('\n');
  const indentOf = (line) => line.match(/^ */)?.[0].length ?? 0;
  const listPattern = (indent) => new RegExp(`^\\s{${indent}}-\\s+(.+)$`);
  const keyPattern = (indent) => new RegExp(`^\\s{${indent}}([a-z][a-z0-9_-]*):(.*)$`);

  function parseList(startIndex, indent) {
    const items = [];
    let index = startIndex;

    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) {
        index += 1;
        continue;
      }

      if (indentOf(line) < indent) {
        break;
      }

      const matchList = line.match(listPattern(indent));
      if (!matchList) {
        break;
      }

      items.push(unquoteYaml(matchList[1]));
      index += 1;
    }

    return { value: items, nextIndex: index };
  }

  function parseMap(startIndex, indent) {
    const entries = {};
    let index = startIndex;

    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) {
        index += 1;
        continue;
      }

      if (indentOf(line) < indent) {
        break;
      }

      const matchEntry = line.match(keyPattern(indent));
      if (!matchEntry) {
        break;
      }

      const [, key, rawValue] = matchEntry;
      const value = rawValue.trim();

      if (value) {
        if (value.startsWith('[') && value.endsWith(']')) {
          entries[key] = value
            .slice(1, -1)
            .split(',')
            .map((item) => unquoteYaml(item))
            .filter(Boolean);
        } else {
          entries[key] = unquoteYaml(value);
        }
        index += 1;
        continue;
      }

      const nextLine = lines[index + 1];
      if (!nextLine || !nextLine.trim() || indentOf(nextLine) <= indent) {
        entries[key] = '';
        index += 1;
        continue;
      }

      if (nextLine.match(listPattern(indent + 2))) {
        const parsedList = parseList(index + 1, indent + 2);
        entries[key] = parsedList.value;
        index = parsedList.nextIndex;
        continue;
      }

      if (nextLine.match(keyPattern(indent + 2))) {
        const parsedMap = parseMap(index + 1, indent + 2);
        entries[key] = parsedMap.value;
        index = parsedMap.nextIndex;
        continue;
      }

      entries[key] = '';
      index += 1;
    }

    return { value: entries, nextIndex: index };
  }

  return parseMap(0, 0).value;
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

function getSkillMetadata(frontmatter) {
  if (!frontmatter || typeof frontmatter !== 'object') {
    return null;
  }

  const metadata = frontmatter.metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  return metadata;
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
      const metadata = getSkillMetadata(frontmatter);
      const declaredType = metadata?.type;
      const declaredOwner = metadata?.owner;
      const declaredTags = metadata?.tags;

      if (!frontmatter.name) {
        errors.push("SKILL.md frontmatter must contain 'name'.");
      }
      if (!frontmatter.description) {
        errors.push("SKILL.md frontmatter must contain 'description'.");
      }
      if (!frontmatter.license) {
        errors.push("SKILL.md frontmatter must contain 'license'.");
      }
      if (!frontmatter.metadata) {
        errors.push("SKILL.md frontmatter must contain 'metadata'.");
      }
      if (!metadata) {
        errors.push("SKILL.md frontmatter 'metadata' must be a mapping.");
      }
      if (Object.hasOwn(frontmatter, 'type')) {
        errors.push("Use SKILL.md frontmatter `metadata.type`, not top-level `type`.");
      }
      if (Object.hasOwn(frontmatter, 'owner')) {
        errors.push("Use SKILL.md frontmatter `metadata.owner`, not top-level `owner`.");
      }
      if (Object.hasOwn(frontmatter, 'tags')) {
        errors.push("Use SKILL.md frontmatter `metadata.tags`, not top-level `tags`.");
      }

      if (!declaredType) {
        errors.push("SKILL.md frontmatter metadata must contain 'type'.");
      }
      if (!declaredOwner) {
        errors.push("SKILL.md frontmatter metadata must contain 'owner'.");
      }
      if (!declaredTags) {
        errors.push("SKILL.md frontmatter metadata must contain 'tags'.");
      }

      if (declaredType && typeof declaredType !== 'string') {
        errors.push("SKILL.md frontmatter metadata.type must be a string.");
      }
      if (declaredOwner && typeof declaredOwner !== 'string') {
        errors.push("SKILL.md frontmatter metadata.owner must be a string.");
      }

      if (typeof declaredType === 'string') {
        actualType = declaredType.trim().toLowerCase() || actualType;
      }
      if (typeof declaredOwner === 'string') {
        actualOwner = declaredOwner.trim().toLowerCase() || actualOwner;
      }

      if (requestedType && declaredType && declaredType !== requestedType) {
        errors.push(`SKILL.md metadata.type must match the requested type: expected \`${requestedType}\`.`);
      }
      if (declaredOwner && declaredOwner !== CANON_SKILL_OWNER) {
        errors.push(`SKILL.md metadata.owner must be \`${CANON_SKILL_OWNER}\`.`);
      }
      if (declaredType && !isKnownSkillType(declaredType)) {
        errors.push(`SKILL.md metadata.type must be one of: ${formatSkillTypeIds()}`);
      }
      if (frontmatter.description && !hasTanaabBasedPrefix(frontmatter.description)) {
        errors.push(`Frontmatter description must start with \`${CANON_DESCRIPTION_PREFIX.trim()}\`.`);
      }
      if (frontmatter.license && frontmatter.license !== CANON_SKILL_LICENSE) {
        errors.push(`Frontmatter license must equal \`${CANON_SKILL_LICENSE}\`.`);
      }

      if (frontmatter.name && frontmatter.name !== folderName) {
        errors.push(`Frontmatter name must match the folder name exactly: expected \`${folderName}\`.`);
      }
      if (frontmatter.name && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(frontmatter.name)) {
        errors.push('Frontmatter name must use lowercase letters, digits, and single hyphens only.');
      }

      if (declaredTags && !Array.isArray(declaredTags)) {
        errors.push("SKILL.md frontmatter metadata.tags must be a list of strings.");
      }

      if (Array.isArray(declaredTags)) {
        const normalizedTags = declaredTags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean);
        if (normalizedTags.length === 0) {
          errors.push("SKILL.md frontmatter metadata.tags must not be empty.");
        }
        if (new Set(normalizedTags).size !== normalizedTags.length) {
          errors.push("SKILL.md frontmatter metadata.tags must not contain duplicates.");
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
