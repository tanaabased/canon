import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { isBuiltin } from 'node:module';
import path from 'node:path';

import { Transpiler } from 'bun';

import extractRelativeMarkdownLinks from '../../skill-author/utils/extract-relative-markdown-links.js';

function contained(root, relative) {
  const result = path.resolve(root, relative);
  if (!result.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Output must stay inside the distribution: ${relative}`);
  }
  return result;
}

// This pilot accepts the simple inline-link syntax already used by its declared documents.
export function rewriteDistributionLinks(
  markdown,
  sourceFile,
  outputFile,
  destinations,
  sourceLinks,
) {
  const replacements = new Map();
  for (const target of new Set(extractRelativeMarkdownLinks(markdown))) {
    const separator = target.indexOf('#');
    const file = separator < 0 ? target : target.slice(0, separator);
    const anchor = separator < 0 ? '' : target.slice(separator);
    const source = path.resolve(path.dirname(sourceFile), file);
    const destination = destinations.get(source);
    const replacement = destination
      ? `./${path.relative(path.dirname(outputFile), destination).split(path.sep).join('/')}${anchor}`
      : sourceLinks.get(source) && `${sourceLinks.get(source)}${anchor}`;
    if (!replacement) throw new Error(`Undeclared resource in ${sourceFile}: ${target}`);
    const literal = `](${target})`;
    if (!markdown.includes(literal)) throw new Error(`Unsupported link syntax: ${target}`);
    replacements.set(literal, `](${replacement})`);
  }
  return markdown.replace(/\]\([^)]+\)/g, (literal) => replacements.get(literal) ?? literal);
}

async function renderSkill(markdown, skillRoot, config) {
  const marker = '<!-- packaged-command-execution -->';
  const sections = markdown.split(marker);
  if (sections.length !== 2) throw new Error('Expected one packaged command execution marker');
  const execution = await readFile(path.join(skillRoot, config.packagedExecution), 'utf8');
  const instructions = sections.join(execution.trim());
  return instructions.replace(/<skill-path>\/[^\s`]+/g, (command) => {
    const source = command.slice('<skill-path>/'.length);
    if (!Object.hasOwn(config.entrypoints, source)) {
      throw new Error(`Undeclared Task Author command: ${source}`);
    }
    return `<skill-path>/${config.entrypoints[source]}`;
  });
}

/** Stage the declared files, or compare them without writing when check is true. */
export async function buildDistribution({
  skillRoot,
  repositoryRoot,
  outputRoot,
  config,
  version,
  check = false,
}) {
  skillRoot = path.resolve(skillRoot);
  repositoryRoot = path.resolve(repositoryRoot);
  outputRoot = path.resolve(outputRoot);
  const mappings = { ...config.resources, ...config.entrypoints };
  const sources = new Set(
    [...Object.keys(mappings), config.packagedExecution].map((source) =>
      path.resolve(skillRoot, source),
    ),
  );
  const destinations = new Map();
  for (const [source, destination] of Object.entries(mappings)) {
    const output = contained(outputRoot, destination);
    const authored = config.resources[source] === destination && source === destination;
    if (sources.has(path.resolve(skillRoot, destination)) && !authored) {
      throw new Error(`Generated output would overwrite source: ${destination}`);
    }
    if ([...destinations.values()].includes(output)) {
      throw new Error(`Duplicate output destination: ${destination}`);
    }
    destinations.set(path.resolve(skillRoot, source), output);
  }
  const sourceLinks = new Map();
  for (const source of config.sourceLinks) {
    const absolute = path.resolve(skillRoot, source);
    await stat(absolute);
    const relative = path.relative(repositoryRoot, absolute).split(path.sep).join('/');
    if (relative.startsWith('../')) throw new Error(`Source link escapes repository: ${source}`);
    sourceLinks.set(absolute, new URL(relative, config.sourceBaseUrl).href);
  }

  // Prepare every resource before writing so a missing mapping cannot produce a usable-looking skill.
  const files = new Map();
  for (const [source, destination] of Object.entries(config.resources)) {
    const sourceFile = path.resolve(skillRoot, source);
    let contents = await readFile(sourceFile);
    if (source.endsWith('.md') && source !== destination) {
      contents = rewriteDistributionLinks(
        contents.toString('utf8'),
        sourceFile,
        contained(outputRoot, destination),
        destinations,
        sourceLinks,
      );
    }
    if (destination === 'SKILL.md') contents = await renderSkill(contents, skillRoot, config);
    files.set(destination, contents);
  }

  const commands = [];
  const scanner = new Transpiler({ loader: 'js' });
  for (const [source, destination] of Object.entries(config.entrypoints)) {
    // Bun's module comments depend on cwd. Isolate compilation so hashes do not depend on the caller.
    const result = spawnSync(
      process.execPath,
      [
        'build',
        path.resolve(skillRoot, source),
        '--target',
        'bun',
        '--format',
        'esm',
        '--packages',
        'bundle',
      ],
      { cwd: repositoryRoot, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
    );
    if (result.status !== 0)
      throw new Error(`Failed to bundle ${source}: ${result.error?.message ?? result.stderr}`);
    const contents = result.stdout;
    const external = scanner
      .scan(contents)
      .imports.filter(({ path: imported }) => !isBuiltin(imported));
    if (external.length)
      throw new Error(`Unbundled imports in ${source}: ${JSON.stringify(external)}`);
    files.set(destination, contents);
    commands.push({
      path: destination,
      bytes: Buffer.byteLength(contents),
      sha256: createHash('sha256').update(contents).digest('hex'),
    });
  }
  const inventory = { version, runtime: 'bun', commands };
  files.set('runtime-files.json', `${JSON.stringify(inventory, null, 2)}\n`);
  for (const [destination, contents] of files) {
    if (!destination.endsWith('.md')) continue;
    for (const target of extractRelativeMarkdownLinks(String(contents))) {
      const resolved = path.resolve(outputRoot, path.dirname(destination), target.split('#')[0]);
      const relative = path.relative(outputRoot, resolved).split(path.sep).join('/');
      if (!files.has(relative))
        throw new Error(`Uncontained resource in ${destination}: ${target}`);
    }
  }
  const stale = [];
  for (const [destination, contents] of files) {
    const output = contained(outputRoot, destination);
    const current = await readFile(output).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
      return null;
    });
    if (current?.equals(Buffer.from(contents))) continue;
    if (check) {
      stale.push(destination);
      continue;
    }
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, contents, {
      mode: destination.endsWith('.js') ? 0o755 : 0o644,
    });
  }
  if (stale.length) {
    throw new Error(
      `Stale Task Author distribution: ${stale.join(', ')}. Prepare the release tree before checking it.`,
    );
  }
  return { outputRoot, files: files.size, ...inventory };
}
