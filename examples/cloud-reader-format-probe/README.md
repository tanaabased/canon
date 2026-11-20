# Packaged Cloud Reader Samples

Check the canary files in the candidate npm tarball before probing the installed reader in a fresh Codex Cloud chat. The archive check verifies file paths and bytes. npm can omit `.gitignore`, so check that sample against the source and report its archive presence separately. Reader outcomes come from the Cloud probe.

## Setup

```bash
# should extract the candidate outside the checkout
mkdir -p "$TMPDIR/package"
tar -xzf "$CANON_TARBALL" -C "$TMPDIR/package" --strip-components=1
```

## Testing

```bash
# should preserve the indexed paths and sample bytes in the candidate archive
bun --no-install - "$TMPDIR/package/skills/cloud-reader-format-probe" <<'JS'
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
const skill = process.argv[2];
const source = '../../skills/cloud-reader-format-probe';
const indexPath = 'references/probe-index.json';
const archiveIndex = await readFile(join(skill, indexPath));
assert.deepEqual(archiveIndex, await readFile(join(source, indexPath)));
const index = JSON.parse(archiveIndex);
assert.ok(index.length >= 122, 'the complete private probe baseline is required');
assert.equal(new Set(index.map((sample) => sample.path)).size, index.length);
for (const sample of index) {
  const file = sample.path;
  assert.equal(file, `references/${basename(file)}`);
  const archiveFile = join(skill, file);
  const omittedByNpm = file === 'references/.gitignore' && !(await Bun.file(archiveFile).exists());
  const data = await readFile(omittedByNpm ? join(source, file) : archiveFile);
  assert.equal(data.length, sample.bytes, file);
  assert.equal(createHash('sha256').update(data).digest('hex'), sample.sha256, file);
  if (omittedByNpm) process.stdout.write(`${file} is present in source and absent from the npm archive.\n`);
}
assert.equal(await Bun.file(join(skill, 'references/absent.md')).exists(), false);
JS
```
