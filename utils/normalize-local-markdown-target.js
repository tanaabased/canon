function isExternalOrTemplated(target) {
  return (
    /^[a-z][a-z0-9+.-]*:/i.test(target) ||
    target.startsWith('{{') ||
    target.includes('{{') ||
    target.includes('}}')
  );
}

/** Normalizes a repository-local Markdown link target or returns null when it is external. */
export default function normalizeLocalMarkdownTarget(rawTarget) {
  const withoutTitle = String(rawTarget ?? '')
    .trim()
    .split(/\s+["'][^"']*["']$/)[0];
  const withoutAngles =
    withoutTitle.startsWith('<') && withoutTitle.endsWith('>')
      ? withoutTitle.slice(1, -1)
      : withoutTitle;
  const target = withoutAngles.split('#', 1)[0];

  return target && !isExternalOrTemplated(target) ? target : null;
}
