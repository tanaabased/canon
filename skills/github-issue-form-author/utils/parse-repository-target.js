/** Parse one explicit GitHub OWNER/REPO target without inferring ambient repository state. */
export function parseRepositoryTarget(value) {
  const slug = String(value ?? '').trim();
  const match = slug.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (!match) throw new Error('Repository target must use the exact OWNER/REPO form.');
  return { owner: match[1], repo: match[2], slug };
}
