# Native Codex Discovery and Cache Upgrade

Install the candidate npm payload in a disposable Codex home and marketplace, damage representative owned cache files, and synchronize them. A fresh native `skills/list` must discover the three reviewers after recovery. No model call or live installation is involved.

This scenario covers native discovery, retired-skill removal, required-resource restoration, and preservation of consumer-installed dependencies. Static payload validation remains in the package checks; executable authoring commands belong in [skill tools](../skill-tools/README.md). The Examples workflow supplies `CANON_TARBALL`, Bun, and Codex Tools. Codex Tools provisions its supported CLI; its pinned upstream helper owns the app-server protocol. Results cover hosted Ubuntu.

## Setup

```bash
# should extract the candidate and reuse the upstream native discovery helper
mkdir -p "$TMPDIR/package" "$TMPDIR/home" "$TMPDIR/marketplace"
tar -xzf "$CANON_TARBALL" -C "$TMPDIR/package" --strip-components=1
curl --fail --silent --show-error --location https://raw.githubusercontent.com/tanaabased/codex-tools/227b8682216599c382803d82c6bfb7e143e8d866/examples/native/fresh-skills.ts --output "$TMPDIR/fresh-skills.ts"

# should install the candidate into an isolated native marketplace
env HOME="$TMPDIR/home" CODEX_HOME="$TMPDIR/codex" XDG_CACHE_HOME="$TMPDIR/cache" ../../node_modules/.bin/codex-tools install "$TMPDIR/package" --marketplace canon-test --marketplace-path "$TMPDIR/marketplace/.agents/plugins/marketplace.json" | grep -F 'status: installed'
```

## Testing

```bash
# should restore owned resources and retire stale skills while preserving consumer dependencies
version="$(bun -p 'require(process.argv[1]).version' "$TMPDIR/package/.codex-plugin/plugin.json")"
cached="$TMPDIR/codex/plugins/cache/canon-test/tanaab/$version"
mkdir -p "$cached/skills/project-optimizer" "$cached/node_modules/local-sentinel"
cp "$cached/skills/project-review/SKILL.md" "$cached/skills/project-optimizer/SKILL.md"
printf '%s\n' 'consumer-owned' > "$cached/node_modules/local-sentinel/marker"
rm "$cached/references/plugin-runtime-contracts.md"
../../node_modules/.bin/codex-tools cache sync --repo-root "$TMPDIR/package" --codex-home "$TMPDIR/codex" --cache-path "$cached" --missing-target create
cmp "$TMPDIR/package/references/plugin-runtime-contracts.md" "$cached/references/plugin-runtime-contracts.md"
test ! -e "$cached/skills/project-optimizer"
test "$(cat "$cached/node_modules/local-sentinel/marker")" = 'consumer-owned'

# should discover the three enabled reviewers in a fresh native session after upgrade
codex_bins=("$TMPDIR/cache/codex-tools/codex/"*/*/codex)
test "${#codex_bins[@]}" -eq 1
env HOME="$TMPDIR/home" CODEX_HOME="$TMPDIR/codex" XDG_CACHE_HOME="$TMPDIR/cache" CODEX_TOOLS_TEST_CODEX="${codex_bins[0]}" bun "$TMPDIR/fresh-skills.ts" "$TMPDIR/home" tanaab:tanaab-project-review tanaab:tanaab-architecture-review tanaab:tanaab-testing-review
```
