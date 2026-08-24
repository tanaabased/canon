const START = '<!-- tanaab-task-decomposer:rollup:start -->';
const END = '<!-- tanaab-task-decomposer:rollup:end -->';
const MANAGED_BLOCK = new RegExp(`${START}[\\s\\S]*?${END}\\s*`, 'g');

/** Remove only the Task Decomposer-managed rollup before semantic body parsing. */
export function stripParentRollup(body) {
  return String(body ?? '')
    .replace(MANAGED_BLOCK, '')
    .trimEnd();
}

/** Append one managed shallow-child rollup while replacing an earlier managed rollup. */
export function renderParentRollup(body, children) {
  const base = stripParentRollup(body);
  const rows = children.map(
    ({ key, task }) => `- [ ] {{child:${key}}} — ${String(task.title).trim()}`,
  );
  return `${base}\n\n${START}\n## Child task rollup\n\nThis parent tracks the bounded outcome; child completion does not by itself close this task.\n\n${rows.join('\n')}\n${END}\n`;
}

/** Resolve only known managed child placeholders into exact GitHub links. */
export function resolveParentRollup(bodyTemplate, childReferences) {
  return String(bodyTemplate).replace(/\{\{child:([a-z0-9-]+)\}\}/g, (placeholder, key) => {
    const reference = childReferences[key];
    if (!reference) throw new Error(`No created or reused issue resolves ${placeholder}.`);
    return `[#${reference.number}](${reference.url})`;
  });
}
