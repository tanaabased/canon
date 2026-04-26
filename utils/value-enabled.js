export default function valueEnabled(value, fallback = false) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return Boolean(fallback);
  }

  const normalized = String(value).trim().toLowerCase();
  if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) {
    return false;
  }

  if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) {
    return true;
  }

  return true;
}
