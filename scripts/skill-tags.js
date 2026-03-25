export const SKILL_CATEGORY_TAGS = [
  'automation',
  'coding',
  'design',
  'docs',
  'frontend',
  'integration',
  'meta',
  'release',
  'research',
  'shell',
  'skills',
  'testing',
  'validation',
  'workflow',
];

export function isKnownCategoryTag(tag) {
  return SKILL_CATEGORY_TAGS.includes(String(tag ?? '').trim().toLowerCase());
}

export function inferCategoryTag({ description = '', displayName = '', slug = '' }) {
  const haystack = `${displayName} ${description} ${slug}`.toLowerCase();

  const rules = [
    ['meta', /\b(meta|canon|convention|prompt|template|packag|refin|standard)\w*/],
    ['validation', /\b(validat|verify|lint|check)\w*/],
    ['testing', /\b(test|coverage|assert|spec)\w*/],
    ['skills', /\b(skill|template|scaffold|creator|initializer|standardiz)\w*/],
    ['frontend', /\b(frontend|vue|react|component|css|scss|tailwind|vitepress)\w*/],
    ['design', /\b(design|brand|visual|ui|ux)\w*/],
    ['docs', /\b(doc|docs|documentation|readme|markdown|mdx|copy)\w*/],
    ['release', /\b(release|version|changelog|publish)\w*/],
    ['shell', /\b(shell|bash|zsh|cli|terminal|command[- ]line)\w*/],
    ['integration', /\b(github|gitlab|openai|api|mcp|webhook|integration)\w*/],
    ['coding', /\b(code|coding|typescript|javascript|bun|node|function|library)\w*/],
    ['research', /\b(research|investigat|audit|analysis)\w*/],
    ['automation', /\b(automate|automation|cron|scheduled|job|workflow)\w*/],
  ];

  for (const [tag, pattern] of rules) {
    if (pattern.test(haystack)) {
      return tag;
    }
  }

  return null;
}
