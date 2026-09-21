# OpenClaw Installation

Install Canon's npm tarball in an isolated OpenClaw profile and verify native loading, skill discovery, and optional guidance. Run through the [Examples workflow](../../.github/workflows/pr-examples-tests.yml), which provides the pinned OpenClaw runtime and setup helpers without credentials or a live Gateway.

## Setup

```bash
# should prepare an unauthenticated openclaw profile
openclaw-setup

# should pack the plugin from the checkout
cd "$GITHUB_WORKSPACE"
npm pack --ignore-scripts --pack-destination "$TMPDIR" --json > "$TMPDIR/pack.json"
```

## Testing

```bash
# should load the packaged native plugin at its declared version
tarball="$TMPDIR/$(jq -r '.[0].filename' "$TMPDIR/pack.json")"
openclaw plugins install "$tarball" --accept-capabilities
openclaw plugins inspect tanaab --runtime --json | jq -e \
  --arg version "$(jq -r '.version' "$GITHUB_WORKSPACE/package.json")" \
  '.plugin | .status == "loaded" and .format == "openclaw" and .version == $version'

# should expose every canon skill to the model
expected=$(find "$GITHUB_WORKSPACE/skills" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sed 's/^/tanaab-/' | jq -Rsc 'split("\n")[:-1] | sort')
openclaw skills list --json | jq -e --argjson expected "$expected" \
  '[.skills[] | select(.name | startswith("tanaab-"))] | (map(.name) | sort) == $expected and all(.modelVisible)'

# should register guidance when conversation access is granted
openclaw config set plugins.entries.tanaab.hooks.allowConversationAccess true
openclaw plugins inspect tanaab --runtime --json | jq -e \
  '[.typedHooks[].name] == ["before_prompt_build"]'

# should retain the plugin when guidance is disabled
openclaw config set plugins.entries.tanaab.config.guidance false
openclaw plugins inspect tanaab --runtime --json | jq -e \
  '.plugin.status == "loaded" and .typedHooks == []'
```
