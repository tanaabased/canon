#!/usr/bin/env bun

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import pkg from '../package.json' with { type: 'json' };

const [tarball, ...extra] = process.argv.slice(2);
if (!tarball || tarball.startsWith('-') || extra.length) {
  process.stderr.write('Usage: bun run check:openclaw <package.tgz>\n');
  process.exitCode = 1;
} else {
  const root = await mkdtemp(path.join(tmpdir(), 'canon-openclaw-'));
  const configPath = path.join(root, 'openclaw.json');
  const env = {
    ...process.env,
    OPENCLAW_STATE_DIR: path.join(root, 'state'),
    OPENCLAW_CONFIG_PATH: configPath,
    OPENCLAW_HIDE_BANNER: '1',
  };
  function run(args) {
    const result = spawnSync('openclaw', args, { env, encoding: 'utf8', timeout: 120_000 });
    assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);
    return result.stdout;
  }
  try {
    await writeFile(
      configPath,
      JSON.stringify({
        agents: { defaults: { workspace: path.join(root, 'workspace') } },
        gateway: { mode: 'local' },
      }),
    );
    run(['plugins', 'install', path.resolve(tarball), '--force', '--accept-capabilities']);
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    config.plugins.entries.tanaab.hooks = { allowConversationAccess: true };
    await writeFile(configPath, JSON.stringify(config));

    const inspect = JSON.parse(run(['plugins', 'inspect', 'tanaab', '--runtime', '--json']));
    assert.equal(inspect.plugin.status, 'loaded');
    assert.equal(inspect.plugin.format, 'openclaw');
    assert.equal(inspect.plugin.version, pkg.version);
    assert.deepEqual(
      inspect.typedHooks.map(({ name }) => name),
      ['before_prompt_build'],
    );

    const expected = (await readdir(new URL('../skills/', import.meta.url)))
      .sort()
      .map((name) => `tanaab-${name}`);
    const listed = JSON.parse(run(['skills', 'list', '--json'])).skills;
    const canon = listed.filter(({ name }) => name.startsWith('tanaab-'));
    assert.deepEqual(canon.map(({ name }) => name).sort(), expected);
    assert.ok(
      canon.every(({ modelVisible }) => modelVisible),
      'All Canon skills must be discoverable',
    );

    config.plugins.entries.tanaab.config = { guidance: false };
    await writeFile(configPath, JSON.stringify(config));
    const disabled = JSON.parse(run(['plugins', 'inspect', 'tanaab', '--runtime', '--json']));
    assert.equal(disabled.plugin.status, 'loaded');
    assert.deepEqual(disabled.typedHooks, []);
    process.stdout.write(
      `Verified OpenClaw installation: ${canon.length} skills and optional guidance hook.\n`,
    );
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
