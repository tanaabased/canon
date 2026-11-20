# Packaged Cloud Reader Samples

Check the canary files in the candidate npm tarball before probing the installed reader in a fresh Codex Cloud chat. The archive check establishes which samples ship and their contents. Reader outcomes come from the Cloud probe.

## Setup

```bash
# should extract the candidate outside the checkout
mkdir -p "$TMPDIR/package"
tar -xzf "$CANON_TARBALL" -C "$TMPDIR/package" --strip-components=1
```

## Testing

```bash
# should ship every indexed canary with its format-specific sentinel
bun --no-install - "$TMPDIR/package/skills/cloud-reader-format-probe" <<'JS'
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
const skill = process.argv[2];
const index = await Bun.file(join(skill, 'references/probe-index.json')).json();
const samples = await readdir(join(skill, 'references/samples'));
assert.deepEqual([...index].sort(), samples.map((name) => `references/samples/${name}`).sort());
const formats = new Set();
for (const file of index) {
  const name = basename(file);
  const format = name.startsWith('.') ? name : extname(name);
  formats.add(format);
  const contents = await Bun.file(join(skill, file)).text();
  const sentinel = `CANON_CANARY_${format.slice(1).toUpperCase()}_V1`;
  assert.deepEqual(contents.match(/CANON_CANARY_[A-Z0-9_]+_V1/g), [sentinel], file);
}
for (const format of ['.md', '.js', '.json', '.txt', '.yml', '.ps1', '.vue', '.prettierignore']) {
  assert.ok(formats.has(format), `missing original pilot format ${format}`);
}
JS
```
