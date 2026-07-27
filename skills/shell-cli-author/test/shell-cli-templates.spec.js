import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASH_TEMPLATE_PATH = path.join(SKILL_ROOT, 'templates', 'bash-cli.sh');
const POWERSHELL_TEMPLATE_PATH = path.join(SKILL_ROOT, 'templates', 'powershell-cli.ps1');

function commandAvailable(command) {
  return !spawnSync(command, ['--version'], { encoding: 'utf8' }).error;
}

describe('skills/shell-cli-author/templates', () => {
  it('should parse and expose Bash help and version output', function () {
    if (process.platform === 'win32' || !commandAvailable('bash')) {
      this.skip();
    }

    const syntax = spawnSync('bash', ['-n', BASH_TEMPLATE_PATH], { encoding: 'utf8' });
    assert.equal(syntax.status, 0, syntax.stderr);

    const help = spawnSync('bash', [BASH_TEMPLATE_PATH, '--help'], { encoding: 'utf8' });
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /^Usage: bash-cli\.sh /m);
    assert.match(help.stdout, /^Options:$/m);

    const version = spawnSync('bash', [BASH_TEMPLATE_PATH, '--version'], { encoding: 'utf8' });
    assert.equal(version.status, 0, version.stderr);
    assert.match(version.stdout.trim(), /^(?:v?\d|[0-9a-f]{4,})/i);
  });

  it('should parse and expose PowerShell help and version output', function () {
    this.timeout(10_000);

    if (!commandAvailable('pwsh')) {
      this.skip();
    }

    const help = spawnSync('pwsh', ['-NoProfile', '-File', POWERSHELL_TEMPLATE_PATH, '-Help'], {
      encoding: 'utf8',
    });
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /^Usage: powershell-cli\.ps1 /m);
    assert.match(help.stdout, /^Options:$/m);

    const version = spawnSync(
      'pwsh',
      ['-NoProfile', '-File', POWERSHELL_TEMPLATE_PATH, '-Version'],
      { encoding: 'utf8' },
    );
    assert.equal(version.status, 0, version.stderr);
    assert.match(version.stdout.trim(), /^(?:v?\d|[0-9a-f]{4,})/i);
  });
});
