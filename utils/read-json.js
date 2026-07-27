import { readFile } from 'node:fs/promises';

/**
 * Reads and parses one JSON file.
 *
 * @param {string} targetPath JSON file path.
 * @returns {Promise<unknown>} Parsed JSON value.
 */
export default async function readJson(targetPath) {
  return JSON.parse(await readFile(targetPath, 'utf8'));
}
