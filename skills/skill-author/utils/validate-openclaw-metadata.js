const OPENCLAW_OS_IDS = new Set(['darwin', 'linux', 'win32']);
const OPENCLAW_REQUIREMENT_LIST_KEYS = ['anyBins', 'bins', 'config', 'env'];

function isMapping(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateStringList(value, path, errors) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    errors.push(`${path} must be a list of nonempty strings when present.`);
  }
}

/**
 * Validates the canonical OpenClaw skill metadata surface.
 *
 * @param {unknown} openclaw Parsed metadata.openclaw value.
 * @returns {string[]} Validation errors.
 */
export default function validateOpenClawMetadata(openclaw) {
  const errors = [];

  if (!isMapping(openclaw)) {
    return ['SKILL.md frontmatter metadata.openclaw must be a mapping.'];
  }

  if (typeof openclaw.emoji !== 'string' || !openclaw.emoji.trim()) {
    errors.push('SKILL.md frontmatter metadata.openclaw.emoji must be a nonempty string.');
  }

  if (typeof openclaw.homepage !== 'string' || !openclaw.homepage.trim()) {
    errors.push('SKILL.md frontmatter metadata.openclaw.homepage must be a nonempty HTTPS URL.');
  } else {
    try {
      const homepage = new URL(openclaw.homepage);
      if (homepage.protocol !== 'https:') throw new Error('Expected HTTPS.');
    } catch {
      errors.push('SKILL.md frontmatter metadata.openclaw.homepage must be a nonempty HTTPS URL.');
    }
  }

  if (Object.hasOwn(openclaw, 'os')) {
    validateStringList(openclaw.os, 'SKILL.md frontmatter metadata.openclaw.os', errors);
    if (
      Array.isArray(openclaw.os) &&
      openclaw.os.some((os) => typeof os === 'string' && !OPENCLAW_OS_IDS.has(os))
    ) {
      errors.push('SKILL.md frontmatter metadata.openclaw.os contains an unsupported platform.');
    }
  }

  if (Object.hasOwn(openclaw, 'requires')) {
    if (!isMapping(openclaw.requires)) {
      errors.push(
        'SKILL.md frontmatter metadata.openclaw.requires must be a mapping when present.',
      );
    } else {
      for (const key of OPENCLAW_REQUIREMENT_LIST_KEYS) {
        if (Object.hasOwn(openclaw.requires, key)) {
          validateStringList(
            openclaw.requires[key],
            `SKILL.md frontmatter metadata.openclaw.requires.${key}`,
            errors,
          );
        }
      }
    }
  }

  return errors;
}
