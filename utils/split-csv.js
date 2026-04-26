export default function splitCsv(value) {
  const rawValues = Array.isArray(value) ? value : [value];

  return rawValues
    .flatMap((rawValue) => String(rawValue ?? '').split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);
}
