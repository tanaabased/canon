import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { collectPluginInfo } from '../../../lib/plugin-info.js' with { type: 'macro' };

const args = process.argv.slice(2);
const usage = 'Usage: bun plugin-info.js';
if (args.length === 1 && args[0] === '--help') {
  process.stdout.write(`${usage}\nPrint the Canon package identity and shipped skills as JSON.\n`);
  process.exit(0);
}
if (args.length) throw new Error(usage);

const info = collectPluginInfo();
const root = path.resolve(import.meta.dir, '../../..');
function describeCheckout(root) {
  if (!existsSync(path.join(root, '.git')) || !existsSync(path.join(root, 'lib/plugin-info.js'))) {
    return;
  }
  const git = spawnSync('git', ['describe', '--tags', '--long', '--always', '--dirty'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (git.status === 0) return git.stdout.trim();
}
const developmentVersion = describeCheckout(root);
const result = developmentVersion ? { ...info, developmentVersion } : info;
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
