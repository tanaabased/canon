import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { runCLI } from '@tanaab/codex-tools';

import cloudConfig from '../cloud.config.js';

if (process.env.CI !== 'true' || process.argv.length !== 2) {
  throw new Error('Run bun run build:plugin with no arguments in a disposable CI checkout.');
}

function isSelected(file, input = []) {
  const patterns = Array.isArray(input) ? input : [input];
  return (
    patterns.some((pattern) => !pattern.startsWith('!') && path.matchesGlob(file, pattern)) &&
    !patterns.some((pattern) => pattern.startsWith('!') && path.matchesGlob(file, pattern.slice(1)))
  );
}

const tracked = execFileSync('git', ['ls-files', '--cached', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);
const shared = tracked.filter((file) => /^(references|templates)\//.test(file));
const documents = tracked.filter(
  (file) => path.basename(file) === 'SKILL.md' && isSelected(file, cloudConfig.skills),
);
for (const document of documents) {
  const directory = path.dirname(document);
  const configFile = path.join(directory, 'build.config.js');
  if (!tracked.includes(configFile)) throw new Error(`${configFile}: required for Canon skills.`);

  const { default: config } = await import(pathToFileURL(path.resolve(configFile)).href);
  const missingCopy = shared.find((file) => !isSelected(file, config.copy));
  if (missingCopy) {
    throw new Error(`${configFile}: shared resource is not selected: ${missingCopy}`);
  }
  const uncovered = tracked.find(
    (file) =>
      file.startsWith(`${directory}/scripts/`) &&
      !isSelected(path.relative(directory, file), config.entrypoints),
  );
  if (uncovered) {
    throw new Error(`${configFile}: command must match entrypoints: ${uncovered}`);
  }
}
process.exitCode = await runCLI(['cloud', 'package', 'cloud.config.js']);
