import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { cloudCli, snapshotCheckout, sourceRoot } from '../lib/package-source.js';

const scratch = await mkdtemp(path.join(tmpdir(), 'canon-package-cutover-'));
const checkout = path.join(scratch, 'checkout');
const skill = 'skills/package-fixture';
const config = `${skill}/build.config.js`;
const guide = 'references/cutover-guide.md';
const template = 'templates/cutover-nested/details.md';
const copy = "copy: ['references/**', 'templates/**']";
const npmEnv = { ...process.env, npm_config_cache: path.join(scratch, 'npm-cache') };

async function write(root, relative, content) {
  const destination = path.join(root, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, content);
}

function track(...files) {
  execFileSync('git', ['add', '--', ...files], { cwd: checkout });
}

function canon(command, argument) {
  return spawnSync('bun', ['run', '--cwd', checkout, command, argument], {
    cwd: scratch,
    env: { ...process.env, CODEX_TOOLS_CLI: cloudCli },
    encoding: 'utf8',
  });
}

function expectStatus(result, status, diagnostic) {
  if (result.error) throw result.error;
  const output = result.stdout + result.stderr;
  assert.equal(result.status, status, output);
  if (diagnostic) assert.match(output, diagnostic);
}

async function pack(label) {
  const staging = path.join(scratch, `${label}-staging`);
  expectStatus(canon('build:plugin', staging), 0);
  await assert.rejects(lstat(path.join(staging, '.git')), { code: 'ENOENT' });
  const output = path.join(scratch, label);
  await mkdir(output);
  const tarball = execFileSync(
    'npm',
    ['pack', staging, '--ignore-scripts', '--silent', '--pack-destination', output],
    { env: npmEnv, encoding: 'utf8' },
  ).trim();
  const extracted = path.join(output, 'extracted');
  await mkdir(extracted);
  execFileSync('tar', [
    '-xzf',
    path.join(output, tarball),
    '-C',
    extracted,
    '--strip-components=1',
  ]);
  return extracted;
}

try {
  await mkdir(checkout);
  await snapshotCheckout(sourceRoot, checkout);
  execFileSync(
    'bun',
    [
      'skills/skill-author/scripts/init-skill.js',
      '--type',
      'generic',
      '--slug',
      'package-fixture',
      '--display-name',
      'Package Fixture',
      '--description',
      'Exercise release package validation.',
      '--openclaw-emoji',
      '🧪',
      '--openclaw-homepage',
      'https://example.com/skills/package-fixture',
      '--container',
      'codex-plugin',
      '--output-dir',
      'skills',
    ],
    { cwd: checkout },
  );
  track(skill);
  const missingConfig = await pack('missing-config');
  expectStatus(
    canon('check:package', missingConfig),
    1,
    /Missing tracked skill config: skills\/package-fixture\/build\.config\.js/,
  );

  const leaf = '[details](../templates/cutover-nested/details.md)\n';
  await write(checkout, guide, leaf);
  await write(checkout, template, '# Fixture details\n');
  await write(checkout, 'templates/cutover-workflow.yml', 'name: Fixture\n');
  await write(
    checkout,
    'references/cutover-workflow-example.yml.md',
    '# Cutover workflow example\n',
  );
  await mkdir(path.join(checkout, skill, 'references'));
  const originalLink = '../../../' + guide;
  const sourceLink = path.join(checkout, skill, guide);
  await symlink(originalLink, sourceLink);
  await write(checkout, config, "export default { copy: ['references/**'] };\n");
  track(
    skill,
    guide,
    template,
    'templates/cutover-workflow.yml',
    'references/cutover-workflow-example.yml.md',
  );
  expectStatus(
    canon('check:package', missingConfig),
    1,
    /package-fixture\/build\.config\.js: missing copy declaration templates\/\*\*/,
  );

  // Leave the final config, instructions and release stamps unstaged.
  await write(checkout, config, `export default { ${copy} };\n`);
  const doc = `${skill}/SKILL.md`;
  const original = await readFile(path.join(checkout, doc), 'utf8');
  await write(checkout, doc, original + '\n[guide](./references/cutover-guide.md)\n');
  for (const stamp of ['package.json', '.codex-plugin/plugin.json', 'openclaw.plugin.json']) {
    const file = JSON.parse(await readFile(path.join(checkout, stamp), 'utf8'));
    file.version = '9.9.9-cutover-fixture';
    await write(checkout, stamp, JSON.stringify(file));
  }

  const prose = await pack('prose');
  expectStatus(canon('check:package', prose), 0, /@tanaab\/canon@9\.9\.9-cutover-fixture/);
  assert.equal(await readlink(sourceLink), originalLink);
  assert.ok((await lstat(path.join(prose, skill, guide))).isFile());
  for (const relative of [template, 'templates/cutover-workflow.yml', 'assets/icon-large.png']) {
    assert.ok((await lstat(path.join(prose, skill, relative))).isFile(), relative);
  }
  await assert.rejects(lstat(path.join(prose, skill, 'runtime-files.json')), { code: 'ENOENT' });

  assert.ok((await lstat(path.join(prose, template))).isFile());

  // Use a real corrected workflow reference shared by multiple skills in the release.
  const workflow = 'references/bun-npm-package-release-workflow-example.yml.md';
  const workflowText = await readFile(path.join(checkout, workflow), 'utf8');
  for (const owner of [
    'codex-plugin-author',
    'github-workflow-author',
    'javascript-author',
    'openclaw-plugin-author',
  ]) {
    const packed = path.join(prose, 'skills', owner, workflow);
    assert.ok((await lstat(packed)).isFile());
    assert.equal(await readFile(packed, 'utf8'), workflowText);
  }

  for (const [target, diagnostic] of [
    [
      '../../../templates/cutover-nested/details.md',
      /cutover-guide\.md → \.\.\/\.\.\/\.\.\/templates\/cutover-nested\/details\.md: move the target inside the skill/,
    ],
    [
      '../templates/cutover-workflow.yml',
      /cutover-guide\.md → \.\.\/templates\/cutover-workflow\.yml: link an annotated Markdown file/,
    ],
    [
      '../templates/cutover-nested/',
      /cutover-guide\.md → \.\.\/templates\/cutover-nested\/: link a concrete packaged file/,
    ],
  ]) {
    await write(prose, `${skill}/${guide}`, `[example](${target})\n`);
    expectStatus(canon('check:package', prose), 1, diagnostic);
  }
  await write(prose, `${skill}/${guide}`, '[example](./cutover-workflow-example.yml.md)\n');
  expectStatus(canon('check:package', prose), 0);

  const command = `${skill}/scripts/nested/example.js`;
  await write(checkout, command, "console.log('packaged example');\n");
  track(command);
  const undeclared = await pack('undeclared-command');
  expectStatus(
    canon('check:package', undeclared),
    1,
    /package-fixture\/scripts\/nested\/example\.js: missing from build\.config\.js entrypoints/,
  );
  await write(checkout, config, `export default { ${copy}, entrypoints: ['scripts/**/*.js'] };\n`);
  const repaired = await pack('declared-command');
  expectStatus(canon('check:package', repaired), 0);
  assert.equal(
    execFileSync('bun', [path.join(repaired, command)], { cwd: scratch, encoding: 'utf8' }).trim(),
    'packaged example',
  );
  await write(repaired, command, "console.log('tampered');\n");
  expectStatus(
    canon('check:package', repaired),
    1,
    /scripts\/nested\/example\.js: byte length or SHA-256 differs/,
  );

  await write(checkout, 'untracked.txt', 'do not package\n');
  const badLink = `${skill}/references/untracked.txt`;
  await symlink('../../../untracked.txt', path.join(checkout, badLink));
  track(badLink);
  const rejected = path.join(scratch, 'rejected-staging');
  expectStatus(
    canon('build:plugin', rejected),
    1,
    /Expected tracked symlink target: untracked\.txt/,
  );
  await assert.rejects(lstat(rejected), { code: 'ENOENT' });
  assert.equal(await readFile(path.join(checkout, 'untracked.txt'), 'utf8'), 'do not package\n');
  process.stdout.write(
    'Verified new-skill packaging failures and repairs on extracted npm payloads.\n',
  );
} finally {
  await rm(scratch, { recursive: true, force: true });
}
