#!/usr/bin/env bun

import { chmod, cp, mkdir, readFile, readdir, readlink, rm, stat, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = path.resolve(MODULE_DIR, '..');
const CLI_NAME = 'codexsync';
const IGNORED_NAMES = new Set(['.DS_Store', '.git', 'node_modules']);
const MAX_DIFF_PREVIEW = 5;
const ANSI_ESCAPE_PREFIX = '\u001B[';

let SCRIPT_VERSION;

function supportsColor(stream = process.stdout) {
  const forceColor = process.env.FORCE_COLOR;
  if (forceColor !== undefined) {
    return !['0', 'false'].includes(String(forceColor).toLowerCase());
  }

  if (process.env.NO_COLOR !== undefined) {
    return false;
  }

  return Boolean(stream?.isTTY);
}

function applyAnsi(code, text, stream = process.stdout) {
  const value = String(text);
  if (!supportsColor(stream)) {
    return value;
  }

  return `${ANSI_ESCAPE_PREFIX}${code}m${value}${ANSI_ESCAPE_PREFIX}0m`;
}

function applyRgb(hex, text, stream = process.stdout) {
  const value = String(text);
  if (!supportsColor(stream)) {
    return value;
  }

  const normalized = hex.replace(/^#/, '');
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `${ANSI_ESCAPE_PREFIX}38;2;${red};${green};${blue}m${value}${ANSI_ESCAPE_PREFIX}0m`;
}

function bold(text, stream = process.stdout) {
  return applyAnsi('1', text, stream);
}

function dim(text, stream = process.stdout) {
  return applyAnsi('2', text, stream);
}

function green(text, stream = process.stdout) {
  return applyAnsi('32', text, stream);
}

function red(text, stream = process.stdout) {
  return applyAnsi('31', text, stream);
}

function tp(text, stream = process.stdout) {
  return applyRgb('#00c88a', text, stream);
}

function ts(text, stream = process.stdout) {
  return applyRgb('#db2777', text, stream);
}

function writeLine(stream, message = '') {
  stream.write(`${message}\n`);
}

function writeStatus(stream, label, colorize, message = '') {
  writeLine(stream, `${bold(colorize(label, stream), stream)} ${message}`);
}

function note(message) {
  writeStatus(process.stdout, 'note', ts, message);
}

function success(message) {
  writeStatus(process.stdout, 'done', green, message);
}

function fail(message) {
  writeStatus(process.stderr, 'error', red, message);
  process.exitCode = 1;
}

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(targetPath) {
  return JSON.parse(await readFile(targetPath, 'utf8'));
}

function resolveArgValue(arg, key) {
  if (arg === key) {
    return null;
  }

  if (arg.startsWith(`${key}=`)) {
    return arg.slice(`${key}=`.length);
  }

  return undefined;
}

function parseArgv(argv) {
  const options = {
    help: false,
    version: false,
    repoRoot: DEFAULT_REPO_ROOT,
    cachePath: null,
  };
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '-h' || arg === '--help') {
      options.help = true;
      continue;
    }

    if (arg === '-V' || arg === '--version') {
      options.version = true;
      continue;
    }

    const repoRootValue = resolveArgValue(arg, '--repo-root');
    if (repoRootValue !== undefined) {
      const value = repoRootValue ?? argv[++index];
      if (!value) {
        throw new Error('Missing value for --repo-root.');
      }
      options.repoRoot = path.resolve(value);
      continue;
    }

    const cachePathValue = resolveArgValue(arg, '--cache-path');
    if (cachePathValue !== undefined) {
      const value = cachePathValue ?? argv[++index];
      if (!value) {
        throw new Error('Missing value for --cache-path.');
      }
      options.cachePath = path.resolve(value);
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }

    positionals.push(arg);
  }

  const [command = null, ...extraPositionals] = positionals;
  return { command, extraPositionals, options };
}

async function resolveCliContext(repoRoot, cachePathOverride) {
  const packageJson = await readJson(path.join(repoRoot, 'package.json'));
  const pluginJson = await readJson(path.join(repoRoot, '.codex-plugin', 'plugin.json'));

  return {
    cachePath:
      cachePathOverride ??
      path.join(os.homedir(), '.codex', 'plugins', 'cache', 'pirostore', pluginJson.name, packageJson.version),
  };
}

async function getScriptVersion() {
  const packageJson = await readJson(path.join(DEFAULT_REPO_ROOT, 'package.json'));
  return packageJson.version;
}

function summarizeDiff(diff) {
  const parts = [];
  if (diff.changed.length > 0) parts.push(`changed ${diff.changed.length}`);
  if (diff.missing.length > 0) parts.push(`missing ${diff.missing.length}`);
  if (diff.extra.length > 0) parts.push(`extra ${diff.extra.length}`);
  return parts.length > 0 ? parts.join(', ') : 'in sync';
}

function previewPaths(paths) {
  if (paths.length === 0) {
    return [];
  }

  const preview = paths.slice(0, MAX_DIFF_PREVIEW);
  if (paths.length > MAX_DIFF_PREVIEW) {
    preview.push(`... ${paths.length - MAX_DIFF_PREVIEW} more`);
  }

  return preview;
}

function printDiffDetails(diff) {
  for (const [label, paths] of [
    ['changed', diff.changed],
    ['missing', diff.missing],
    ['extra', diff.extra],
  ]) {
    const preview = previewPaths(paths);
    if (preview.length === 0) {
      continue;
    }

    writeLine(process.stderr, `${label}:`);
    for (const entry of preview) {
      writeLine(process.stderr, `  ${entry}`);
    }
  }
}

async function collectEntries(rootDir, currentRelativePath = '', entryMap = new Map()) {
  const currentDir = currentRelativePath ? path.join(rootDir, currentRelativePath) : rootDir;
  const dirents = await readdir(currentDir, { withFileTypes: true });

  for (const dirent of dirents.sort((left, right) => left.name.localeCompare(right.name))) {
    if (IGNORED_NAMES.has(dirent.name)) {
      continue;
    }

    const relativePath = currentRelativePath ? path.join(currentRelativePath, dirent.name) : dirent.name;
    const absolutePath = path.join(rootDir, relativePath);

    if (dirent.isDirectory()) {
      entryMap.set(relativePath, { type: 'dir' });
      await collectEntries(rootDir, relativePath, entryMap);
      continue;
    }

    if (dirent.isSymbolicLink()) {
      entryMap.set(relativePath, {
        type: 'symlink',
        target: await readlink(absolutePath),
      });
      continue;
    }

    if (dirent.isFile()) {
      const fileStat = await stat(absolutePath);
      entryMap.set(relativePath, {
        type: 'file',
        mode: fileStat.mode & 0o777,
        content: await readFile(absolutePath),
      });
    }
  }

  return entryMap;
}

function diffEntries(sourceEntries, targetEntries) {
  const changed = [];
  const extra = [];
  const missing = [];

  for (const [relativePath, sourceEntry] of sourceEntries) {
    const targetEntry = targetEntries.get(relativePath);
    if (!targetEntry) {
      missing.push(relativePath);
      continue;
    }

    if (sourceEntry.type !== targetEntry.type) {
      changed.push(relativePath);
      continue;
    }

    if (sourceEntry.type === 'file') {
      const sameMode = sourceEntry.mode === targetEntry.mode;
      const sameContent = sourceEntry.content.equals(targetEntry.content);
      if (!sameMode || !sameContent) {
        changed.push(relativePath);
      }
      continue;
    }

    if (sourceEntry.type === 'symlink' && sourceEntry.target !== targetEntry.target) {
      changed.push(relativePath);
    }
  }

  for (const relativePath of targetEntries.keys()) {
    if (!sourceEntries.has(relativePath)) {
      extra.push(relativePath);
    }
  }

  return { changed, extra, missing };
}

async function ensureParentDirectory(targetPath) {
  await mkdir(path.dirname(targetPath), { recursive: true });
}

async function syncEntries({ sourceRoot, targetRoot, sourceEntries, targetEntries }) {
  const diff = diffEntries(sourceEntries, targetEntries);
  const extraPaths = [...diff.extra].sort((left, right) => {
    const leftDepth = left.split(path.sep).length;
    const rightDepth = right.split(path.sep).length;
    return rightDepth - leftDepth || right.length - left.length;
  });

  for (const relativePath of extraPaths) {
    await rm(path.join(targetRoot, relativePath), { force: true, recursive: true });
  }

  const sortedEntries = [...sourceEntries.entries()].sort(([leftPath, leftEntry], [rightPath, rightEntry]) => {
    const leftDepth = leftPath.split(path.sep).length;
    const rightDepth = rightPath.split(path.sep).length;
    if (leftDepth !== rightDepth) return leftDepth - rightDepth;
    if (leftEntry.type === 'dir' && rightEntry.type !== 'dir') return -1;
    if (leftEntry.type !== 'dir' && rightEntry.type === 'dir') return 1;
    return leftPath.localeCompare(rightPath);
  });

  await mkdir(targetRoot, { recursive: true });

  for (const [relativePath, sourceEntry] of sortedEntries) {
    const sourcePath = path.join(sourceRoot, relativePath);
    const targetPath = path.join(targetRoot, relativePath);

    if (sourceEntry.type === 'dir') {
      await mkdir(targetPath, { recursive: true });
      continue;
    }

    if (sourceEntry.type === 'symlink') {
      await ensureParentDirectory(targetPath);
      await rm(targetPath, { force: true, recursive: true });
      await symlink(sourceEntry.target, targetPath);
      continue;
    }

    await ensureParentDirectory(targetPath);
    await cp(sourcePath, targetPath, { force: true });
    await chmod(targetPath, sourceEntry.mode);
  }

  const refreshedTargetEntries = await collectEntries(targetRoot);
  return diffEntries(sourceEntries, refreshedTargetEntries);
}

function renderHelp({ cachePath, repoRoot }, stream = process.stdout) {
  return [
    `Usage: ${bold(`${CLI_NAME} <check|sync>`, stream)} ${dim('[options]', stream)}`,
    '',
    `${tp('Options', stream)}:`,
    `  --repo-root <path>    repo root to compare from ${dim(`[default: ${repoRoot}]`, stream)}`,
    `  --cache-path <path>   cache copy to compare or sync ${dim(`[default: ${cachePath}]`, stream)}`,
    '  -h, --help            displays this message',
    '  -V, --version         shows the CLI version',
  ].join('\n');
}

function printPaths({ repoRoot, cachePath }) {
  writeLine(process.stdout, `repo: ${repoRoot}`);
  writeLine(process.stdout, `cache: ${cachePath}`);
}

async function runCheck({ cachePath, repoRoot }) {
  const sourceEntries = await collectEntries(repoRoot);
  const cacheExists = await pathExists(cachePath);
  const cacheEntries = cacheExists ? await collectEntries(cachePath) : new Map();
  const diff = cacheExists
    ? diffEntries(sourceEntries, cacheEntries)
    : { changed: [], extra: [], missing: [...sourceEntries.keys()] };

  printPaths({ repoRoot, cachePath });

  if (diff.changed.length === 0 && diff.missing.length === 0 && diff.extra.length === 0) {
    success('cache copy matches source');
    return;
  }

  fail(`cache drift detected (${summarizeDiff(diff)})`);
  printDiffDetails(diff);
}

async function runSync({ cachePath, repoRoot }) {
  const sourceEntries = await collectEntries(repoRoot);
  const targetEntries = (await pathExists(cachePath)) ? await collectEntries(cachePath) : new Map();
  const postSyncDiff = await syncEntries({
    sourceRoot: repoRoot,
    targetRoot: cachePath,
    sourceEntries,
    targetEntries,
  });

  printPaths({ repoRoot, cachePath });

  if (postSyncDiff.changed.length > 0 || postSyncDiff.missing.length > 0 || postSyncDiff.extra.length > 0) {
    fail(`cache sync did not converge (${summarizeDiff(postSyncDiff)})`);
    printDiffDetails(postSyncDiff);
    return;
  }

  success('cache copy synced');
  note('restart or reinstall Codex if refreshed plugin surfaces do not appear immediately');
}

async function main() {
  SCRIPT_VERSION = await getScriptVersion();
  const { command, extraPositionals, options } = parseArgv(process.argv.slice(2));
  const context = await resolveCliContext(options.repoRoot, options.cachePath);

  if (options.help) {
    writeLine(process.stdout, renderHelp({ cachePath: context.cachePath, repoRoot: options.repoRoot }, process.stdout));
    return;
  }

  if (options.version) {
    writeLine(process.stdout, SCRIPT_VERSION);
    return;
  }

  if (!command) {
    fail(`expected a command (${ts('check')} or ${ts('sync')})`);
    writeLine(process.stderr, '');
    writeLine(process.stderr, renderHelp({ cachePath: context.cachePath, repoRoot: options.repoRoot }, process.stderr));
    return;
  }

  if (extraPositionals.length > 0) {
    fail(`unexpected positional arguments: ${extraPositionals.join(', ')}`);
    return;
  }

  if (command === 'check') {
    await runCheck({ cachePath: context.cachePath, repoRoot: options.repoRoot });
    return;
  }

  if (command === 'sync') {
    await runSync({ cachePath: context.cachePath, repoRoot: options.repoRoot });
    return;
  }

  fail(`unknown command: ${command}`);
}

await main();
