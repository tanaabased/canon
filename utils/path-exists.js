import { stat } from 'node:fs/promises';

/**
 * Checks whether a filesystem path can be statted.
 *
 * @param {string} targetPath Path to inspect.
 * @returns {Promise<boolean>} Whether the path exists.
 */
export default async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}
