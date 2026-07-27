const PACKAGE_SCRIPT_PATTERN = /\b(?:bun|npm|pnpm|yarn)\s+run\s+([a-zA-Z0-9:_-]+)/g;

/** Extracts package-script names referenced by package-manager run commands. */
export default function extractPackageScriptNames(content) {
  return [...String(content ?? '').matchAll(PACKAGE_SCRIPT_PATTERN)].map((match) => match[1]);
}
