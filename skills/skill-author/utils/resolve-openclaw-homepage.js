import path from 'node:path';

/**
 * Resolves the OpenClaw homepage for a generated skill.
 *
 * @param {object} options Homepage resolution inputs.
 * @param {string} options.canonicalHomepageBase Canonical repository skill URL.
 * @param {string} options.canonicalSkillsRoot Canonical skills directory.
 * @param {string} options.folderName Generated skill folder name.
 * @param {string} [options.homepage] Explicit homepage override.
 * @param {string} options.outputDir Requested skill output directory.
 * @returns {string} Resolved homepage URL.
 */
export default function resolveOpenClawHomepage({
  canonicalHomepageBase,
  canonicalSkillsRoot,
  folderName,
  homepage,
  outputDir,
}) {
  const explicitHomepage = String(homepage ?? '').trim();
  if (explicitHomepage) return explicitHomepage;

  if (path.resolve(outputDir) !== path.resolve(canonicalSkillsRoot)) {
    throw new Error(
      'OpenClaw homepage is required when --output-dir differs from the canonical skills directory.',
    );
  }

  return `${String(canonicalHomepageBase).replace(/\/$/, '')}/${folderName}`;
}
