import { execFileSync } from 'node:child_process';
import { copyFile, lstat, mkdir, readlink, realpath, symlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const sourceRoot = fileURLToPath(new URL('../', import.meta.url));

export function trackedFiles(root) {
  const output = execFileSync('git', ['ls-files', '--cached', '-z'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return [...new Set(output.split('\0').filter(Boolean))];
}

// Copy working-tree bytes and index them so verify sees the same unstaged inputs as package.
export async function snapshotCheckout(root, snapshot) {
  const repository = await realpath(root);
  for (const file of trackedFiles(repository)) {
    const source = path.join(repository, file);
    const parent = path.dirname(source);
    if ((await realpath(parent)) !== parent) throw new Error(`Expected a regular parent: ${file}`);
    const target = path.join(snapshot, file);
    const stat = await lstat(source);
    await mkdir(path.dirname(target), { recursive: true });
    if (stat.isSymbolicLink() && /^skills\/[^/]+\//.test(file)) {
      await symlink(await readlink(source), target);
    } else if (stat.isFile()) {
      await copyFile(source, target);
    } else {
      throw new Error(`Expected a tracked file or skill resource symlink: ${file}`);
    }
  }
  execFileSync('git', ['init', '--quiet', '--template='], { cwd: snapshot });
  execFileSync('git', ['-c', 'core.autocrlf=false', 'add', '--force', '--', '.'], {
    cwd: snapshot,
  });
}

export function runCloud(action, checkout, ...args) {
  execFileSync(
    'bun',
    ['run', 'codex-tools', 'cloud', action, path.join(checkout, 'cloud.config.js'), ...args],
    {
      cwd: sourceRoot,
      stdio: 'inherit',
    },
  );
}
