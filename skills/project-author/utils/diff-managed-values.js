function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function equalValues(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function comparable(value) {
  return value === undefined ? null : value;
}

/**
 * Returns stable field-level drift for managed desired-state keys.
 * Current-only keys are ignored so unmanaged remote state is preserved.
 *
 * @param {unknown} current Normalized current state.
 * @param {unknown} desired Normalized desired state.
 * @param {string} [pathPrefix] Dot path used for recursive calls.
 * @returns {Array<{current: unknown, desired: unknown, path: string}>} Sorted managed changes.
 */
export default function diffManagedValues(current, desired, pathPrefix = '') {
  if (equalValues(current, desired)) {
    return [];
  }

  const canCompareObject =
    isPlainObject(desired) && (isPlainObject(current) || current === null || current === undefined);
  if (canCompareObject) {
    return Object.keys(desired)
      .sort((left, right) => left.localeCompare(right))
      .flatMap((key) => {
        const nextPath = pathPrefix ? `${pathPrefix}.${key}` : key;
        return diffManagedValues(current?.[key], desired[key], nextPath);
      });
  }

  return [
    {
      current: comparable(current),
      desired: comparable(desired),
      path: pathPrefix || '<root>',
    },
  ];
}
