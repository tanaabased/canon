import path from 'node:path';
import { fileURLToPath } from 'node:url';

import bundledLargeIconImport from '../assets/icon-large.png';
import bundledSmallIconImport from '../assets/icon-small.svg';
import codingTemplateText from '../templates/coding.md' with { type: 'text' };
import extractTopLevelSkillHeadings from '../utils/extract-top-level-skill-headings.js';
import genericTemplateText from '../templates/generic.md' with { type: 'text' };
import integrationTemplateText from '../templates/integration.md' with { type: 'text' };
import metaTemplateText from '../templates/meta.md' with { type: 'text' };
import workflowTemplateText from '../templates/workflow.md' with { type: 'text' };
import { splitLeadingSkillFrontmatter } from '../utils/parse-skill-frontmatter.js';

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_TEXT_IMPORTS = [
  genericTemplateText,
  codingTemplateText,
  integrationTemplateText,
  workflowTemplateText,
  metaTemplateText,
];

export const CANON_SKILL_OWNER = 'tanaab';
export const CANON_SKILL_PREFIX = 'tanaab';
export const CANON_SKILL_PREFIX_WITH_HYPHEN = `${CANON_SKILL_PREFIX}-`;
export const CANON_SKILL_LICENSE = 'MIT';
export const CANON_SKILL_BRAND_COLOR = '#00c88a';
export const CANON_SKILL_HOMEPAGE_BASE = 'https://github.com/tanaabased/canon/tree/main/skills';
export const CANON_DESCRIPTION_PREFIX = 'Tanaab-based ';
export const SKILLS_ROOT_DIR = path.resolve(LIB_DIR, '..', '..');

function buildTemplateDefinition(templateContent) {
  const { body, frontmatter } = splitLeadingSkillFrontmatter(templateContent);
  const id = String(frontmatter?.template_type ?? '')
    .trim()
    .toLowerCase();
  const defaultCategoryTag = String(frontmatter?.default_category_tag ?? '')
    .trim()
    .toLowerCase();
  const optionalTopLevelHeadings = Array.isArray(frontmatter?.optional_top_level_headings)
    ? frontmatter.optional_top_level_headings.map((heading) =>
        /^#\s/.test(String(heading).trim()) ? '# ' : String(heading).trim(),
      )
    : [];

  if (!id || !defaultCategoryTag) {
    throw new Error('Template metadata must include template_type and default_category_tag.');
  }

  return {
    defaultCategoryTag,
    id,
    optionalTopLevelHeadings,
    sectionOrder: extractTopLevelSkillHeadings(body),
    templateBody: body.trimStart(),
  };
}

export const SKILL_TEMPLATES = Object.freeze(
  Object.fromEntries(
    TEMPLATE_TEXT_IMPORTS.map((templateContent) => {
      const definition = buildTemplateDefinition(templateContent);
      return [definition.id, definition];
    }),
  ),
);

export const SKILL_TYPE_IDS = Object.keys(SKILL_TEMPLATES);

export function getSkillType(type) {
  const normalizedType = String(type ?? '')
    .trim()
    .toLowerCase();
  return SKILL_TEMPLATES[normalizedType] ?? null;
}

export function isKnownSkillType(type) {
  return getSkillType(type) !== null;
}

export function formatSkillTypeIds() {
  return SKILL_TYPE_IDS.join(', ');
}

export function getBundledSmallIconPath() {
  return path.isAbsolute(bundledSmallIconImport)
    ? bundledSmallIconImport
    : path.resolve(LIB_DIR, bundledSmallIconImport);
}

export function getBundledLargeIconPath() {
  return path.isAbsolute(bundledLargeIconImport)
    ? bundledLargeIconImport
    : path.resolve(LIB_DIR, bundledLargeIconImport);
}

export function stripOwnerPrefix(value) {
  const normalized = String(value ?? '').trim();
  return normalized.startsWith(CANON_SKILL_PREFIX_WITH_HYPHEN)
    ? normalized.slice(CANON_SKILL_PREFIX_WITH_HYPHEN.length)
    : normalized;
}

export function renderMetadataTagsYaml(tags) {
  return tags.map((tag) => `    - ${tag}`).join('\n');
}
