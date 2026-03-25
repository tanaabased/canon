import skillTagsData from '../references/skill-tags.json';

export const SKILL_CATEGORY_TAGS = skillTagsData.category_tags;
export const SKILL_INFERENCE_RULES = skillTagsData.inference_rules.map((rule) => [
  rule.tag,
  new RegExp(rule.pattern),
]);

export function isKnownCategoryTag(tag) {
  return SKILL_CATEGORY_TAGS.includes(String(tag ?? '').trim().toLowerCase());
}

export function inferCategoryTag({ description = '', displayName = '', slug = '' }) {
  const haystack = `${displayName} ${description} ${slug}`.toLowerCase();

  for (const [tag, pattern] of SKILL_INFERENCE_RULES) {
    if (pattern.test(haystack)) {
      return tag;
    }
  }

  return null;
}
