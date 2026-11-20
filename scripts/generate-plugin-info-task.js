import { checkPluginInfo, writePluginInfo } from '../lib/plugin-info.js';

const args = process.argv.slice(2);
if (args.length === 0) {
  await writePluginInfo(process.cwd());
} else if (args.length === 1 && args[0] === '--check') {
  await checkPluginInfo(process.cwd());
} else {
  throw new Error('Usage: bun run generate:plugin-info [--check]');
}
