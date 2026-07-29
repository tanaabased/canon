# Homebrew Freshness in GitHub Actions

GitHub-hosted runner images update on a cadence, while Homebrew serves live formula and bottle metadata. A runner can therefore have a Homebrew client that is older than the metadata it reads.

## When to Refresh

When a workflow installs dependencies through Homebrew, prefer an explicit update policy: set `HOMEBREW_NO_AUTO_UPDATE` to `1` at workflow or job scope so dependency commands do not update implicitly, then run an explicit freshness check immediately before the first installation. Clear the setting only for that freshness command:

```yaml
env:
  HOMEBREW_NO_AUTO_UPDATE: '1'

steps:
  - name: Refresh Homebrew when needed
    shell: bash
    run: HOMEBREW_NO_AUTO_UPDATE= brew update-if-needed
  - name: Install Homebrew dependencies
    shell: bash
    run: brew bundle --file "$GITHUB_WORKSPACE/Brewfile" --no-upgrade
```

- Apply the refresh on every runner platform that uses Homebrew unless the workflow owns a separately pinned or explicitly refreshed installation.
- Ensure Homebrew is on `PATH` before the refresh step on Linux runners.
- Keep the refresh immediately before the first Homebrew dependency installation so later workflow changes do not reintroduce a stale-client boundary.

## Boundaries

- Prefer `brew update-if-needed` to a hardcoded minimum Homebrew version, a retry of the same failed installation, or an unconditional `brew update`.
- Keep `HOMEBREW_NO_AUTO_UPDATE` set to `1` at workflow or job scope so every later Homebrew dependency command follows the same predictable no-implicit-update policy.
- The command-scoped empty `HOMEBREW_NO_AUTO_UPDATE` value allows this freshness check while preserving the workflow-level setting for subsequent commands. Homebrew skips automatic updates only when the value is non-empty, so the empty value permits `update-if-needed` without changing later steps.
- Treat Homebrew client and metadata freshness separately from dependency upgrades. Use `brew bundle --no-upgrade` when installed formulae should not be upgraded, recognizing that `brew install` may still upgrade a dependency when installation requires it.
- Skip this pattern when the workflow installs and pins its own Homebrew distribution or already performs an equivalent explicit refresh.
