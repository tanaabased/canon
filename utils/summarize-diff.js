/**
 * Summarizes entry drift counts for command output.
 *
 * @param {{changed: string[], extra: string[], missing: string[]}} diff Entry diff.
 * @returns {string} Compact drift summary.
 */
export default function summarizeDiff(diff) {
  const parts = [];
  if (diff.changed.length > 0) parts.push(`changed ${diff.changed.length}`);
  if (diff.missing.length > 0) parts.push(`missing ${diff.missing.length}`);
  if (diff.extra.length > 0) parts.push(`extra ${diff.extra.length}`);
  return parts.length > 0 ? parts.join(', ') : 'in sync';
}
