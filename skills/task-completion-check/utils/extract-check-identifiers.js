/**
 * Extracts GitHub Actions run and job ids from a check details URL.
 *
 * @param {string} url Check details URL.
 * @returns {{jobId: string | null, runId: string | null}} Parsed identifiers.
 */
export default function extractCheckIdentifiers(url) {
  const value = String(url ?? '');
  const runMatch = value.match(/\/actions\/runs\/(\d+)/) ?? value.match(/\/runs\/(\d+)/);
  const jobMatch = value.match(/\/actions\/runs\/\d+\/job\/(\d+)/) ?? value.match(/\/job\/(\d+)/);

  return {
    jobId: jobMatch?.[1] ?? null,
    runId: runMatch?.[1] ?? null,
  };
}
