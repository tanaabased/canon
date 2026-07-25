/**
 * Validates and normalizes one explicit GitHub repository slug.
 *
 * @param {string} value Raw `OWNER/REPO` slug.
 * @returns {string} Trimmed explicit slug.
 * @throws {Error} When the slug is missing or has an unsupported shape.
 */
export default function normalizeRepositorySlug(value) {
  const slug = String(value ?? '').trim();
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(slug)) {
    throw new Error('Repository must use explicit OWNER/REPO form.');
  }

  return slug;
}
