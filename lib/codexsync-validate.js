import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import { fail, success, writeLine } from './bun-cli-support.js';
import { pathExists, readJson } from './codexsync-context.js';

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
const PACKAGE_SCRIPT_PATTERN = /\b(?:bun|npm|pnpm|yarn)\s+run\s+([a-zA-Z0-9:_-]+)/g;

function appendFailure(failures, message) {
  failures.push(message);
}

function logCheck(message, stream = process.stdout) {
  writeLine(stream, `check ${message}`);
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

/**
 * Validates plugin manifest paths that must stay relative to the plugin root.
 * Optional entries may be absent, but present entries must resolve on disk.
 *
 * @param {object} context
 * @param {string[]} context.failures Mutable list that receives validation failures.
 * @param {string} context.label Human-readable manifest field label.
 * @param {unknown} context.rawPath Manifest path value.
 * @param {string} context.repoRoot Source repository root.
 * @param {boolean} [context.required=true] Whether a missing value is a failure.
 */
async function checkManifestPath({ failures, label, rawPath, repoRoot, required = true }) {
  const manifestPath = normalizeManifestPath(rawPath);
  if (!manifestPath) {
    if (required) {
      appendFailure(failures, `plugin manifest is missing ${label}.`);
    }
    return;
  }

  if (!manifestPath.startsWith('./')) {
    appendFailure(failures, `plugin manifest ${label} must be relative to the plugin root and start with './': ${manifestPath}`);
    return;
  }

  if (!(await pathExists(path.join(repoRoot, manifestPath)))) {
    appendFailure(failures, `plugin manifest ${label} points to a missing path: ${manifestPath}`);
  }
}

async function validateSkills({ failures, repoRoot }) {
  logCheck('skill directories');
  const skillsDir = path.join(repoRoot, 'skills');
  const validateSkillScript = path.join(skillsDir, 'skill-author', 'scripts', 'validate-skill.js');

  if (!existsSync(validateSkillScript)) {
    appendFailure(failures, `missing skill validator: ${path.relative(repoRoot, validateSkillScript)}`);
    return;
  }

  const skillDirs = await listDirectories(skillsDir);
  for (const skillName of skillDirs) {
    const skillDir = path.join(skillsDir, skillName);
    const result = spawnSync(process.execPath, [validateSkillScript, '--skill-dir', skillDir], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (result.status !== 0) {
      appendFailure(
        failures,
        `skill validation failed for ${path.relative(repoRoot, skillDir)}:\n${result.stdout}${result.stderr}`.trim(),
      );
    }
  }
}

async function validatePluginManifest({ failures, repoRoot }) {
  logCheck('plugin manifest paths');
  const pluginJson = await readJson(path.join(repoRoot, '.codex-plugin', 'plugin.json'));

  await checkManifestPath({ failures, label: 'skills', rawPath: pluginJson.skills, repoRoot });
  await checkManifestPath({ failures, label: 'mcpServers', rawPath: pluginJson.mcpServers, repoRoot, required: false });
  await checkManifestPath({ failures, label: 'apps', rawPath: pluginJson.apps, repoRoot, required: false });

  const pluginInterface = pluginJson.interface ?? {};
  await checkManifestPath({ failures, label: 'interface.composerIcon', rawPath: pluginInterface.composerIcon, repoRoot });
  await checkManifestPath({ failures, label: 'interface.logo', rawPath: pluginInterface.logo, repoRoot });

  if (Array.isArray(pluginInterface.screenshots)) {
    for (const [index, screenshotPath] of pluginInterface.screenshots.entries()) {
      await checkManifestPath({
        failures,
        label: `interface.screenshots[${index}]`,
        rawPath: screenshotPath,
        repoRoot,
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

/**
 * Checks repo-level Markdown links that point inside the repo. External,
 * templated, and same-page anchor links are intentionally skipped.
 *
 * @param {object} context
 * @param {string[]} context.failures Mutable list that receives validation failures.
 * @param {string} context.repoRoot Source repository root.
 */
async function validateMarkdownLinks({ failures, repoRoot }) {
  logCheck('root markdown links');
  const markdownFiles = [];

  for (const rootEntry of MARKDOWN_ROOTS) {
    await collectFiles(path.join(repoRoot, rootEntry), (filePath) => filePath.endsWith('.md'), markdownFiles);
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
      if (!resolvedTarget.startsWith(repoRoot) || !(await pathExists(resolvedTarget))) {
        appendFailure(
          failures,
          `broken Markdown link in ${path.relative(repoRoot, filePath)}: ${match[1]} -> ${path.relative(repoRoot, resolvedTarget)}`,
        );
      }
    }
  }
}

async function validateWorkflowPackageScripts({ failures, repoRoot }) {
  logCheck('workflow package script references');
  const workflowDir = path.join(repoRoot, '.github', 'workflows');
  if (!(await pathExists(workflowDir))) {
    return;
  }

  const packageJson = await readJson(path.join(repoRoot, 'package.json'));
  const scripts = new Set(Object.keys(packageJson.scripts ?? {}));
  const workflowFiles = await collectFiles(workflowDir, (filePath) => /\.(ya?ml)$/.test(filePath));

  for (const workflowFile of workflowFiles) {
    const content = await readFile(workflowFile, 'utf8');
    for (const match of content.matchAll(PACKAGE_SCRIPT_PATTERN)) {
      const scriptName = match[1];
      if (!scripts.has(scriptName)) {
        appendFailure(failures, `workflow ${path.relative(repoRoot, workflowFile)} calls missing package script: ${scriptName}`);
      }
    }
  }
}

/**
 * Runs the repo-level validation suite for canon skills, plugin metadata,
 * Markdown links, and workflow package-script references.
 *
 * @param {object} context
 * @param {string} context.repoRoot Source repository root.
 * @returns {Promise<boolean>} True when every validation group passes.
 */
export async function runValidate({ repoRoot }) {
  const failures = [];

  await validateSkills({ failures, repoRoot });
  await validatePluginManifest({ failures, repoRoot });
  await validateMarkdownLinks({ failures, repoRoot });
  await validateWorkflowPackageScripts({ failures, repoRoot });

  if (failures.length > 0) {
    writeLine(process.stderr, '');
    writeLine(process.stderr, 'canon validation failed:');
    for (const failureMessage of failures) {
      writeLine(process.stderr, `- ${failureMessage}`);
    }
    return fail('canon validation failed');
  }

  return success('canon validation passed');
}
