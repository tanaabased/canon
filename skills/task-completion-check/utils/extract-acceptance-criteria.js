const TASK_LIST_ITEM_PATTERN = /^\s*(?:[-*+]|\d+[.)])\s+\[([ xX])\]\s+(.+?)\s*$/gm;

/**
 * Extracts structured acceptance criteria from Markdown task-list items.
 *
 * @param {string} body GitHub Issue body.
 * @returns {{complete: boolean, text: string}[]} Acceptance criteria in source order.
 */
export default function extractAcceptanceCriteria(body) {
  return [...String(body ?? '').matchAll(TASK_LIST_ITEM_PATTERN)].map((match) => ({
    complete: match[1].toLowerCase() === 'x',
    text: match[2].trim(),
  }));
}
