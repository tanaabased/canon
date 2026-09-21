import normalizeRepositorySlug from './normalize-repository-slug.js';

function exactKeys(value, keys, label) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).sort().join(',') !== [...keys].sort().join(',')
  ) {
    throw new Error(`${label} must contain only ${keys.join(', ')}.`);
  }
}

function metadata(value, label, desired = false) {
  exactKeys(value, ['description', 'topics'], label);
  if (value.description !== null && typeof value.description !== 'string') {
    throw new Error(`${label}.description must be a string or null.`);
  }
  if (
    desired &&
    (typeof value.description !== 'string' ||
      !/^Tanaab-based \S/.test(value.description) ||
      /[\r\n]/.test(value.description) ||
      value.description.trim() !== value.description)
  ) {
    throw new Error('The desired description must be one line beginning with "Tanaab-based ".');
  }
  if (
    !Array.isArray(value.topics) ||
    value.topics.length > 20 ||
    value.topics.some((topic) => typeof topic !== 'string' || !/^[a-z0-9-]{1,50}$/.test(topic)) ||
    new Set(value.topics).size !== value.topics.length
  ) {
    throw new Error(
      `${label}.topics must contain at most 20 unique lowercase topics of 1–50 letters, digits, or hyphens.`,
    );
  }
  return { description: value.description, topics: [...value.topics].sort() };
}

/** Validates an exact, target-bound metadata proposal; current is null only for creation. */
export default function normalizeRepositoryMetadataPlan(value, slug) {
  exactKeys(value, ['target', 'current', 'desired'], 'Metadata plan');
  const target = normalizeRepositorySlug(value.target);
  if (target.toLowerCase() !== normalizeRepositorySlug(slug).toLowerCase()) {
    throw new Error('Metadata plan target does not match the requested repository.');
  }
  return {
    target,
    current: value.current === null ? null : metadata(value.current, 'current'),
    desired: metadata(value.desired, 'desired', true),
  };
}
