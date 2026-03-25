export const SKILL_TYPES = {
  generic: {
    id: 'generic',
    description:
      'Fallback skill type for cases where no narrower typed overlay clearly fits. Keep this as an escape hatch, not the default choice when a specific type matches.',
    defaultCategoryTag: 'workflow',
    sectionOrder: [
      '# ',
      '## Overview',
      '## When to Use',
      '## When Not to Use',
      '## Workflow',
      '## Bundled Resources',
      '## Validation',
    ],
    preWorkflowSectionPath: null,
    postWorkflowSectionPath: null,
  },
  coding: {
    id: 'coding',
    description:
      'For skills that modify, generate, refactor, debug, or explain code. Bias toward minimal diffs, preserving style, and explicit validation.',
    defaultCategoryTag: 'coding',
    sectionOrder: [
      '# ',
      '## Overview',
      '## When to Use',
      '## When Not to Use',
      '## Constraints',
      '## Change Strategy',
      '## Workflow',
      '## Bundled Resources',
      '## Validation',
    ],
    preWorkflowSectionPath: 'templates/skill-type-coding-sections.md',
    postWorkflowSectionPath: null,
  },
  integration: {
    id: 'integration',
    description:
      'For skills that operate against external tools, APIs, SaaS systems, MCP servers, CLIs, or service workflows. Bias toward prerequisites, interfaces, and failure handling.',
    defaultCategoryTag: 'integration',
    sectionOrder: [
      '# ',
      '## Overview',
      '## When to Use',
      '## When Not to Use',
      '## Prerequisites',
      '## Inputs',
      '## Outputs',
      '## Failure Handling',
      '## Workflow',
      '## Bundled Resources',
      '## Validation',
    ],
    preWorkflowSectionPath: 'templates/skill-type-integration-sections.md',
    postWorkflowSectionPath: null,
  },
  workflow: {
    id: 'workflow',
    description:
      'For repeatable operational processes that may span tools but are not primarily coding or integration implementation. Bias toward sequence, checkpoints, and completion criteria.',
    defaultCategoryTag: 'workflow',
    sectionOrder: [
      '# ',
      '## Overview',
      '## When to Use',
      '## When Not to Use',
      '## Preconditions',
      '## Workflow',
      '## Checkpoints',
      '## Completion Criteria',
      '## Bundled Resources',
      '## Validation',
    ],
    preWorkflowSectionPath: 'templates/skill-type-workflow-sections.md',
    postWorkflowSectionPath: 'templates/skill-type-workflow-post-sections.md',
  },
  meta: {
    id: 'meta',
    description:
      'For skills that create, refine, validate, package, or audit other skills, prompts, templates, or conventions. Bias toward structure, consistency, and evaluation.',
    defaultCategoryTag: 'meta',
    sectionOrder: [
      '# ',
      '## Overview',
      '## When to Use',
      '## When Not to Use',
      '## Evaluation Criteria',
      '## Anti-Patterns',
      '## Iteration Loop',
      '## Workflow',
      '## Bundled Resources',
      '## Validation',
    ],
    preWorkflowSectionPath: 'templates/skill-type-meta-sections.md',
    postWorkflowSectionPath: null,
  },
};

export const SKILL_TYPE_IDS = Object.keys(SKILL_TYPES);

export function getSkillType(type) {
  return SKILL_TYPES[String(type ?? '').trim().toLowerCase()] ?? null;
}

export function isKnownSkillType(type) {
  return getSkillType(type) !== null;
}

export function formatSkillTypeIds() {
  return SKILL_TYPE_IDS.join(', ');
}
