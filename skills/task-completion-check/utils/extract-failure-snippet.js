const FAILURE_MARKERS = [
  'error',
  'fail',
  'failed',
  'traceback',
  'exception',
  'assert',
  'panic',
  'fatal',
  'timeout',
  'segmentation fault',
];

export function tailFailureLines(text, maxLines) {
  if (maxLines <= 0) return '';
  return String(text).split('\n').slice(-maxLines).join('\n').trimEnd();
}

/**
 * Extracts bounded context around the final likely failure marker.
 *
 * @param {string} logText Full GitHub Actions log text.
 * @param {object} options Snippet bounds.
 * @returns {string} Bounded failure snippet.
 */
export default function extractFailureSnippet(logText, { context, maxLines }) {
  const lines = String(logText).split('\n');
  let markerIndex = null;

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const lowered = lines[index].toLowerCase();
    if (FAILURE_MARKERS.some((marker) => lowered.includes(marker))) {
      markerIndex = index;
      break;
    }
  }

  if (markerIndex === null) return tailFailureLines(logText, maxLines);
  const start = Math.max(0, markerIndex - context);
  const end = Math.min(lines.length, markerIndex + context);
  return lines.slice(start, end).slice(-maxLines).join('\n').trimEnd();
}
