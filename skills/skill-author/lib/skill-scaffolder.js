import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import smallIcon from '../assets/icon-small.svg' with { type: 'text' };

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
import resolveOpenClawHomepage from '../utils/resolve-openclaw-homepage.js';
import resolveSkillContainer from '../utils/resolve-skill-container.js';
import resolveSkillOwner from '../utils/resolve-skill-owner.js';
import {
  CANON_DESCRIPTION_PREFIX,
  CANON_SKILL_BRAND_COLOR,
  CANON_SKILL_HOMEPAGE_BASE,
  CANON_SKILL_LICENSE,
  CANON_SKILL_PREFIX,
  SKILL_OWNER_IDS,
  SKILLS_ROOT_DIR,
  formatSkillTypeIds,
  getSkillNamespacePrefix,
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
  return JSON.stringify(String(value));
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

async function publishSkill(staged, destination, force) {
  // Concurrent scaffolders must leave an in-progress replacement and its backup alone.
  const lock = path.join(path.dirname(destination), `.${path.basename(destination)}.publish`);
  const backup = path.join(lock, 'previous');
  try {
    await mkdir(lock);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    throw new Error(
      [
        'Skill publication is locked.',
        `Destination: ${destination}`,
        `Publication lock: ${lock}`,
        `Possible backup: ${backup}`,
        'Check running init-skill.js processes and their output directories (for example, with ps -ef on Unix). If this directory is shared, check other hosts too.',
        'If a publisher may still be active, leave the lock and both copies untouched. Lock age is not proof that publication stopped.',
        'Once you confirm no publisher is active, prevent new runs during recovery. Inspect the destination and backup. If the destination is missing, the backup may be your only copy. If both exist, keep both until you verify which skill to use.',
        'Before clearing the lock, save any backup outside it and preserve any destination you want to keep. Restore the saved skill if needed. Retry only if you still intend to scaffold; --force can replace the destination.',
      ].join('\n'),
      { cause: error },
    );
  }
  let preserveBackup = false;
  try {
    if (await pathExists(destination)) {
      if (!force) throw new Error(`Skill directory already exists: ${destination}`);
      await rename(destination, backup);
      preserveBackup = true;
    }
    await rename(staged, destination);
    preserveBackup = false;
  } catch (error) {
    if (preserveBackup) {
      try {
        await rename(backup, destination);
        preserveBackup = false;
      } catch (restoreError) {
        throw new Error(
          `Original skill preserved at ${backup} after replacement failed: ${error.message}`,
          { cause: restoreError },
        );
      }
    }
    throw error;
  } finally {
    if (!preserveBackup) await rm(lock, { recursive: true });
  }
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
  const owner = resolveSkillOwner(options.owner);
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
    (SKILL_OWNER_IDS.includes(categoryTagOverride) || categoryTagOverride === type)
  ) {
    throw new Error('Category tag override must add one tag beyond supported owners and type.');
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
  if (SKILL_OWNER_IDS.includes(categoryTag) || categoryTag === type) {
    throw new Error('Category tag must add one tag beyond supported owners and type.');
  }

  const tags = [owner, type, categoryTag];
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

  // Load the artwork asynchronously so synchronous Bun consumers can import the scaffolder.
  const { default: largeIcon } = await import('../utils/large-icon.js');
  const skillContent = renderSkillTemplate(typeDefinition.templateBody, {
    description: normalizedDescription,
    description_yaml: quoteYaml(normalizedDescription),
    display_name: displayName,
    license: CANON_SKILL_LICENSE,
    metadata_tags_yaml: renderMetadataTagsYaml(tags),
    openclaw_emoji: quoteYaml(openclawEmoji),
    openclaw_homepage: quoteYaml(openclawHomepage),
    owner,
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

  await mkdir(outputDir, { recursive: true });
  const temporary = await mkdtemp(path.join(outputDir, '.skill-author-'));
  const staged = path.join(temporary, 'staged', folderName);
  try {
    await mkdir(path.join(staged, 'agents'), { recursive: true });
    await mkdir(path.join(staged, 'assets'));
    await writeFile(path.join(staged, 'SKILL.md'), skillContent, 'utf8');
    await writeFile(path.join(staged, 'agents/openai.yaml'), openAiContent, 'utf8');
    await writeFile(path.join(staged, 'assets/icon-small.svg'), smallIcon);
    await writeFile(path.join(staged, 'assets/icon-large.png'), largeIcon);

    const result = await validateSkillDir(staged, {
      container,
      expectedType: type,
      namespace,
      owner,
    });
    if (result.errors.length) {
      throw new Error(`Generated skill failed validation.\n${formatSkillValidationReport(result)}`);
    }

    await publishSkill(staged, skillDir, options.force);
    return { result: { ...result, skillDir }, skillDir };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
