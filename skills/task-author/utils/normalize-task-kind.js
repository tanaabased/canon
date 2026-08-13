import { TASK_KINDS } from '../lib/task-author-contract.js';

/** Normalize a supported task kind; an omitted kind remains unknown. */
export function normalizeTaskKind(input) {
  if (input === null || input === undefined || String(input).trim() === '') return null;

  const value = String(input).trim().toLowerCase();
  if (!Object.hasOwn(TASK_KINDS, value)) {
    throw new Error(`Unsupported task kind: ${input}. Expected Task, Bug, or Feature.`);
  }
  return value;
}
