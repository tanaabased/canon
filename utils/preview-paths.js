const DEFAULT_MAX_PREVIEW = 5;

/**
 * Returns a bounded path preview with an optional remaining-count line.
 *
 * @param {string[]} paths Relative paths to preview.
 * @param {number} [maxPreview=DEFAULT_MAX_PREVIEW] Maximum concrete paths.
 * @returns {string[]} Preview paths plus an optional count line.
 */
export default function previewPaths(paths, maxPreview = DEFAULT_MAX_PREVIEW) {
  if (paths.length === 0) {
    return [];
  }

  const preview = paths.slice(0, maxPreview);
  if (paths.length > maxPreview) {
    preview.push(`... ${paths.length - maxPreview} more`);
  }

  return preview;
}
