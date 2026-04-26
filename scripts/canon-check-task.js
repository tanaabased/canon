#!/usr/bin/env bun

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, '..');
const SKILLS_DIR = path.join(REPO_ROOT, 'skills');
const VALIDATE_SKILL_SCRIPT = path.join(SKILLS_DIR, 'skill-author', 'scripts', 'validate-skill.js');
const MARKDOWN_ROOTS = [
  'README.md',
  'CHANGELOG.md',
  'AGENTS.md',
  'guidance',
  'ideas',
  'references',
  'prompts',
  'templates',
];
const WORKFLOW_DIR = path.join(REPO_ROOT, '.github', 'workflows');
const PACKAGE_SCRIPT_PATTERN = /\b(?:bun|npm|pnpm|yarn)\s+run\s+([a-zA-Z0-9:_-]+)/g;

const failures = [];

function fail(message) {
  failures.push(message);
}

function logCheck(message) {
  process.stdout.write(`check ${message}\n`);
}

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(REPO_ROOT, relativePath), 'utf8'));
}

async function listDirectories(targetDir) {
  const entries = await readdir(targetDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function collectFiles(targetPath, predicate, files = []) {
  if (!(await pathExists(targetPath))) {
    return files;
  }

  const targetStat = await stat(targetPath);
  if (targetStat.isFile()) {
    if (predicate(targetPath)) {
      files.push(targetPath);
    }
    return files;
  }

  if (!targetStat.isDirectory()) {
    return files;
  }

  const entries = await readdir(targetPath, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.name === '.git' || entry.name === 'node_modules') {
      continue;
    }
    await collectFiles(path.join(targetPath, entry.name), predicate, files);
  }

  return files;
}

function normalizeManifestPath(rawPath) {
  return String(rawPath ?? '').trim();
}

async function checkManifestPath({ label, rawPath, required = true }) {
  const manifestPath = normalizeManifestPath(rawPath);
  if (!manifestPath) {
    if (required) {
      fail(`plugin manifest is missing ${label}.`);
    }
    return;
  }

  if (!manifestPath.startsWith('./')) {
    fail(`plugin manifest ${label} must be relative to the plugin root and start with './': ${manifestPath}`);
    return;
  }

  if (!(await pathExists(path.join(REPO_ROOT, manifestPath)))) {
    fail(`plugin manifest ${label} points to a missing path: ${manifestPath}`);
  }
}

async function validateSkills() {
  logCheck('skill directories');
  const skillDirs = await listDirectories(SKILLS_DIR);

  for (const skillName of skillDirs) {
    const skillDir = path.join(SKILLS_DIR, skillName);
    const result = spawnSync(process.execPath, [VALIDATE_SKILL_SCRIPT, '--skill-dir', skillDir], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (result.status !== 0) {
      fail(`skill validation failed for ${path.relative(REPO_ROOT, skillDir)}:\n${result.stdout}${result.stderr}`.trim());
    }
  }
}

async function validatePluginManifest() {
  logCheck('plugin manifest paths');
  const pluginJson = await readJson('.codex-plugin/plugin.json');

  await checkManifestPath({ label: 'skills', rawPath: pluginJson.skills });
  await checkManifestPath({ label: 'mcpServers', rawPath: pluginJson.mcpServers, required: false });
  await checkManifestPath({ label: 'apps', rawPath: pluginJson.apps, required: false });

  const pluginInterface = pluginJson.interface ?? {};
  await checkManifestPath({ label: 'interface.composerIcon', rawPath: pluginInterface.composerIcon });
  await checkManifestPath({ label: 'interface.logo', rawPath: pluginInterface.logo });

  if (Array.isArray(pluginInterface.screenshots)) {
    for (const [index, screenshotPath] of pluginInterface.screenshots.entries()) {
      await checkManifestPath({
        label: `interface.screenshots[${index}]`,
        rawPath: screenshotPath,
      });
    }
  }
}

function isExternalMarkdownTarget(target) {
  return (
    target.startsWith('#') ||
    /^[a-z][a-z0-9+.-]*:/i.test(target) ||
    target.startsWith('{{') ||
    target.includes('{{') ||
    target.includes('}}')
  );
}

function normalizeMarkdownTarget(rawTarget) {
  const withoutTitle = String(rawTarget ?? '').trim().split(/\s+["'][^"']*["']$/)[0];
  const withoutAngles = withoutTitle.startsWith('<') && withoutTitle.endsWith('>') ? withoutTitle.slice(1, -1) : withoutTitle;
  return withoutAngles.split('#', 1)[0];
}

async function validateMarkdownLinks() {
  logCheck('root markdown links');
  const markdownFiles = [];

  for (const rootEntry of MARKDOWN_ROOTS) {
    await collectFiles(path.join(REPO_ROOT, rootEntry), (filePath) => filePath.endsWith('.md'), markdownFiles);
  }

  const linkPattern = /(?<!!)\[[^\]\n]+\]\(([^)\n]+)\)/g;
  for (const filePath of markdownFiles) {
    const content = await readFile(filePath, 'utf8');
    for (const match of content.matchAll(linkPattern)) {
      const target = normalizeMarkdownTarget(match[1]);
      if (!target || isExternalMarkdownTarget(target)) {
        continue;
      }

      const resolvedTarget = path.resolve(path.dirname(filePath), target);
      if (!resolvedTarget.startsWith(REPO_ROOT) || !(await pathExists(resolvedTarget))) {
        fail(
          `broken Markdown link in ${path.relative(REPO_ROOT, filePath)}: ${match[1]} -> ${path.relative(
            REPO_ROOT,
            resolvedTarget,
          )}`,
        );
      }
    }
  }
}

async function validateWorkflowPackageScripts() {
  logCheck('workflow package script references');
  if (!(await pathExists(WORKFLOW_DIR))) {
    return;
  }

  const packageJson = await readJson('package.json');
  const scripts = new Set(Object.keys(packageJson.scripts ?? {}));
  const workflowFiles = await collectFiles(WORKFLOW_DIR, (filePath) => /\.(ya?ml)$/.test(filePath));

  for (const workflowFile of workflowFiles) {
    const content = await readFile(workflowFile, 'utf8');
    for (const match of content.matchAll(PACKAGE_SCRIPT_PATTERN)) {
      const scriptName = match[1];
      if (!scripts.has(scriptName)) {
        fail(`workflow ${path.relative(REPO_ROOT, workflowFile)} calls missing package script: ${scriptName}`);
      }
    }
  }
}

async function main() {
  if (!existsSync(VALIDATE_SKILL_SCRIPT)) {
    throw new Error(`Missing validator: ${path.relative(REPO_ROOT, VALIDATE_SKILL_SCRIPT)}`);
  }

  await validateSkills();
  await validatePluginManifest();
  await validateMarkdownLinks();
  await validateWorkflowPackageScripts();

  if (failures.length > 0) {
    process.stderr.write('\ncanon check failed:\n');
    for (const failure of failures) {
      process.stderr.write(`- ${failure}\n`);
    }
    process.exit(1);
  }

  process.stdout.write('done canon check passed\n');
}

await main();
