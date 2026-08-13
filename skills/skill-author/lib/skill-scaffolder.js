import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import pathExists from '../../../utils/path-exists.js';
import formatSkillValidationReport from '../utils/format-skill-validation-report.js';
import inferSkillCategoryTag from '../utils/infer-skill-category-tag.js';
import isKebabCaseId from '../utils/is-kebab-case-id.js';
import normalizeSkillDescription, {
  makeShortSkillDescription,
  makeSkillDefaultPrompt,
} from '../utils/normalize-skill-description.js';
import normalizeSkillNamespace from '../utils/normalize-skill-namespace.js';
import renderSkillTemplate from '../utils/render-skill-template.js';
import resolveSkillContainer from '../utils/resolve-skill-container.js';
import resolveOpenClawHomepage from '../utils/resolve-openclaw-homepage.js';
import {
  CANON_DESCRIPTION_PREFIX,
  CANON_SKILL_BRAND_COLOR,
  CANON_SKILL_HOMEPAGE_BASE,
  CANON_SKILL_LICENSE,
  CANON_SKILL_OWNER,
  CANON_SKILL_PREFIX,
  SKILLS_ROOT_DIR,
  formatSkillTypeIds,
  getSkillNamespacePrefix,
  getBundledLargeIconPath,
  getBundledSmallIconPath,
  getSkillType,
  isPluginSkillContainer,
  renderMetadataTagsYaml,
  stripSkillNamespace,
} from './skill-contract.js';
import { validateSkillDir } from './skill-validator.js';

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function normalizeSlug(value) {
  const slug = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!slug) throw new Error('Slug must contain at least one letter or digit.');
  return slug;
}

function quoteYaml(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function makeOpenAiYaml({ brandColor, displayName, shortDescription, defaultPrompt }) {
  return `interface:
  display_name: ${quoteYaml(displayName)}
  short_description: ${quoteYaml(shortDescription)}
  icon_small: "./assets/icon-small.svg"
  icon_large: "./assets/icon-large.png"
  brand_color: ${quoteYaml(brandColor)}
  default_prompt: ${quoteYaml(defaultPrompt)}
`;
}

/**
 * Creates and validates one skill from the canonical type contract.
 *
 * @param {object} options Authored skill values, public namespace/container context, and filesystem options.
 * @returns {Promise<{result: object, skillDir: string}>} Created path and validation report.
 */
export async function initializeSkill(options) {
  const type = String(options.type ?? '')
    .trim()
    .toLowerCase();
  const rawSlug = normalizeSlug(options.slug ?? '');
  const categoryTagOverride = String(options.categoryTag ?? '')
    .trim()
    .toLowerCase();
  const displayName = String(options.displayName ?? '').trim();
  const description = String(options.description ?? '').trim();
  const openclawEmoji = String(options.openclawEmoji ?? '').trim();
  const namespace = normalizeSkillNamespace(options.namespace);
  const namespacePrefix = getSkillNamespacePrefix(namespace);
  const descriptionPrefix = namespace === CANON_SKILL_PREFIX ? CANON_DESCRIPTION_PREFIX : '';
  const brandColor = String(options.brandColor ?? CANON_SKILL_BRAND_COLOR).trim();

  if (!type) throw new Error('Type is required.');
  if (!displayName) throw new Error('Display name is required.');
  if (!description) throw new Error('Description is required.');
  if (!openclawEmoji) throw new Error('OpenClaw emoji is required.');
  if (!HEX_COLOR_PATTERN.test(brandColor)) {
    throw new Error('Brand color must be a six-digit hexadecimal color.');
  }

  const typeDefinition = getSkillType(type);
  if (!typeDefinition) {
    throw new Error(`Unknown type: ${type}. Allowed types: ${formatSkillTypeIds()}`);
  }
  if (categoryTagOverride && !isKebabCaseId(categoryTagOverride)) {
    throw new Error(
      `Category tag must use lowercase letters, digits, and hyphens only: ${categoryTagOverride}`,
    );
  }
  if (
    categoryTagOverride &&
    (categoryTagOverride === CANON_SKILL_OWNER || categoryTagOverride === type)
  ) {
    throw new Error('Category tag override must add one tag beyond owner and type.');
  }

  const normalizedDescription = normalizeSkillDescription(description, { descriptionPrefix });
  const slug = rawSlug.startsWith(namespacePrefix)
    ? rawSlug.slice(namespacePrefix.length)
    : rawSlug;
  const skillId = `${namespacePrefix}${slug}`;
  const inferredCategoryTag = inferSkillCategoryTag({
    description: normalizedDescription,
    displayName,
    slug: skillId,
    type,
  });
  const categoryTag =
    categoryTagOverride || inferredCategoryTag || typeDefinition.defaultCategoryTag;

  if (!categoryTag || !isKebabCaseId(categoryTag)) {
    throw new Error(`Category tag must be a kebab-case id: ${categoryTag || '<empty>'}`);
  }
  if (categoryTag === CANON_SKILL_OWNER || categoryTag === type) {
    throw new Error('Category tag must add one tag beyond owner and type.');
  }

  const tags = [CANON_SKILL_OWNER, type, categoryTag];
  const outputDir = path.resolve(options.outputDir ?? SKILLS_ROOT_DIR);
  const container = await resolveSkillContainer(outputDir, options.container);
  const folderName = isPluginSkillContainer(container)
    ? stripSkillNamespace(skillId, namespace)
    : skillId;
  const skillDir = path.resolve(outputDir, folderName);
  const openclawHomepage = resolveOpenClawHomepage({
    canonicalHomepageBase: CANON_SKILL_HOMEPAGE_BASE,
    canonicalSkillsRoot: SKILLS_ROOT_DIR,
    folderName,
    homepage: options.openclawHomepage,
    outputDir,
  });

  if ((await pathExists(skillDir)) && !options.force) {
    throw new Error(`Skill directory already exists: ${skillDir}`);
  }
  if (options.force) await rm(skillDir, { force: true, recursive: true });

  const agentsDir = path.join(skillDir, 'agents');
  const assetsDir = path.join(skillDir, 'assets');
  await mkdir(agentsDir, { recursive: true });
  await mkdir(assetsDir, { recursive: true });

  const skillContent = renderSkillTemplate(typeDefinition.templateBody, {
    description: normalizedDescription,
    display_name: displayName,
    license: CANON_SKILL_LICENSE,
    metadata_tags_yaml: renderMetadataTagsYaml(tags),
    openclaw_emoji: quoteYaml(openclawEmoji),
    openclaw_homepage: quoteYaml(openclawHomepage),
    owner: CANON_SKILL_OWNER,
    skill_id: skillId,
    type,
  });
  const defaultPrompt =
    String(options.prompt ?? '').trim() ||
    makeSkillDefaultPrompt(skillId, normalizedDescription, { descriptionPrefix });
  const openAiContent = makeOpenAiYaml({
    brandColor,
    defaultPrompt,
    displayName,
    shortDescription: makeShortSkillDescription(normalizedDescription, { descriptionPrefix }),
  });

  await Promise.all([
    writeFile(path.join(skillDir, 'SKILL.md'), skillContent, 'utf8'),
    writeFile(path.join(agentsDir, 'openai.yaml'), openAiContent, 'utf8'),
    copyFile(getBundledSmallIconPath(), path.join(assetsDir, 'icon-small.svg')),
    copyFile(getBundledLargeIconPath(), path.join(assetsDir, 'icon-large.png')),
  ]);

  const result = await validateSkillDir(skillDir, {
    container,
    expectedType: type,
    namespace,
  });
  if (result.errors.length > 0) {
    throw new Error(`Generated skill failed validation.\n${formatSkillValidationReport(result)}`);
  }

  return { result, skillDir };
}
