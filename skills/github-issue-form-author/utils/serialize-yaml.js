function isScalar(value) {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function scalar(value) {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  throw new Error(`Unsupported YAML scalar: ${typeof value}`);
}

function assertKey(key) {
  if (!/^[A-Za-z0-9_-]+$/.test(key)) throw new Error(`Unsupported YAML key: ${key}`);
}

function serializeObject(value, indent) {
  const prefix = ' '.repeat(indent);
  return Object.entries(value).flatMap(([key, child]) => {
    assertKey(key);
    if (isScalar(child)) return [`${prefix}${key}: ${scalar(child)}`];
    return [`${prefix}${key}:`, ...serializeNode(child, indent + 2)];
  });
}

function serializeArray(value, indent) {
  const prefix = ' '.repeat(indent);
  return value.flatMap((child) => {
    if (isScalar(child)) return [`${prefix}- ${scalar(child)}`];
    if (Array.isArray(child)) return [`${prefix}-`, ...serializeArray(child, indent + 2)];

    const entries = Object.entries(child);
    if (entries.length === 0) return [`${prefix}- {}`];
    const [[firstKey, firstValue], ...remaining] = entries;
    assertKey(firstKey);
    const firstLines = isScalar(firstValue)
      ? [`${prefix}- ${firstKey}: ${scalar(firstValue)}`]
      : [`${prefix}- ${firstKey}:`, ...serializeNode(firstValue, indent + 4)];
    return [...firstLines, ...serializeObject(Object.fromEntries(remaining), indent + 2)];
  });
}

function serializeNode(value, indent) {
  if (Array.isArray(value)) return serializeArray(value, indent);
  if (value && typeof value === 'object') return serializeObject(value, indent);
  return [`${' '.repeat(indent)}${scalar(value)}`];
}

/** Serialize the narrow object, array, and scalar subset used by GitHub issue forms. */
export function serializeYaml(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('YAML document must be a non-array object.');
  }
  return `${serializeObject(value, 0).join('\n')}\n`;
}
