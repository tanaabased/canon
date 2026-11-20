# Bun pull request lint workflow

Use this workflow to run the repository's lint script on a pull request. Keep the read-only checkout, frozen dependency install, and the same command contributors run locally.

For a JavaScript repository, the lint script can combine ESLint and Prettier. When the repository owns TypeScript source, run its existing `typecheck` script as a separate step so a compiler error is recognizable in CI. For an OpenClaw plugin, this job checks the source without starting a Gateway. Keep installed-plugin checks in the workflow that prepares and runs the plugin.

Destination: `.github/workflows/pr-linter.yml`.

```yaml
name: Lint

on:
  pull_request:

permissions:
  contents: read

jobs:
  lint:
    runs-on: ubuntu-24.04
    steps:
      - name: Checkout code
        uses: actions/checkout@v7
      - name: Install Bun
        uses: tanaabased/actions/setup-bun@v1
      - name: Install dependencies
        run: bun install --frozen-lockfile --ignore-scripts
      - name: Run lint checks
        run: bun run lint
      # Add a separate `bun run typecheck` step when the repo owns TypeScript.
```
