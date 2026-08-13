const BODY_SHAPES = Object.freeze({
  task: [
    ['Context', 'context'],
    ['Objective', 'objective'],
    ['Scope', null],
    ['In scope', 'inScope', 3],
    ['Out of scope', 'outOfScope', 3],
    ['Acceptance criteria', 'acceptanceCriteria'],
    ['Constraints and notes', 'constraints', 2, true],
  ],
  bug: [
    ['Observed behavior', 'observedBehavior'],
    ['Expected behavior', 'expectedBehavior'],
    ['Reproduction or evidence', 'reproduction'],
    ['Impact', 'impactSummary'],
    ['Acceptance criteria', 'acceptanceCriteria'],
  ],
  feature: [
    ['Problem or opportunity', 'problem'],
    ['Desired outcome', 'desiredOutcome'],
    ['Scope', null],
    ['In scope', 'inScope', 3],
    ['Out of scope', 'outOfScope', 3],
    ['Acceptance criteria', 'acceptanceCriteria'],
    ['Alternatives and constraints', 'alternatives', 2, true],
  ],
});

function present(value) {
  return Array.isArray(value) ? value.length > 0 : typeof value === 'string' && value.trim() !== '';
}

function renderValue(key, value) {
  if (!present(value)) return '';
  if (key === 'acceptanceCriteria') {
    return value.map((item) => `- [ ] ${String(item).trim()}`).join('\n');
  }
  return Array.isArray(value)
    ? value.map((item) => `- ${String(item).trim()}`).join('\n')
    : String(value).trim();
}

/** Render canonical Markdown headings while leaving unsupported evidence visibly missing. */
export function renderTaskBody(kind, sections = {}) {
  if (!BODY_SHAPES[kind]) throw new Error(`Cannot render body for unsupported task kind: ${kind}`);

  const missing = [];
  const blocks = [];
  for (const [heading, key, level = 2, optional = false] of BODY_SHAPES[kind]) {
    if (key === null) {
      blocks.push(`${'#'.repeat(level)} ${heading}`);
      continue;
    }

    const value = sections[key];
    if (optional && !present(value)) continue;
    if (!optional && !present(value)) missing.push(key);

    let content = renderValue(key, value);
    if (kind === 'bug' && key === 'reproduction' && present(sections.environment)) {
      content = [content, `### Environment\n\n${renderValue('environment', sections.environment)}`]
        .filter(Boolean)
        .join('\n\n');
    }
    blocks.push(`${'#'.repeat(level)} ${heading}\n\n${content}`.trimEnd());
  }

  return { body: `${blocks.join('\n\n')}\n`, missing };
}
